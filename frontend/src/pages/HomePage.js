import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircularProgress, IconButton } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";
import "./HomePage.css";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import {
  buildPackageSummary,
  buildProductCardData,
  formatCurrency,
  PLACEHOLDER_IMAGE,
  toNumber,
} from "../utils/productUtils";

const NEW_ARRIVALS_STORAGE_KEY = "newArrivals";
const VISIBLE_SLIDE_COUNT = 4;

const computeVisibleWindow = (items, start) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (items.length <= VISIBLE_SLIDE_COUNT) return items;
  const window = [];
  for (let i = 0; i < VISIBLE_SLIDE_COUNT; i += 1) {
    const index = (start + i) % items.length;
    window.push(items[index]);
  }
  return window;
};

const shiftIndex = (current, length, direction) => {
  if (length <= VISIBLE_SLIDE_COUNT) return 0;
  const next = (current + direction + length) % length;
  return next;
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
  const [arrivalStartIndex, setArrivalStartIndex] = useState(0);
  const [discountStartIndex, setDiscountStartIndex] = useState(0);
  const [packageStartIndex, setPackageStartIndex] = useState(0);

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
      const matchedImages = Array.isArray(matchedProduct?.images)
        ? matchedProduct.images.filter(Boolean)
        : [];

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
          matchedImages[0] ||
          matchedProduct?.imageUrl ||
          matchedProduct?.image ||
          PLACEHOLDER_IMAGE,
        images: matchedImages,
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

  const preparedPackages = useMemo(
    () => (packages || []).map((pkg) => buildPackageSummary(pkg)),
    [packages]
  );

  useEffect(() => {
    setArrivalStartIndex(0);
  }, [preparedArrivals.length]);

  useEffect(() => {
    setDiscountStartIndex(0);
  }, [discountedCards.length]);

  useEffect(() => {
    setPackageStartIndex(0);
  }, [preparedPackages.length]);

  const visibleArrivals = useMemo(
    () => computeVisibleWindow(preparedArrivals, arrivalStartIndex),
    [preparedArrivals, arrivalStartIndex]
  );

  const visibleDiscounts = useMemo(
    () => computeVisibleWindow(discountedCards, discountStartIndex),
    [discountedCards, discountStartIndex]
  );

  const visiblePackages = useMemo(
    () => computeVisibleWindow(preparedPackages, packageStartIndex),
    [preparedPackages, packageStartIndex]
  );

  const canSlideArrivals = preparedArrivals.length > VISIBLE_SLIDE_COUNT;
  const canSlideDiscounts = discountedCards.length > VISIBLE_SLIDE_COUNT;
  const canSlidePackages = preparedPackages.length > VISIBLE_SLIDE_COUNT;

  const handleArrivalSlide = (direction) => {
    setArrivalStartIndex((prev) =>
      shiftIndex(prev, preparedArrivals.length, direction)
    );
  };

  const handleDiscountSlide = (direction) => {
    setDiscountStartIndex((prev) =>
      shiftIndex(prev, discountedCards.length, direction)
    );
  };

  const handlePackageSlide = (direction) => {
    setPackageStartIndex((prev) =>
      shiftIndex(prev, preparedPackages.length, direction)
    );
  };

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
          <div className="product-slider">
            <IconButton
              aria-label="View previous new arrivals"
              onClick={() => handleArrivalSlide(-1)}
              disabled={!canSlideArrivals}
              className="product-slider__arrow"
            >
              <KeyboardArrowLeftIcon />
            </IconButton>
            <div className="product-slider__items">
              {visibleArrivals.map((item) => (
                <ProductCard
                  key={item.id || item.itemCode || item.name}
                  image={item.image}
                  images={item.images}
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
            <IconButton
              aria-label="View more new arrivals"
              onClick={() => handleArrivalSlide(1)}
              disabled={!canSlideArrivals}
              className="product-slider__arrow"
            >
              <KeyboardArrowRightIcon />
            </IconButton>
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
          <div className="product-slider">
            <IconButton
              aria-label="View previous discounts"
              onClick={() => handleDiscountSlide(-1)}
              disabled={!canSlideDiscounts}
              className="product-slider__arrow"
            >
              <KeyboardArrowLeftIcon />
            </IconButton>
            <div className="product-slider__items">
              {visibleDiscounts.map((item) => (
                <ProductCard key={item.key} {...item} />
              ))}
            </div>
            <IconButton
              aria-label="View more discounts"
              onClick={() => handleDiscountSlide(1)}
              disabled={!canSlideDiscounts}
              className="product-slider__arrow"
            >
              <KeyboardArrowRightIcon />
            </IconButton>
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
          <div className="product-slider">
            <IconButton
              aria-label="View previous packages"
              onClick={() => handlePackageSlide(-1)}
              disabled={!canSlidePackages}
              className="product-slider__arrow"
            >
              <KeyboardArrowLeftIcon />
            </IconButton>
            <div className="product-slider__items product-slider__items--packages">
              {visiblePackages.map((pkg) => (
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
            <IconButton
              aria-label="View more packages"
              onClick={() => handlePackageSlide(1)}
              disabled={!canSlidePackages}
              className="product-slider__arrow"
            >
              <KeyboardArrowRightIcon />
            </IconButton>
          </div>
        )}
      </section>

    </div>
  );
}

export default HomePage;
