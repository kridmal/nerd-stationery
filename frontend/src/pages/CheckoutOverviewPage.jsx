import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadCart, saveCart, removeFromCart } from "../utils/cartUtils";
import { formatCurrency, createProductSlug } from "../utils/productUtils";
import { getProducts } from "../services/api";
import { setCheckoutSession } from "../utils/checkoutSession";
import "./CheckoutPage.css";

const statusMessage = (available) =>
  available > 0 ? `Only ${available} items left in stock.` : "Out of stock.";

const CheckoutOverviewPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stockMap, setStockMap] = useState({});

  useEffect(() => {
    setItems(loadCart());
  }, []);

  useEffect(() => {
    const fetchStock = async () => {
      const products = await getProducts();
      const map = {};
      (products || []).forEach((p) => {
        const slug = createProductSlug(p.name || p.itemCode || p._id);
        map[slug] = p.quantity ?? 0;
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

  const handleQuantity = (slug, delta) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.slug === slug
          ? { ...item, quantity: Math.max(1, Number(item.quantity || 1) + delta) }
          : item
      );
      saveCart(updated);
      return updated;
    });
  };

  const handleRemove = (slug) => {
    const updated = removeFromCart(slug);
    setItems(updated);
  };

  const hasStockIssue = useMemo(
    () =>
      items.some((item) => {
        const available = stockMap[item.slug];
        return available != null && item.quantity > available;
      }),
    [items, stockMap]
  );

  const proceed = () => {
    setCheckoutSession({ items });
    navigate("/checkout/delivery");
  };

  if (!items.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-main">
          <h1>Checkout</h1>
          <p>Your cart is empty.</p>
          <button className="checkout-btn" onClick={() => navigate("/products")}>
            Back to shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-main">
        <h1>Order Summary</h1>
        <div className="checkout-list">
          {items.map((item) => {
            const available = stockMap[item.slug];
            const overLimit = available != null && item.quantity > available;
            return (
              <div key={item.slug} className="checkout-row">
                <img src={item.image} alt={item.name} />
                <div className="checkout-row__info">
                  <a href={`/products/${item.slug}`} className="checkout-row__name">
                    {item.name}
                  </a>
                  {item.shortDescription && (
                    <p className="checkout-row__desc">{item.shortDescription}</p>
                  )}
                  {item.variations && (
                    <div className="checkout-row__variants">
                      {item.variations.brand && <span>Brand: {item.variations.brand}</span>}
                      {item.variations.size && <span>Size: {item.variations.size}</span>}
                      {item.variations.color && <span>Color: {item.variations.color}</span>}
                    </div>
                  )}
                  <div className="checkout-row__pricing">
                    <span className="current">{formatCurrency(item.finalPrice)}</span>
                    {item.originalPrice && item.originalPrice > item.finalPrice && (
                      <span className="original">{formatCurrency(item.originalPrice)}</span>
                    )}
                  </div>
                  {available != null && (
                    <p className={`stock-msg ${overLimit ? "stock-msg--warn" : ""}`}>
                      {overLimit ? statusMessage(available) : `In stock: ${available}`}
                    </p>
                  )}
                </div>
                <div className="checkout-row__qty">
                  <button onClick={() => handleQuantity(item.slug, -1)} disabled={item.quantity <= 1}>
                    -
                  </button>
                  <span>{item.quantity || 1}</span>
                  <button onClick={() => handleQuantity(item.slug, 1)}>+</button>
                </div>
                <div className="checkout-row__subtotal">
                  {formatCurrency((item.finalPrice || 0) * (item.quantity || 1))}
                </div>
                <button className="checkout-row__remove" onClick={() => handleRemove(item.slug)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
        <div className="checkout-actions">
          <button className="checkout-btn ghost" onClick={() => navigate("/cart")}>
            Back to Cart
          </button>
          <button
            className="checkout-btn"
            onClick={proceed}
            disabled={hasStockIssue}
            title={hasStockIssue ? "Fix stock issues before proceeding" : ""}
          >
            Continue to Delivery Information
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

export default CheckoutOverviewPage;
