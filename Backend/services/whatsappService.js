import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session stored in persistent backend directory; shared across all users and accounts
const SESSION_DIR = process.env.VERCEL
  ? path.join("/tmp", "whatsapp_session")
  : path.join(__dirname, "../whatsapp_session");

let sock = null;
let qrCodeData = null;
let connectionStatus = "disconnected";
let connectedNumber = null;
let isInitializing = false;
let reconnectAttempts = 0;
let keepAliveInterval = null;

const MAX_RECONNECT_DELAY = 15000;

function getReconnectDelay() {
  const delay = Math.min(2000 * Math.pow(1.3, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  return delay;
}

function startKeepAlive() {
  if (keepAliveInterval) return;
  // Subtle socket ping every 60s to ensure socket stays alive without spamming presence
  keepAliveInterval = setInterval(async () => {
    if (sock && connectionStatus === "connected") {
      try {
        if (sock.ws && sock.ws.readyState === 1) {
          // Native ping
          sock.ws.ping();
        }
      } catch {}
    }
  }, 60000);
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

function safelyCloseSocket() {
  if (sock) {
    try {
      sock.ev?.removeAllListeners?.();
      sock.end?.();
      if (sock.ws) {
        sock.ws.close();
      }
    } catch {}
    sock = null;
  }
}

export const getWhatsAppStatus = () => ({
  status: connectionStatus,
  qrCode: qrCodeData,
  phoneNumber: connectedNumber,
  isShared: true, // Shared across all accounts
  sessionPersisted: fs.existsSync(path.join(SESSION_DIR, "creds.json")),
});

export const waitForWhatsAppQrOrReady = async (timeoutMs = 7000) => {
  if (connectionStatus === "connected" || (connectionStatus === "scan_qr" && qrCodeData)) {
    return getWhatsAppStatus();
  }
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (connectionStatus === "connected" || (connectionStatus === "scan_qr" && qrCodeData)) {
      return getWhatsAppStatus();
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return getWhatsAppStatus();
};

export const initWhatsApp = async (forceRestart = false) => {
  // If already connected, do not reinitialize
  if (connectionStatus === "connected") {
    return;
  }

  // If already initializing, wait
  if (isInitializing) {
    return;
  }

  // If already waiting for QR scan and we have a valid QR code, don't recreate socket
  if (!forceRestart && connectionStatus === "scan_qr" && qrCodeData && sock) {
    return;
  }

  isInitializing = true;

  try {
    if (forceRestart) {
      safelyCloseSocket();
    }

    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    let waVersion = [2, 3000, 1015901307];
    try {
      const v = await fetchLatestWaWebVersion();
      if (v?.version) waVersion = v.version;
    } catch {
      // Fallback
    }

    const logger = pino({ level: "error" });

    // Use Chrome web browser profile (required by WhatsApp for pairing code acceptance)
    sock = makeWASocket({
      version: waVersion,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      logger,
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      defaultQueryTimeoutMs: 60000,
      emitOwnEvents: false,
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 5,
    });

    sock.ev.on("creds.update", async () => {
      try {
        await saveCreds();
      } catch (err) {
        console.error("[WhatsApp] Failed to save creds:", err.message);
      }
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          qrCodeData = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
          connectionStatus = "scan_qr";
          isInitializing = false;
        } catch {
          qrCodeData = null;
        }
      }

      if (connection === "open") {
        connectionStatus = "connected";
        qrCodeData = null;
        reconnectAttempts = 0;
        connectedNumber = sock.user?.id ? sock.user.id.split(":")[0].replace(/[^0-9]/g, "") : null;
        isInitializing = false;
        startKeepAlive();
        console.log(`[WhatsApp] Successfully connected (Shared Account): +${connectedNumber}`);
      }

      if (connection === "close") {
        stopKeepAlive();
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        connectionStatus = "disconnected";
        connectedNumber = null;
        isInitializing = false;

        if (statusCode === DisconnectReason.loggedOut) {
          console.warn("[WhatsApp] Device unlinked by user from WhatsApp. Clearing session...");
          try {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          } catch {}
          reconnectAttempts = 0;
          setTimeout(() => initWhatsApp(true), 2000);
        } else if (statusCode === DisconnectReason.restartRequired) {
          console.log("[WhatsApp] Restart required. Reconnecting immediately...");
          reconnectAttempts = 0;
          initWhatsApp(false);
        } else {
          // Automatic resilient reconnect on network drops / socket timeouts
          const delay = getReconnectDelay();
          console.log(`[WhatsApp] Connection dropped (code: ${statusCode || "unknown"}). Auto-reconnecting in ${Math.round(delay / 1000)}s...`);
          setTimeout(() => initWhatsApp(false), delay);
        }
      }
    });
  } catch (err) {
    console.error("[WhatsApp] Init error:", err.message);
    connectionStatus = "disconnected";
    isInitializing = false;
    const delay = getReconnectDelay();
    setTimeout(() => initWhatsApp(false), delay);
  }
};

export function normalizeWhatsAppNumber(phone) {
  if (!phone) return "";
  let digits = phone.toString().replace(/[^0-9]/g, "");
  digits = digits.replace(/^0+/, ""); // strip leading zeros
  if (digits.startsWith("91") && digits.length === 12) {
    return digits;
  }
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export const requestPairingCodeForNumber = async (phoneNumber) => {
  const fullNumber = normalizeWhatsAppNumber(phoneNumber);
  if (!fullNumber || fullNumber.length < 10) {
    throw new Error("Invalid phone number. Please enter a valid 10-digit mobile number.");
  }

  // If already connected, disconnect first
  if (connectionStatus === "connected") {
    await disconnectWhatsApp();
    await new Promise((r) => setTimeout(r, 600));
  }

  // Clear stale session files to ensure registration keys are fresh
  stopKeepAlive();
  safelyCloseSocket();
  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }
  } catch {}
  qrCodeData = null;
  connectionStatus = "disconnected";
  connectedNumber = null;
  isInitializing = false;

  await initWhatsApp(true);

  // Wait until socket connection has completed handshake and is ready for pairing code
  let waitedMs = 0;
  while ((!sock || (connectionStatus !== "scan_qr" && !qrCodeData)) && waitedMs < 16000) {
    await new Promise((r) => setTimeout(r, 350));
    waitedMs += 350;
  }

  if (!sock) {
    throw new Error("WhatsApp connection timeout. Please try again or use QR code scan.");
  }

  // Stabilization delay to ensure WebSocket handshake is fully open
  await new Promise((r) => setTimeout(r, 800));

  console.log(`[WhatsApp] Requesting fresh pairing code for +${fullNumber}...`);
  const rawCode = await sock.requestPairingCode(fullNumber);
  console.log(`[WhatsApp] Pairing code generated successfully: ${rawCode}`);

  const formattedCode =
    rawCode && rawCode.length === 8
      ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`
      : rawCode;

  return formattedCode;
};

export const disconnectWhatsApp = async () => {
  stopKeepAlive();
  try {
    if (sock) await sock.logout();
  } catch {}
  safelyCloseSocket();
  try {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  } catch {}
  qrCodeData = null;
  connectionStatus = "disconnected";
  connectedNumber = null;
  isInitializing = false;
  reconnectAttempts = 0;
  // Start fresh QR generation after 1s
  setTimeout(() => initWhatsApp(true), 1000);
  return { success: true };
};

export const sendWhatsAppMessage = async (recipientPhone, textMessage) => {
  if (!sock || connectionStatus !== "connected") {
    return { success: false, message: "WhatsApp not linked via QR code" };
  }

  try {
    const fullNumber = normalizeWhatsAppNumber(recipientPhone);
    if (!fullNumber || fullNumber.length < 10) {
      return { success: false, message: "Invalid phone number" };
    }

    let jid = `${fullNumber}@s.whatsapp.net`;
    try {
      if (sock && typeof sock.onWhatsApp === "function") {
        const [waCheck] = await sock.onWhatsApp(fullNumber);
        if (waCheck?.exists && waCheck.jid) {
          jid = waCheck.jid;
        }
      }
    } catch {}

    await sock.sendMessage(jid, { text: textMessage });
    return { success: true };
  } catch (error) {
    console.error(`[WhatsApp] Failed to send message to ${recipientPhone}:`, error.message);
    return { success: false, message: error.message };
  }
};

export const sendWhatsAppDocument = async (recipientPhone, documentBuffer, fileName = "Invoice.pdf", caption = "") => {
  if (!sock || connectionStatus !== "connected") {
    console.warn("[WhatsApp] Cannot send PDF: WhatsApp socket not connected");
    return { success: false, message: "WhatsApp not linked via QR code" };
  }

  try {
    const fullNumber = normalizeWhatsAppNumber(recipientPhone);
    if (!fullNumber || fullNumber.length < 10) {
      return { success: false, message: "Invalid phone number" };
    }

    let jid = `${fullNumber}@s.whatsapp.net`;
    try {
      if (sock && typeof sock.onWhatsApp === "function") {
        const [waCheck] = await sock.onWhatsApp(fullNumber);
        if (waCheck?.exists && waCheck.jid) {
          jid = waCheck.jid;
        }
      }
    } catch {}

    const finalBuffer = Buffer.isBuffer(documentBuffer) ? documentBuffer : Buffer.from(documentBuffer);
    
    console.log(`[WhatsApp] Sending PDF document (${finalBuffer.length} bytes) to ${jid}...`);
    await sock.sendMessage(jid, {
      document: finalBuffer,
      mimetype: "application/pdf",
      fileName: fileName || "Invoice.pdf",
      caption: caption || "",
    });
    console.log(`[WhatsApp] PDF document successfully delivered to ${jid}`);
    return { success: true };
  } catch (error) {
    console.error(`[WhatsApp] Failed to send PDF document to ${recipientPhone}:`, error.message);
    return { success: false, message: error.message };
  }
};


