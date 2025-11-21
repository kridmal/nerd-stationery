import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, getCategories } from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";
import "./ProductsPage.css";
import { createProductSlug, getPrimaryImage, normalizeImagesList } from "../utils/productUtils";
import { addToCart } from "../utils/cartUtils";

const toNumeric = (value) => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const ITEMS_PER_PAGE = 12;

const getFinalPrice = (product) =>
  toNumeric(product.finalPrice ?? product.originalPrice ?? product.unitPrice ?? product.price ?? 0);

const getOriginalPrice = (product) =>
  toNumeric(product.originalPrice ?? product.unitPrice ?? product.price ?? product.finalPrice ?? 0);

const ProductsCatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [maxPrice, setMaxPrice] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductsData = async () => {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    };
    const fetchCategoriesData = async () => {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    };
    fetchProductsData();
    fetchCategoriesData();
  }, []);

  const priceBounds = useMemo(() => {
    const prices = (products || []).map((p) =>
      toNumeric(p.finalPrice ?? p.originalPrice ?? p.unitPrice ?? p.price ?? 0)
    );
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return { min, max };
  }, [products]);

  useEffect(() => {
    setMaxPrice(priceBounds.max);
  }, [priceBounds.max]);

  const filteredProducts = useMemo(() => {
    let list = products || [];
    if (selectedSubcategory) {
      list = list.filter(
        (p) => (p.subcategory || "").toLowerCase() === selectedSubcategory.toLowerCase()
      );
    } else if (selectedCategory) {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (maxPrice != null) {
      list = list.filter(
        (p) =>
          toNumeric(p.finalPrice ?? p.originalPrice ?? p.unitPrice ?? p.price ?? 0) <=
          toNumeric(maxPrice)
      );
    }
    if (searchCategory !== "all") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === searchCategory.toLowerCase()
      );
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.shortDescription || p.description || "").toLowerCase();
        return name.includes(term) || desc.includes(term);
      });
    }
    return list;
  }, [products, selectedCategory, selectedSubcategory, maxPrice, searchCategory, searchTerm]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortOption === "price-asc") {
      list.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
    } else if (sortOption === "price-desc") {
      list.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
    }
    return list;
  }, [filteredProducts, sortOption]);

  const totalProducts = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const pagedProducts = sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchCategory, selectedCategory, selectedSubcategory, maxPrice, sortOption]);

  const handlePageChange = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      setCurrentPage(nextPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleCategoryClick = (name) => {
    setSelectedCategory(name);
    setSelectedSubcategory("");
  };
  const handleSubcategoryClick = (catName, subName) => {
    setSelectedCategory(catName);
    setSelectedSubcategory(subName);
  };
  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedSubcategory("");
    setMaxPrice(priceBounds.max);
    setSearchCategory("all");
    setSearchTerm("");
    setSortOption("default");
  };

  const paginationNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="products-page-wrapper">
      <div className="catalog-hero">
        <h1>Shop All Stationery</h1>
        <p>Premium notebooks, pens, planners, and office essentials curated for modern professionals.</p>
      </div>

      <div className="search-toolbar">
        <select
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search for pens, notebooks, planners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="primary-search-btn"
          onClick={() => setCurrentPage(1)}
        >
          Search
        </button>
      </div>

      <button className="filters-toggle" onClick={() => setShowFilters((s) => !s)}>
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>

      <div className="products-page">
      <aside className={`left-panel ${showFilters ? "open" : ""}`}>
        <h3>Our Products</h3>

        <section id="price_slider_wrapper" className="price-filter">
          <div className="price-header">
            <span>Filter by Price</span>
            <span className="price">{maxPrice != null ? Number(maxPrice).toFixed(0) : 0}</span>
          </div>
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            value={maxPrice ?? priceBounds.max}
            onChange={(e) => setMaxPrice(toNumeric(e.target.value))}
          />
          <div className="price-range">
            <span>{priceBounds.min.toFixed(0)}</span>
            <span>{priceBounds.max.toFixed(0)}</span>
          </div>
        </section>

        <section className="categories">
          {categories.map((cat) => {
            const subs = cat.subcategories || [];
            const isExpanded = !!expanded[cat._id];
            const showList = isExpanded ? subs : subs.slice(0, 5);
            const showMore = subs.length > 5;
            return (
              <div key={cat._id} className="category-block">
                <div
                  className={`category-title ${
                    selectedCategory === cat.name && !selectedSubcategory ? "active" : ""
                  }`}
                  onClick={() => handleCategoryClick(cat.name)}
                >
                  {cat.name}
                </div>
                <div className={`sub-list ${isExpanded ? "expanded" : "collapsed"}`}>
                  {showList.map((sub) => (
                    <div
                      key={sub._id}
                      className={`sub-item ${selectedSubcategory === sub.name ? "active" : ""}`}
                      onClick={() => handleSubcategoryClick(cat.name, sub.name)}
                    >
                      {sub.name}
                    </div>
                  ))}
                </div>
                {showMore && (
                  <div className="more-link" onClick={() => toggleExpand(cat._id)}>
                    {isExpanded ? "less.." : "more.."}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <button className="clear-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </aside>

      <main className="grid-panel">
        <div className="grid-toolbar">
          <span className="product-count">
            Showing {totalProducts} product{totalProducts !== 1 ? "s" : ""}
          </span>
          <div className="controls">
            <label>
              Sort by:
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="default">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>
          </div>
        </div>

        <div className="product-grid">
          {pagedProducts.map((p) => {
            const finalPrice = getFinalPrice(p);
            const originalPrice = getOriginalPrice(p);
            const hasDiscount =
              p.discountType && p.discountType !== "none" && p.discountValue != null;
            const badgeLabel = hasDiscount
              ? p.discountType === "percentage"
                ? `${Math.round(p.discountValue)}% OFF`
                : "SALE"
              : null;
            const mainImages = normalizeImagesList(p.images);
            const variantImages = normalizeImagesList(
              Array.isArray(p.variants) ? p.variants.map((v) => v?.image) : []
            );
            const mergedImages = [...mainImages, ...variantImages].filter(
              (img, idx, arr) => arr.indexOf(img) === idx
            );
            const primaryImage = mergedImages[0] || getPrimaryImage(p);
            const slug = createProductSlug(p.name || p.itemCode || p._id);
            return (
              <ProductCard
                key={p._id}
                image={primaryImage}
                images={mergedImages}
                slug={slug}
                name={p.name}
                finalPrice={finalPrice}
                originalPrice={originalPrice}
                discountType={p.discountType}
                discountValue={p.discountValue}
                description={p.shortDescription || p.description}
                price={p.price}
                badgeLabel={badgeLabel}
                badgeColor="#E53935"
                onAddToCart={() => navigate(`/products/${slug}`)}
                onQuickViewAddToCart={(payload) => {
                  addToCart({ ...payload, slug });
                  navigate("/cart");
                }}
              />
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            {paginationNumbers.map((num) => (
              <button
                key={num}
                className={`page-number ${num === page ? "active" : ""}`}
                onClick={() => handlePageChange(num)}
              >
                {num}
              </button>
            ))}
            <button
              className="page-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </main>
      </div>
    </div>
  );
};

export default ProductsCatalogPage;
