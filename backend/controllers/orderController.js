import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user items.product packageSelected");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
