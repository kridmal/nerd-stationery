import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createProductSlug } from "../utils/slug.js";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

export const createOrder = async (req, res) => {
  try {
    const { items = [], delivery, paymentMethod = "cod", deliveryFee = 0 } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }
    if (!delivery || !delivery.name || !delivery.address) {
      return res.status(400).json({ message: "Delivery details are required" });
    }

    const productIds = items.map((i) => i.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const prod = productMap.get(String(item.productId));
      if (!prod) {
        return res.status(404).json({ message: `Product not found for item ${item.productId}` });
      }
      const quantity = Math.max(1, toNumber(item.quantity, 1));
      if (quantity > prod.quantity) {
        return res
          .status(400)
          .json({ message: `Only ${prod.quantity} items left in stock for ${prod.name}.` });
      }

      const originalPrice = toNumber(prod.originalPrice, prod.finalPrice);
      const finalPrice = toNumber(prod.finalPrice, prod.originalPrice);
      subtotal += originalPrice * quantity;

      normalizedItems.push({
        product: prod._id,
        name: prod.name,
        slug: createProductSlug(prod.name || prod.itemCode || prod._id),
        image: Array.isArray(prod.images) && prod.images.length ? prod.images[0] : "",
        quantity,
        price: finalPrice,
        originalPrice,
        discountType: prod.discountType || "none",
        discountValue: prod.discountValue || 0,
        variations: prod.variations || null,
      });
    }

    const discountTotal = Math.max(
      0,
      subtotal -
        normalizedItems.reduce((acc, item) => acc + toNumber(item.price, item.originalPrice) * item.quantity, 0)
    );
    const grandTotal =
      normalizedItems.reduce(
        (acc, item) => acc + toNumber(item.price, item.originalPrice) * item.quantity,
        0
      ) + toNumber(deliveryFee, 0);

    const order = new Order({
      items: normalizedItems,
      delivery,
      paymentMethod,
      subtotal,
      discountTotal,
      deliveryFee: toNumber(deliveryFee, 0),
      grandTotal,
      status: "pending",
    });

    await order.save();

    // reduce stock
    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to place order" });
  }
};

export const getOrders = async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
