import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setCheckoutSession, getCheckoutSession } from "../utils/checkoutSession";
import "./CheckoutPage.css";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  deliveryOption: "standard",
};

const CheckoutDeliveryPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const session = getCheckoutSession();
    if (session?.delivery) {
      setForm({ ...initialForm, ...session.delivery });
    }
  }, []);

  const validate = () => {
    const nextErrors = {};
    ["name", "email", "phone", "address", "city", "postalCode"].forEach((field) => {
      if (!form[field]) nextErrors[field] = "Required";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setCheckoutSession({ delivery: form, paymentMethod: "cod" });
    navigate("/checkout/review");
  };

  return (
    <div className="checkout-page">
      <div className="checkout-main">
        <h1>Delivery Information</h1>
        <div className="delivery-form">
          {[
            { name: "name", label: "Full Name" },
            { name: "email", label: "Email" },
            { name: "phone", label: "Phone" },
            { name: "address", label: "Delivery Address" },
            { name: "city", label: "City" },
            { name: "postalCode", label: "Postal Code" },
          ].map((field) => (
            <label key={field.name}>
              {field.label}
              <input
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
              />
              {errors[field.name] && <span className="field-error">{errors[field.name]}</span>}
            </label>
          ))}

          <div className="delivery-options">
            <label>
              <input
                type="radio"
                name="deliveryOption"
                value="standard"
                checked={form.deliveryOption === "standard"}
                onChange={handleChange}
              />
              Standard Delivery (3–5 days)
            </label>
            <label>
              <input
                type="radio"
                name="deliveryOption"
                value="express"
                checked={form.deliveryOption === "express"}
                onChange={handleChange}
              />
              Express Delivery (1–2 days)
            </label>
          </div>
        </div>

        <div className="checkout-actions">
          <button className="checkout-btn ghost" onClick={() => navigate("/checkout")}>
            Back to Summary
          </button>
          <button className="checkout-btn" onClick={handleSubmit}>
            Continue to Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutDeliveryPage;
