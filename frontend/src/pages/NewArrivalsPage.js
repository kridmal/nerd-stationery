import React, { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import api from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";
import {
  buildProductCardData,
  PLACEHOLDER_IMAGE,
  toNumber,
} from "../utils/productUtils";
import "./ShowcasePages.css";

const NEW_ARRIVALS_STORAGE_KEY = "newArrivals";

const buildArrivalCard = (entry, productIndex) => {
  const code = (entry.itemCode || "").toLowerCase();
  const matchedProduct = productIndex[code];
  const finalPrice = toNumber(
    entry.finalPrice ??
      entry.unitPrice ??
      matchedProduct?.finalPrice ??
      matchedProduct?.price ??
      0
  );
  const originalPrice = toNumber(
    entry.originalPrice ??
      entry.unitPrice ??
      matchedProduct?.originalPrice ??
      matchedProduct?.price ??
      finalPrice
  );

  return {
    id: entry.id || entry.itemCode || entry.name,
    image:
      entry.image ||
      matchedProduct?.imageUrl ||
      matchedProduct?.image ||
      PLACEHOLDER_IMAGE,
    name: entry.name || matchedProduct?.name || "New Arrival",
    finalPrice,
    originalPrice,
    discountType: entry.discountType ?? matchedProduct?.discountType,
    discountValue: entry.discountValue ?? matchedProduct?.discountValue,
    description:
      entry.shortDescription ||
      matchedProduct?.shortDescription ||
      matchedProduct?.description ||
      "",
    price: entry.price ?? matchedProduct?.price,
  };
};

function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
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

    const loadNewArrivals = () => {
      try {
        const raw = localStorage.getItem(NEW_ARRIVALS_STORAGE_KEY) || "[]";
        const parsed = JSON.parse(raw);
        setNewArrivals(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Failed to read new arrivals:", error);
        setNewArrivals([]);
      }
    };

    fetchProducts();
    loadNewArrivals();

    const handler = (event) => {
      if (event.key === NEW_ARRIVALS_STORAGE_KEY) {
        loadNewArrivals();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const productIndex = useMemo(() => {
    const map = {};
    products.forEach((product) => {
      const code = (product?.itemCode || product?.productCode || "").toLowerCase();
      if (code) {
        map[code] = product;
      }
    });
    return map;
  }, [products]);

  const preparedArrivals = useMemo(
    () => newArrivals.map((entry) => buildArrivalCard(entry, productIndex)),
    [newArrivals, productIndex]
  );

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <h1>New Arrivals</h1>
        <p>Browse every limited drop and freshly added favorite in one place.</p>
      </section>

      {loading ? (
        <div className="showcase-loading">
          <CircularProgress />
        </div>
      ) : preparedArrivals.length === 0 ? (
        <p className="showcase-empty">
          No new arrivals have been published yet. Please check back soon!
        </p>
      ) : (
        <div className="showcase-grid">
          {preparedArrivals.map((item) => (
            <ProductCard
              key={item.id || item.name}
              image={item.image}
              name={item.name}
              finalPrice={item.finalPrice}
              originalPrice={item.originalPrice}
              discountType={item.discountType}
              discountValue={item.discountValue}
              description={item.description}
              price={item.price}
              badgeLabel="NEW"
              badgeColor="#FFC107"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NewArrivalsPage;
