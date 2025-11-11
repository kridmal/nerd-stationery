import Package from "../models/Package.js";

export const createPackage = async (req, res) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPackages = async (req, res) => {
  try {
    const packages = await Package.find().populate("products");
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
