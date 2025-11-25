import AlertSetting from "../models/AlertSetting.js";
import { isRootAdminRole } from "../utils/roles.js";
import { triggerLowStockAlertNow } from "../services/stockAlertService.js";

const HOURS = Array.from({ length: 24 }).map((_, idx) => idx.toString().padStart(2, "0"));
const isValidEmail = (email) =>
  typeof email === "string" &&
  email.trim().length > 3 &&
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

const ensureSettings = async () => {
  const existing = await AlertSetting.findOne();
  if (existing) return existing;
  return AlertSetting.create({});
};

export const getAlertSettings = async (req, res) => {
  try {
    if (!req.adminRole || !isRootAdminRole(req.adminRole)) {
      return res.status(403).json({ message: "Root admin access required" });
    }
    const settings = await ensureSettings();
    return res.json(settings);
  } catch (error) {
    console.error("Failed to fetch alert settings:", error);
    return res.status(500).json({ message: "Failed to fetch alert settings" });
  }
};

export const updateAlertSettings = async (req, res) => {
  try {
    if (!req.adminRole || !isRootAdminRole(req.adminRole)) {
      return res.status(403).json({ message: "Root admin access required" });
    }

    const { receiverEmail, ccEmails, sendHour } = req.body || {};

    if (!receiverEmail || !isValidEmail(receiverEmail)) {
      return res.status(400).json({ message: "A valid alert receiver email is required" });
    }

    if (!HOURS.includes(sendHour)) {
      return res.status(400).json({ message: "Send time must be an hour value between 00 and 23" });
    }

    const normalizedCc = Array.isArray(ccEmails)
      ? ccEmails
          .map((email) => (typeof email === "string" ? email.trim() : ""))
          .filter((email) => email && isValidEmail(email))
      : [];

    const settings = await ensureSettings();
    settings.receiverEmail = receiverEmail.trim();
    settings.ccEmails = normalizedCc;
    settings.sendHour = sendHour;
    await settings.save();

    return res.json(settings);
  } catch (error) {
    console.error("Failed to update alert settings:", error);
    return res.status(500).json({ message: "Failed to update alert settings" });
  }
};

export const getAllowedHours = () => HOURS;

export const runAlertNow = async (req, res) => {
  try {
    if (!req.adminRole || !isRootAdminRole(req.adminRole)) {
      return res.status(403).json({ message: "Root admin access required" });
    }
    const result = await triggerLowStockAlertNow();
    if (result?.status === "error") {
      return res.status(500).json({ message: result.error || "Failed to send alerts" });
    }
    return res.json(result);
  } catch (error) {
    console.error("Failed to run alert now:", error);
    return res.status(500).json({ message: "Failed to run alert now" });
  }
};
