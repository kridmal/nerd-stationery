import Package from "../models/Package.js";
import { uploadProductImages } from "../utils/s3Uploader.js";

const parseJsonArray = (value, fallback = []) => {
  if (!value) return Array.isArray(value) ? value : fallback;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (_err) {
    return fallback;
  }
};

const toNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeBoolean = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  return value !== "false" && value !== false;
};

const normalizeImages = (primary, secondaryList = [], uploadedPrimary = [], uploadedSecondary = []) => {
  const retainedSecondary = parseJsonArray(secondaryList, []);
  const normalizedSecondary = [...retainedSecondary, ...uploadedSecondary].filter(Boolean);
  const normalizedPrimary = uploadedPrimary[0] || primary || normalizedSecondary[0] || "";
  return {
    primaryImage: normalizedPrimary,
    secondaryImages: normalizedSecondary,
  };
};

const handleServerError = (res, err, fallback) =>
  res.status(500).json({ message: err?.message || fallback });

const parseItems = (payload) => parseJsonArray(payload.items, payload.items || []);

const uploadAndNormalizeImages = async (payload, files, existing = {}) => {
  const uploadedPrimary = await uploadProductImages(files?.primaryImage || []);
  const uploadedSecondary = await uploadProductImages(files?.secondaryImages || []);
  return normalizeImages(
    payload.primaryImage || existing.primaryImage,
    payload.secondaryImages || payload.existingSecondaryImages || existing.secondaryImages,
    uploadedPrimary,
    uploadedSecondary
  );
};

export const createPackage = async (req, res) => {
  try {
    const payload = req.body || {};
    const { primaryImage, secondaryImages } = await uploadAndNormalizeImages(payload, req.files);
    const items = parseItems(payload);

    const pkg = await Package.create({
      packageCode: payload.packageCode,
      name: payload.name,
      shortDescription: payload.shortDescription,
      items,
      primaryImage,
      secondaryImages,
      packagePrice: toNumber(payload.packagePrice ?? payload.price, 0),
      totalOriginal: toNumber(payload.totalOriginal, 0),
      isActive: normalizeBoolean(payload.isActive, true),
    });
    res.status(201).json(pkg);
  } catch (err) {
    handleServerError(res, err, "Failed to create package");
  }
};

export const getPackages = async (_req, res) => {
  try {
    const packages = await Package.find().lean();
    res.json(packages);
  } catch (err) {
    handleServerError(res, err, "Failed to fetch packages");
  }
};

export const updatePackage = async (req, res) => {
  try {
    const payload = req.body || {};
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    const { primaryImage, secondaryImages } = await uploadAndNormalizeImages(
      payload,
      req.files,
      pkg
    );
    const items = parseItems(payload);

    if (payload.packageCode != null) pkg.packageCode = payload.packageCode;
    if (payload.name != null) pkg.name = payload.name;
    if (payload.shortDescription != null) pkg.shortDescription = payload.shortDescription;
    pkg.items = items;
    pkg.primaryImage = primaryImage;
    pkg.secondaryImages = secondaryImages;
    pkg.packagePrice = toNumber(payload.packagePrice ?? payload.price ?? pkg.packagePrice, pkg.packagePrice);
    pkg.totalOriginal = toNumber(payload.totalOriginal ?? pkg.totalOriginal, pkg.totalOriginal);
    pkg.isActive = normalizeBoolean(payload.isActive, pkg.isActive);

    const saved = await pkg.save();
    res.json(saved);
  } catch (err) {
    handleServerError(res, err, "Failed to update package");
  }
};

export const deletePackage = async (req, res) => {
  try {
    const deleted = await Package.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Package not found" });
    }
    res.json({ message: "Package deleted" });
  } catch (err) {
    handleServerError(res, err, "Failed to delete package");
  }
};
