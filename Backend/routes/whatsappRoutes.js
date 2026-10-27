import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getWhatsAppStatus,
  waitForWhatsAppQrOrReady,
  initWhatsApp,
  disconnectWhatsApp,
  sendWhatsAppMessage,
} from "../services/whatsappService.js";

const router = express.Router();

router.use(protect);

router.get("/status", async (req, res) => {
  const globalStatus = getWhatsAppStatus();
  const user = req.user;

  // Determine user-specific WhatsApp linking status
  let userStatus = "disconnected";
  let userPhone = user.whatsappLinkedNumber || null;

  if (globalStatus.status === "connected") {
    // If user has confirmed linked or global is connected
    if (user.whatsappLinked || !user.whatsappLinkedNumber) {
      userStatus = "connected";
      userPhone = globalStatus.phoneNumber || user.whatsappLinkedNumber;
      if (!user.whatsappLinked) {
        user.whatsappLinked = true;
        user.whatsappLinkedNumber = userPhone;
        await user.save().catch(() => {});
      }
    }
  } else if (globalStatus.status === "scan_qr") {
    userStatus = "scan_qr";
  }

  return res.status(200).json({
    success: true,
    status: userStatus,
    qrCode: globalStatus.qrCode,
    phoneNumber: userPhone,
    isLinkedForUser: userStatus === "connected",
  });
});

router.post("/init", async (req, res) => {
  const force = req.body?.force === true;
  await initWhatsApp(force);
  const status = await waitForWhatsAppQrOrReady(7000);
  return res.status(200).json({ success: true, ...status });
});

router.post("/pairing-code", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone number is required" });
  }
  try {
    const { requestPairingCodeForNumber } = await import("../services/whatsappService.js");
    const code = await requestPairingCodeForNumber(phone);
    if (req.user) {
      req.user.whatsappLinkedNumber = phone;
      await req.user.save().catch(() => {});
    }
    return res.status(200).json({ success: true, code });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/disconnect", async (req, res) => {
  // Mark this specific user as disconnected
  if (req.user) {
    req.user.whatsappLinked = false;
    req.user.whatsappLinkedNumber = "";
    await req.user.save().catch(() => {});
  }
  const result = await disconnectWhatsApp();
  return res.status(200).json({ success: true, status: "disconnected" });
});

router.post("/test", async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, message: "Phone and message required" });
  }
  const result = await sendWhatsAppMessage(phone, message);
  return res.status(result.success ? 200 : 400).json(result);
});

export default router;
