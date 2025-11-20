import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadCart,
  saveCart,
  updateQuantity,
  removeFromCart,
  addToCart,
} from "../utils/cartUtils";
import { formatCurrency } from "../utils/productUtils";
import "./CartPage.css";

const formatPercent = (value) => `${Math.round(Number(value || 0))}%`;

const CartPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const handleQuantityChange = (slug, delta) => {
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

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.originalPrice || item.finalPrice || 0) * (item.quantity || 1),
      0
    );
    const finalTotal = items.reduce(
      (sum, item) => sum + Number(item.finalPrice || item.originalPrice || 0) * (item.quantity || 1),
      0
    );
    const discountTotal = Math.max(0, subtotal - finalTotal);
    const delivery = 0;
    const grandTotal = finalTotal + delivery;
    return { subtotal, finalTotal, discountTotal, delivery, grandTotal };
  }, [items]);

  const emptyState = (
    <div className="cart-empty">
      <p>Your cart is empty.</p>
      <button className="cart-btn" onClick={() => navigate("/products")}>
        Continue shopping
      </button>
    </div>
  );

  return (
    <div className="cart-page">
      <div className="cart-main">
        <h1>Shopping Cart</h1>
        {items.length === 0 ? (
          emptyState
        ) : (
          <div className="cart-items">
            {items.map((item) => {
              const discountValue = Math.max(
                0,
                Number(item.originalPrice || 0) - Number(item.finalPrice || 0)
              );
              const discountPercent =
                item.originalPrice && item.originalPrice > 0
                  ? (discountValue / item.originalPrice) * 100
                  : 0;
              return (
                <div className="cart-item" key={item.slug}>
                  <div className="cart-item__media">
                    <img
                      src={item.image}
                      alt={item.name}
                      width={90}
                      height={90}
                      loading="lazy"
                    />
                  </div>
                  <div className="cart-item__body">
                    <a
                      className="cart-item__name"
                      href={`/products/${item.slug}`}
                    >
                      {item.name}
                    </a>
                    {item.shortDescription && (
                      <p className="cart-item__desc">{item.shortDescription}</p>
                    )}
                    {item.variations && (
                      <div className="cart-item__variants">
                        {item.variations.brand && <span>Brand: {item.variations.brand}</span>}
                        {item.variations.size && <span>Size: {item.variations.size}</span>}
                        {item.variations.color && <span>Color: {item.variations.color}</span>}
                      </div>
                    )}
                    <div className="cart-item__pricing">
                      <div className="cart-item__price-block">
                        <span className="current">{formatCurrency(item.finalPrice)}</span>
                        {item.originalPrice && item.originalPrice > item.finalPrice && (
                          <span className="original">{formatCurrency(item.originalPrice)}</span>
                        )}
                        {discountValue > 0 && (
                          <span className="discount-badge">
                            {discountPercent > 0 ? formatPercent(discountPercent) : `Rs ${discountValue.toFixed(2)} off`}
                          </span>
                        )}
                      </div>
                      <div className="cart-item__qty">
                        <button onClick={() => handleQuantityChange(item.slug, -1)} disabled={item.quantity <= 1}>
                          -
                        </button>
                        <span>{item.quantity || 1}</span>
                        <button onClick={() => handleQuantityChange(item.slug, 1)}>+</button>
                      </div>
                    </div>
                    <button className="cart-item__remove" onClick={() => handleRemove(item.slug)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="cart-summary">
        <div className="cart-summary__card">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Item Discounts</span>
            <span className="discount">- {formatCurrency(totals.discountTotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{totals.delivery === 0 ? "Free" : formatCurrency(totals.delivery)}</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-row summary-row--total">
            <span>Grand Total</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>
          <button
            className="cart-btn cart-btn--primary"
            onClick={() => navigate("/checkout")}
            disabled={items.length === 0}
          >
            Proceed to Checkout
          </button>
          <button className="cart-btn" onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>
      </aside>
    </div>
  );
};

export default CartPage;
