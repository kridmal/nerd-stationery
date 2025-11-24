import express from "express";
import authAdmin, { requireRootAdmin } from "../middleware/authAdmin.js";
import { getAlertSettings, updateAlertSettings } from "../controllers/alertController.js";

const router = express.Router();

router.get("/settings", authAdmin, requireRootAdmin, getAlertSettings);
router.put("/settings", authAdmin, requireRootAdmin, updateAlertSettings);

export default router;
