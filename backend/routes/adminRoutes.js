import express from "express";
import authAdmin, { requireRootAdmin } from "../middleware/authAdmin.js";
import {
  createAdmin,
  deleteAdmin,
  getCurrentAdmin,
  listAdmins,
  resetAdminPassword,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/me", authAdmin, getCurrentAdmin);
router.get("/", authAdmin, requireRootAdmin, listAdmins);
router.post("/", authAdmin, requireRootAdmin, createAdmin);
router.patch("/:id/password", authAdmin, resetAdminPassword);
router.delete("/:id", authAdmin, requireRootAdmin, deleteAdmin);

export default router;
