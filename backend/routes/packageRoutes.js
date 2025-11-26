import express from "express";
import upload from "../middleware/upload.js";
import {
  createPackage,
  deletePackage,
  getPackages,
  updatePackage,
} from "../controllers/packageController.js";

const router = express.Router();

// Create package
router.post(
  "/",
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "secondaryImages", maxCount: 10 },
  ]),
  createPackage
);

// Get all packages
router.get("/", getPackages);

// Update package
router.put(
  "/:id",
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "secondaryImages", maxCount: 10 },
  ]),
  updatePackage
);

// Delete package
router.delete("/:id", deletePackage);

export default router;
