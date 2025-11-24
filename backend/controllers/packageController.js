import Package from "../models/Package.js";

export const createPackage = async (req, res) => {
  try {
    const payload = req.body || {};
    const pkg = await Package.create({
      ...payload,
      packagePrice: payload.packagePrice ?? payload.price,
    });
    res.status(201).json(pkg);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create package" });
  }
};

export const getPackages = async (_req, res) => {
  try {
    const packages = await Package.find().lean();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch packages" });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const payload = req.body || {};
    const updated = await Package.findByIdAndUpdate(
      req.params.id,
      { ...payload, packagePrice: payload.packagePrice ?? payload.price },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Package not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update package" });
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
    res.status(500).json({ message: err.message || "Failed to delete package" });
  }
};
