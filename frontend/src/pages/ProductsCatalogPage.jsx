import React, { useEffect, useMemo, useState } from "react";
import { getProducts, getCategories } from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";
import "./ProductsPage.css";

const ProductsCatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [maxPrice, setMaxPrice] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

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
    const prices = (products || []).map((p) => Number(p.unitPrice ?? p.price ?? 0));
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
      list = list.filter((p) => Number(p.unitPrice ?? p.price ?? 0) <= Number(maxPrice));
    }
    return list;
  }, [products, selectedCategory, selectedSubcategory, maxPrice]);

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
  };

  return (
    <div className="products-page">
      <button className="filters-toggle" onClick={() => setShowFilters((s) => !s)}>
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>
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
            onChange={(e) => setMaxPrice(Number(e.target.value))}
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
        <div className="product-grid">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p._id}
              image={p.imageUrl}
              name={p.name}
              price={p.unitPrice ?? p.price}
              description={p.description}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default ProductsCatalogPage;
