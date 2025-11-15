import React, { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import api from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";
import { buildProductCardData } from "../utils/productUtils";
import "./ShowcasePages.css";

function DiscountsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await api.get("/products");
        const data = Array.isArray(response.data) ? response.data : [];
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const discountedProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.discountType &&
          product.discountType !== "none" &&
          product.discountValue != null
      ),
    [products]
  );

  const discountedCards = useMemo(
    () =>
      discountedProducts.map((product) => {
        const data = buildProductCardData(product);
        const badgeLabel =
          product.discountType === "percentage" && product.discountValue != null
            ? `${Math.round(product.discountValue)}% OFF`
            : "SALE";
        return {
          ...data,
          badgeLabel,
          badgeColor: "#E53935",
        };
      }),
    [discountedProducts]
  );

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <h1>Discounted Picks</h1>
        <p>Every live discount and bundle-friendly offer curated for quick discovery.</p>
      </section>

      {loading ? (
        <div className="showcase-loading">
          <CircularProgress />
        </div>
      ) : discountedCards.length === 0 ? (
        <p className="showcase-empty">
          Currently there are no discounted items. Keep an eye out for future offers!
        </p>
      ) : (
        <div className="showcase-grid">
          {discountedCards.map((item) => (
            <ProductCard key={item.key} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default DiscountsPage;
