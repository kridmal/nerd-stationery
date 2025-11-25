import nodemailer from "nodemailer";
import Product from "../models/Product.js";
import AlertSetting from "../models/AlertSetting.js";
import { getAllowedHours } from "../controllers/alertController.js";

const HOURS = getAllowedHours();
let transport = null;
let schedulerHandle = null;
let inFlight = false;

const buildTransport = () => {
  if (transport) return transport;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn("SMTP config missing (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS). Email alerts disabled.");
    return null;
  }
  const secure = port === 465;
  transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transport;
};

const ensureSettings = async () => {
  const existing = await AlertSetting.findOne();
  if (existing) return existing;
  return AlertSetting.create({});
};

const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const tableStyles = `
  table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }
  th { background: #0b4f6c; color: #fff; padding: 10px; text-align: left; }
  td { padding: 10px; border: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #f8fafc; }
  tr:nth-child(odd) { background: #ffffff; }
`;

const buildTable = (rows) => {
  const header = `
    <tr>
      <th>Item Code</th>
      <th>Item Name</th>
      <th>Current Quantity</th>
      <th>Minimum Level</th>
      <th>Status</th>
    </tr>
  `;
  const body = rows
    .map(
      (row) => `
      <tr>
        <td>${row.itemCode}</td>
        <td>${row.name}</td>
        <td>${row.quantity}</td>
        <td>${row.minQuantity}</td>
        <td>${row.status}</td>
      </tr>
    `
    )
    .join("");
  return `
    <style>${tableStyles}</style>
    <table>${header}${body}</table>
  `;
};

const buildLowStockEmail = (rows) => {
  const date = formatDate();
  return {
    subject: `⚠️ Low Stock Alert - ${date}`,
    html: `
      <p>The following items are below the minimum level:</p>
      ${buildTable(rows)}
      <p style="margin-top:12px;color:#555;">Status = LOW STOCK</p>
    `,
  };
};

const buildOutOfStockEmail = (rows) => {
  const date = formatDate();
  return {
    subject: `🔴 OUT OF STOCK - ${date}`,
    html: `
      <p>The following items are out of stock:</p>
      ${buildTable(rows)}
      <p style="margin-top:12px;color:#555;">Status = LOW STOCK</p>
    `,
  };
};

const fetchStockData = async () => {
  const products = await Product.find({ minQuantity: { $gt: 0 } }).select("itemCode name quantity minQuantity");
  const lowStock = [];
  const outOfStock = [];

  products.forEach((p) => {
    const qty = Number(p.quantity || 0);
    const min = Number(p.minQuantity || 0);
    if (qty < min && qty > 0) {
      lowStock.push({
        itemCode: p.itemCode || "N/A",
        name: p.name || "N/A",
        quantity: qty,
        minQuantity: min,
        status: "LOW STOCK",
      });
    }
    if (qty === 0 && min > 0) {
      outOfStock.push({
        itemCode: p.itemCode || "N/A",
        name: p.name || "N/A",
        quantity: qty,
        minQuantity: min,
        status: "LOW STOCK",
      });
    }
  });

  return { lowStock, outOfStock };
};

const sendEmail = async ({ to, cc = [], subject, html }) => {
  const transporter = buildTransport();
  if (!transporter) {
    console.warn("Email skipped because transporter is not configured.");
    return;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to,
    cc,
    subject,
    html,
  });
};

const markSentToday = async (settings, today) => {
  settings.lastSentDate = today;
  await settings.save();
};

export const runAlertCycle = async ({ force = false, skipMark = false } = {}) => {
  if (inFlight) return { status: "skipped", reason: "in-flight" };
  inFlight = true;
  try {
    const settings = await ensureSettings();
    if (!settings.receiverEmail) return { status: "skipped", reason: "no receiver" };

    const transporter = buildTransport();
    if (!transporter) return { status: "skipped", reason: "no transporter" };

    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, "0");
    const todayKey = now.toISOString().slice(0, 10);

    if (!force) {
      if (!HOURS.includes(settings.sendHour)) return { status: "skipped", reason: "invalid send hour" };
      if (settings.lastSentDate === todayKey) return { status: "skipped", reason: "already sent today" };
      if (currentHour !== settings.sendHour) return { status: "skipped", reason: "not send hour" };
    }

    const { lowStock, outOfStock } = await fetchStockData();

    if (lowStock.length === 0 && outOfStock.length === 0) {
      if (!skipMark) await markSentToday(settings, todayKey);
      return { status: "skipped", reason: "no stock issues" };
    }

    const ccList = settings.ccEmails || [];
    let sent = 0;
    if (lowStock.length > 0) {
      const email = buildLowStockEmail(lowStock);
      await sendEmail({ to: settings.receiverEmail, cc: ccList, ...email });
      sent += 1;
    }
    if (outOfStock.length > 0) {
      const email = buildOutOfStockEmail(outOfStock);
      await sendEmail({ to: settings.receiverEmail, cc: ccList, ...email });
      sent += 1;
    }

    if (!skipMark) await markSentToday(settings, todayKey);

    return {
      status: "sent",
      sentEmails: sent,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      forced: force,
    };
  } catch (error) {
    console.error("Stock alert cycle failed:", error);
    return { status: "error", error: error?.message || String(error) };
  } finally {
    inFlight = false;
  }
};

export const initLowStockAlertScheduler = () => {
  if (schedulerHandle) return schedulerHandle;
  schedulerHandle = setInterval(() => runAlertCycle(), 60 * 1000); // check every minute
  console.log("Low-stock alert scheduler initialized (checks every minute).");
  return schedulerHandle;
};

export const stopLowStockAlertScheduler = () => {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
};

export const triggerLowStockAlertNow = async () => runAlertCycle({ force: true, skipMark: true });
