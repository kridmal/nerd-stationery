import express from "express";
import {
  createPackage,
  deletePackage,
  getPackages,
  updatePackage,
} from "../controllers/packageController.js";

const router = express.Router();

// Create package
router.post("/", createPackage);

// Get all packages
router.get("/", getPackages);

// Update package
router.put("/:id", updatePackage);

// Delete package
router.delete("/:id", deletePackage);

export default router;
