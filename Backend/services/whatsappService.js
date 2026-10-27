import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  fetchLatestWaWebVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always use /tmp on Vercel, local folder otherwise
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

const MAX_RECONNECT_DELAY = 30000;

function getReconnectDelay() {
  const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  return delay;
}

function startKeepAlive() {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(async () => {
    if (sock && connectionStatus === "connected") {
      try {
        await sock.sendPresenceUpdate("available");
      } catch {}
    }
  }, 25000);
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
    // If forcing restart or starting fresh, close previous socket cleanly
    if (forceRestart) {
      safelyCloseSocket();
    }

    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    // Check for corrupt un-registered state
    const credsPath = path.join(SESSION_DIR, "creds.json");
    if (fs.existsSync(credsPath)) {
      try {
        const raw = fs.readFileSync(credsPath, "utf8");
        const creds = JSON.parse(raw);
        if (creds?.me && creds.registered === false) {
          console.log("[WhatsApp] Found incomplete registration in session. Clearing stale files...");
          fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          fs.mkdirSync(SESSION_DIR, { recursive: true });
        }
      } catch {}
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    let waVersion = undefined;
    try {
      const v = await fetchLatestWaWebVersion();
      if (v?.version) waVersion = v.version;
    } catch {
      // Fallback to baileys default if fetch fails
    }

    sock = makeWASocket({
      version: waVersion,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: "warn" }),
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      defaultQueryTimeoutMs: 60000,
    });

    sock.ev.on("creds.update", saveCreds);

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
        console.log(`[WhatsApp] Successfully connected: +${connectedNumber}`);
      }

      if (connection === "close") {
        stopKeepAlive();
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        connectionStatus = "disconnected";
        connectedNumber = null;
        isInitializing = false;

        if (isLoggedOut) {
          console.log("[WhatsApp] Logged out from device. Clearing session...");
          try {
            fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          } catch {}
          reconnectAttempts = 0;
          setTimeout(() => initWhatsApp(true), 1500);
        } else if (statusCode === DisconnectReason.restartRequired) {
          console.log("[WhatsApp] Restart required during device linking. Reconnecting immediately...");
          reconnectAttempts = 0;
          initWhatsApp(false);
        } else {
          const delay = Math.min(2500, getReconnectDelay());
          console.log(`[WhatsApp] Connection closed (code: ${statusCode}). Reconnecting in ${Math.round(delay / 1000)}s...`);
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
  digits = digits.replace(/^0+/, ""); // strip leading zeros (e.g. 09876543210 -> 9876543210)
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

  // If already connected, disconnect first so we can link device cleanly
  if (connectionStatus === "connected") {
    await disconnectWhatsApp();
    await new Promise((r) => setTimeout(r, 800));
  }

  // Ensure fresh initialization if socket is missing or disconnected
  if (!sock || connectionStatus === "disconnected") {
    await initWhatsApp(true);
  }

  // Wait until socket connection has completed handshake and is ready for QR/pairing code
  let waitedMs = 0;
  while ((!sock || (connectionStatus !== "scan_qr" && !qrCodeData)) && waitedMs < 16000) {
    await new Promise((r) => setTimeout(r, 400));
    waitedMs += 400;
  }

  if (!sock) {
    throw new Error("WhatsApp socket initialization failed. Please try again.");
  }

  // Brief stabilization delay to ensure handshake is fully ready
  await new Promise((r) => setTimeout(r, 600));

  console.log(`[WhatsApp] Requesting pairing code for +${fullNumber}...`);
  const rawCode = await sock.requestPairingCode(fullNumber);
  console.log(`[WhatsApp] Pairing code generated successfully: ${rawCode}`);

  // Format as ABCD-EFGH for convenient user input into WhatsApp
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


