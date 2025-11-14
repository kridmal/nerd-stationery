import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";
import "./HomePage.css";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const NEW_ARRIVALS_STORAGE_KEY = "newArrivals";
const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/320x200.png?text=Product";

const toNumber = (value, fallback = 0) => {
  if (value == null || value === "") return fallback;
  const parsed =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const buildProductCardData = (item) => ({
  key: item._id || item.itemCode || item.id || item.name,
  image: item.imageUrl || item.image || PLACEHOLDER_IMAGE,
  name: item.name,
  finalPrice:
    item.finalPrice ?? item.originalPrice ?? item.unitPrice ?? item.price ?? 0,
  originalPrice:
    item.originalPrice ?? item.unitPrice ?? item.price ?? item.finalPrice ?? 0,
  discountType: item.discountType,
  discountValue: item.discountValue,
  description: item.shortDescription || item.description || "",
  price: item.price,
});

const summarizePackageItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "Includes a curated mix of our best-selling stationery picks.";
  }
  const preview = items.slice(0, 4);
  const extra = items.length - preview.length;
  return `Includes: ${preview.join(", ")}${extra > 0 ? ` +${extra} more` : ""}`;
};

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [newArrivals, setNewArrivals] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const newArrivalsRef = useRef(null);
  const discountsRef = useRef(null);
  const packagesRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/products");
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, []);

  const loadNewArrivals = useCallback(() => {
    try {
      const raw = localStorage.getItem(NEW_ARRIVALS_STORAGE_KEY) || "[]";
      const parsed = JSON.parse(raw);
      setNewArrivals(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Failed to read new arrivals:", error);
      setNewArrivals([]);
    }
  }, []);

  useEffect(() => {
    loadNewArrivals();
    const handler = (event) => {
      if (event.key === NEW_ARRIVALS_STORAGE_KEY) {
        loadNewArrivals();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [loadNewArrivals]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.get("/packages");
        const data = response.data;
        setPackages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching packages:", error);
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    };

    fetchPackages();
  }, []);

  const productIndex = useMemo(() => {
    const map = {};
    (products || []).forEach((product) => {
      const code = (product?.itemCode || product?.productCode || "").toLowerCase();
      if (code) {
        map[code] = product;
      }
    });
    return map;
  }, [products]);

  const preparedArrivals = useMemo(() => {
    return (newArrivals || []).map((entry) => {
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
        ...entry,
        finalPrice,
        originalPrice,
        discountType: entry.discountType ?? matchedProduct?.discountType,
        discountValue: entry.discountValue ?? matchedProduct?.discountValue,
        description:
          entry.shortDescription ||
          matchedProduct?.shortDescription ||
          matchedProduct?.description ||
          "",
        image:
          entry.image ||
          matchedProduct?.imageUrl ||
          matchedProduct?.image ||
          PLACEHOLDER_IMAGE,
      };
    });
  }, [newArrivals, productIndex]);

  const discountedProducts = useMemo(() => {
    return (products || []).filter(
      (product) =>
        product.discountType &&
        product.discountType !== "none" &&
        product.discountValue != null
    );
  }, [products]);

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

  const discountTitle =
    discountedCards.length === 0
      ? "No active discounts right now. Check back soon!"
      : `Special Discounts (${discountedCards.length})`;

  const preparedPackages = useMemo(() => {
    return (packages || []).map((pkg) => {
      const items = Array.isArray(pkg.products)
        ? pkg.products.map((product) => product?.name).filter(Boolean)
        : [];
      return {
        id: pkg._id || pkg.id || pkg.name,
        name: pkg.name || "Curated Package",
        price: toNumber(pkg.price, 0),
        items,
        description: summarizePackageItems(items),
      };
    });
  }, [packages]);

  useEffect(() => {
    const target = location.state?.scrollTo;
    if (!target) return;

    const refMap = {
      "new-arrivals": newArrivalsRef,
      discounts: discountsRef,
      packages: packagesRef,
    };
    const ref = refMap[target] || null;

    if (ref?.current) {
      requestAnimationFrame(() => {
        ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="home-container">
      <Carousel
        showArrows
        autoPlay
        infiniteLoop
        interval={3000}
        showThumbs={false}
        showStatus={false}
        className="hero-carousel"
      >
        <div>
          <img
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
            alt="Banner 1"
          />
          <p className="legend">Quality Stationery for Creative Minds</p>
        </div>
        <div>
          <img
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511"
            alt="Banner 2"
          />
          <p className="legend">Elegance in Every Page</p>
        </div>
        <div>
          <img
            src="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620"
            alt="Banner 3"
          />
          <p className="legend">Crafted for Professionals</p>
        </div>
      </Carousel>

      <section
        className="section-wrapper new-arrivals"
        id="new-arrivals-section"
        ref={newArrivalsRef}
      >
        <h2 className="section-heading">New Arrivals</h2>
        <p>
          Fresh drops and limited-run favorites handpicked by the Nerd Stationery team.
          Discover what just landed before it sells out.
        </p>
        {loadingProducts && preparedArrivals.length === 0 ? (
          <div style={{ marginTop: 40 }}>
            <CircularProgress />
          </div>
        ) : preparedArrivals.length === 0 ? (
          <p style={{ marginTop: 24, color: "#666" }}>
            No new arrivals have been published yet. Please check back soon!
          </p>
        ) : (
          <div className="product-grid">
            {preparedArrivals.map((item) => (
              <ProductCard
                key={item.id || item.itemCode || item.name}
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
      </section>

      <section
        className="section-wrapper discounts"
        id="discounts-section"
        ref={discountsRef}
      >
        <h2 className="section-heading section-heading--discount">
          Special Discounts
        </h2>
        <p style={{ color: "#666", marginBottom: 24 }}>{discountTitle}</p>
        {loadingProducts && discountedCards.length === 0 ? (
          <div style={{ marginTop: 40 }}>
            <CircularProgress />
          </div>
        ) : discountedCards.length === 0 ? (
          <p style={{ color: "#888" }}>
            Currently there are no discounted items. Keep an eye out for future offers!
          </p>
        ) : (
          <div className="product-grid">
            {discountedCards.map((item) => (
              <ProductCard key={item.key} {...item} />
            ))}
          </div>
        )}
      </section>

      <section
        className="section-wrapper packages"
        id="packages-section"
        ref={packagesRef}
      >
        <h2 className="section-heading section-heading--packages">Curated Packages</h2>
        <p>
          Thoughtfully bundled stationery sets designed to save you time and money across
          study, creative, and office workflows.
        </p>
        {loadingPackages && preparedPackages.length === 0 ? (
          <div style={{ marginTop: 40 }}>
            <CircularProgress />
          </div>
        ) : preparedPackages.length === 0 ? (
          <p style={{ color: "#666", marginTop: 16 }}>
            There are no packages available right now. Please check back soon!
          </p>
        ) : (
          <div className="packages-grid">
            {preparedPackages.map((pkg) => (
              <article className="package-card" key={pkg.id}>
                <div className="package-card__header">
                  <h3>{pkg.name}</h3>
                  <span className="package-card__price">
                    {formatCurrency(pkg.price)}
                  </span>
                </div>
                <p className="package-card__items">{pkg.description}</p>
                <div className="package-card__meta">
                  {pkg.items.length > 0 ? `${pkg.items.length} items included` : "Flexible mix"}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

export default HomePage;
