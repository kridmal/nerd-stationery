import express from "express";
import authAdmin, { requireRootAdmin } from "../middleware/authAdmin.js";
import { getAlertSettings, updateAlertSettings, runAlertNow } from "../controllers/alertController.js";

const router = express.Router();

router.get("/settings", authAdmin, requireRootAdmin, getAlertSettings);
router.put("/settings", authAdmin, requireRootAdmin, updateAlertSettings);
router.post("/run-now", authAdmin, requireRootAdmin, runAlertNow);

export default router;
