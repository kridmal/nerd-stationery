import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createProductSlug } from "../utils/slug.js";

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const badRequest = (res, message) => res.status(400).json({ message });
const notFound = (res, message) => res.status(404).json({ message });
const serverError = (res, message) => res.status(500).json({ message });
const firstImage = (product) =>
  Array.isArray(product.images) && product.images.length ? product.images[0] : "";
const lineTotal = (item) => toNumber(item.price, item.originalPrice) * item.quantity;

export const createOrder = async (req, res) => {
  try {
    const { items = [], delivery, paymentMethod = "cod", deliveryFee = 0 } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return badRequest(res, "No items provided");
    if (!delivery || !delivery.name || !delivery.address) {
      return badRequest(res, "Delivery details are required");
    }

    const productIds = items.map((i) => i.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const prod = productMap.get(String(item.productId));
      if (!prod) {
        return notFound(res, `Product not found for item ${item.productId}`);
      }
      const quantity = Math.max(1, toNumber(item.quantity, 1));
      if (quantity > prod.quantity) {
        return badRequest(res, `Only ${prod.quantity} items left in stock for ${prod.name}.`);
      }

      const originalPrice = toNumber(prod.originalPrice, prod.finalPrice);
      const finalPrice = toNumber(prod.finalPrice, prod.originalPrice);
      subtotal += originalPrice * quantity;

      normalizedItems.push({
        product: prod._id,
        name: prod.name,
        slug: createProductSlug(prod.name || prod.itemCode || prod._id),
        image: firstImage(prod),
        quantity,
        price: finalPrice,
        originalPrice,
        discountType: prod.discountType || "none",
        discountValue: prod.discountValue || 0,
        variations: prod.variations || null,
      });
    }

    const itemsTotal = normalizedItems.reduce((acc, item) => acc + lineTotal(item), 0);
    const deliveryFeeValue = toNumber(deliveryFee, 0);
    const discountTotal = Math.max(0, subtotal - itemsTotal);
    const grandTotal = itemsTotal + deliveryFeeValue;

    const order = new Order({
      items: normalizedItems,
      delivery,
      paymentMethod,
      subtotal,
      discountTotal,
      deliveryFee: deliveryFeeValue,
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
    serverError(res, "Failed to place order");
  }
};

export const getOrders = async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    serverError(res, "Failed to fetch orders");
  }
};
