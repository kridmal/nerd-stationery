import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CheckoutPage.css";

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="checkout-page">
      <div className="checkout-main">
        <h1>Order Placed!</h1>
        <p>Your order has been placed successfully.</p>
        <p>Order Number: <strong>{orderId}</strong></p>
        <p>Expected Delivery: 3–5 days (express orders: 1–2 days)</p>
        <div className="checkout-actions">
          <button className="checkout-btn" onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
          <button className="checkout-btn ghost" onClick={() => navigate("/orders")}>
            View My Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
