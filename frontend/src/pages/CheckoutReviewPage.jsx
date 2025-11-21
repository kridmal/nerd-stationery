import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadCart } from "../utils/cartUtils";
import { getCheckoutSession, clearCheckoutSession } from "../utils/checkoutSession";
import { formatCurrency, createProductSlug } from "../utils/productUtils";
import { createOrder, getProducts } from "../services/api";
import "./CheckoutPage.css";

const CheckoutReviewPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockMap, setStockMap] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(loadCart());
    const session = getCheckoutSession();
    if (session?.delivery) setDelivery(session.delivery);
    else navigate("/checkout/delivery");
  }, [navigate]);

  useEffect(() => {
    const fetchStock = async () => {
      const products = await getProducts();
      const map = {};
      (products || []).forEach((p) => {
        const slug = createProductSlug(p.name || p.itemCode || p._id);
        map[slug] = { available: p.quantity || 0, id: p._id };
      });
      setStockMap(map);
    };
    fetchStock();
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.originalPrice || item.finalPrice || 0) * (item.quantity || 1),
      0
    );
    const finalTotal = items.reduce(
      (sum, item) => sum + Number(item.finalPrice || item.originalPrice || 0) * (item.quantity || 1),
      0
    );
    return { subtotal, discount: Math.max(0, subtotal - finalTotal), total: finalTotal };
  }, [items]);

  const hasStockIssue = useMemo(
    () =>
      items.some((item) => {
        const stock = stockMap[item.slug]?.available;
        return stock != null && item.quantity > stock;
      }),
    [items, stockMap]
  );

  const placeOrder = async () => {
    setError("");
    if (hasStockIssue) {
      setError("Fix stock issues before placing the order.");
      return;
    }
    if (!delivery) {
      navigate("/checkout/delivery");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        items: items.map((item) => ({
          productId: stockMap[item.slug]?.id,
          quantity: item.quantity,
        })),
        delivery,
        paymentMethod: "cod",
        deliveryFee: delivery.deliveryOption === "express" ? 300 : 0,
      };
      const order = await createOrder(payload);
      clearCheckoutSession();
      navigate(`/order-success/${order._id || order.id || "new"}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-main">
        <h1>Review & Place Order</h1>
        {delivery && (
          <div className="delivery-summary">
            <h3>Delivery</h3>
            <p>{delivery.name}</p>
            <p>{delivery.address}</p>
            <p>
              {delivery.city}, {delivery.postalCode}
            </p>
            <p>{delivery.phone}</p>
            <p>{delivery.deliveryOption === "express" ? "Express (1–2 days)" : "Standard (3–5 days)"}</p>
          </div>
        )}
        <div className="checkout-list">
          {items.map((item) => {
            const stock = stockMap[item.slug]?.available;
            const overLimit = stock != null && item.quantity > stock;
            return (
              <div key={item.slug} className="checkout-row">
                <img src={item.image} alt={item.name} />
                <div className="checkout-row__info">
                  <a href={`/products/${item.slug}`} className="checkout-row__name">
                    {item.name}
                  </a>
                  <div className="checkout-row__pricing">
                    <span className="current">{formatCurrency(item.finalPrice)}</span>
                    {item.originalPrice && item.originalPrice > item.finalPrice && (
                      <span className="original">{formatCurrency(item.originalPrice)}</span>
                    )}
                  </div>
                  {stock != null && overLimit && (
                    <p className="stock-msg stock-msg--warn">Only {stock} items left in stock.</p>
                  )}
                </div>
                <div className="checkout-row__qty">
                  <span>{item.quantity}</span>
                </div>
                <div className="checkout-row__subtotal">
                  {formatCurrency((item.finalPrice || 0) * (item.quantity || 1))}
                </div>
              </div>
            );
          })}
        </div>
        {error && <p className="field-error">{error}</p>}
        <div className="checkout-actions">
          <button className="checkout-btn ghost" onClick={() => navigate("/checkout/delivery")}>
            Back to Delivery
          </button>
          <button className="checkout-btn" onClick={placeOrder} disabled={loading || hasStockIssue}>
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>
      </div>
      <aside className="checkout-summary">
        <div className="summary-card">
          <h3>Totals</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Item Discounts</span>
            <span className="discount">- {formatCurrency(totals.discount)}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CheckoutReviewPage;
