import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Typography,
  Skeleton,
  Stack,
} from "@mui/material";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";
import "./ProductsPage.css";

/* ----------------------------------------------------------
 🔥 DEBUG: LOG ALL PRODUCTS ONCE
---------------------------------------------------------- */
const logProductsOnce = (products) => {
  console.log("🟢 FULL PRODUCT PAYLOAD:", products);
};

/* ---------------------------------------------------------- */

const normalizeText = (value, fallback = "Miscellaneous") => {
  if (value === 0) return "0";
  if (!value) return fallback;
  const text = String(value).trim();
  return text.length === 0 ? fallback : text;
};

const groupProductsByCategory = (products = []) => {
  const map = new Map();

  products.forEach((product) => {
    const categoryName = normalizeText(
      product?.category?.name ||
        product?.categoryName ||
        product?.productCategory ||
        product?.category,
      "General"
    );

    const subName = normalizeText(
      product?.subcategory?.name ||
        product?.subcategoryName ||
        product?.subCategory ||
        product?.productSubCategory ||
        product?.subcategory,
      "All"
    );

    if (!map.has(categoryName)) {
      map.set(categoryName, new Set());
    }
    map.get(categoryName).add(subName);
  });

  return Array.from(map.entries()).map(([category, subcategories]) => ({
    category,
    subcategories: Array.from(subcategories).sort(),
  }));
};

/* ----------------------------------------------------------
    CATEGORY SIDEBAR  (UNCHANGED)
---------------------------------------------------------- */
const CategorySidebar = ({
  loading,
  categories,
  openCategory,
  onCategoryClick,
  onSubCategoryClick,
  priceBounds,
  currentPrice,
  onPriceChange,
}) => {
  const skeletonItems = Array.from({ length: 5 });

  return (
    <Box
      className="category-sidebar"
      sx={{
        width: 260,
        padding: "20px 0",
        fontFamily: '"Poppins","Inter",sans-serif',
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <div className="price-range-block">
        <Typography className="price-range-title">Price Range</Typography>
        <div className="price-inputs">
          <input
            type="number"
            value={currentPrice[0]}
            onChange={(e) =>
              onPriceChange([
                Number(e.target.value) || priceBounds.min,
                currentPrice[1],
              ])
            }
            min={priceBounds.min}
            max={currentPrice[1]}
          />
          <span className="price-separator">to</span>
          <input
            type="number"
            value={currentPrice[1]}
            onChange={(e) =>
              onPriceChange([
                currentPrice[0],
                Number(e.target.value) || priceBounds.max,
              ])
            }
            min={currentPrice[0]}
            max={priceBounds.max}
          />
        </div>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          value={currentPrice[1]}
          onChange={(e) =>
            onPriceChange([currentPrice[0], Number(e.target.value)])
          }
        />
      </div>

      <Typography className="category-heading">Product Category</Typography>

      {loading ? (
        <Stack spacing={1.5} sx={{ px: 2.5 }}>
          {skeletonItems.map((_, idx) => (
            <Box key={`category-skeleton-${idx}`}>
              <Skeleton variant="text" width="70%" height={24} />
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {Array.from({ length: 5 }).map((__, subIdx) => (
                  <Skeleton
                    key={`subcategory-skeleton-${idx}-${subIdx}`}
                    variant="text"
                    width={`${80 - subIdx * 8}%`}
                    height={18}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : categories.length === 0 ? (
        <Typography sx={{ color: "#555", fontSize: 14, px: 2.5 }}>
          No categories found.
        </Typography>
      ) : (
        <List disablePadding className="category-list">
          {categories.map(({ category, subcategories }) => {
            const isOpen = openCategory === category;

            return (
              <React.Fragment key={category}>
                <ListItemButton
                  className={`category-item ${isOpen ? "active" : ""}`}
                  onClick={() => onCategoryClick(category)}
                >
                  <ListItemText
                    primary={category}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: "16px",
                    }}
                  />
                  <span className="category-arrow">{isOpen ? "˅" : ">"}</span>
                </ListItemButton>

                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <Box className="subcategory-wrapper">
                    {subcategories.map((subCategory) => (
                      <ListItemButton
                        key={`${category}-${subCategory}`}
                        className="subcategory-item"
                        onClick={() => onSubCategoryClick(category, subCategory)}
                      >
                        <ListItemText
                          primary={subCategory}
                          primaryTypographyProps={{
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#555",
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </Box>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
};

/* ----------------------------------------------------------
                 MAIN PRODUCT PAGE
---------------------------------------------------------- */
function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const [priceRange, setPriceRange] = useState([0, 0]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingProducts(true);
      try {
        const data = await getProducts();
        const safe = Array.isArray(data) ? data : [];

        logProductsOnce(safe);

        setProducts(safe);
        const grouped = groupProductsByCategory(safe);
        setCategoryGroups(grouped);
        if (grouped.length > 0) {
          setOpenCategory(grouped[0].category);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
        setCategoryGroups([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, []);

  /* ----------------------------------------------------------
        🔥 FIX IMAGE LOGIC FOR S3 + UNSPLASH
  ---------------------------------------------------------- */
  const productCards = useMemo(
    () =>
      products.map((product) => {
        const resolvedImage =
          Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : product.image || product.imageUrl || null;

        return (
          <ProductCard
            key={product._id || product.id || product.itemCode}
            image={resolvedImage}
            images={Array.isArray(product.images) ? product.images : []}
            name={product.name}
            finalPrice={
              product.finalPrice ??
              product.originalPrice ??
              product.unitPrice ??
              product.price
            }
            originalPrice={
              product.originalPrice ??
              product.unitPrice ??
              product.price ??
              product.finalPrice
            }
            discountType={product.discountType}
            discountValue={product.discountValue}
            description={product.shortDescription || product.description}
            price={product.price}
          />
        );
      }),
    [products]
  );

  /* ---------------------------------------------------------- */
  return (
    <div className="products-page-wrapper">
      <div className="catalog-hero">
        <h1>Our Products</h1>
        <p>
          Browse curated stationery designed for creativity, productivity,
          and modern workspaces.
        </p>
      </div>

      <div className="products-layout">
        <CategorySidebar
          loading={loadingProducts}
          categories={categoryGroups}
          openCategory={openCategory}
          onCategoryClick={setOpenCategory}
          onSubCategoryClick={(c, s) => console.log("Selected", c, s)}
          priceBounds={priceBounds}
          currentPrice={priceRange}
          onPriceChange={setPriceRange}
        />

        <div className="products-content">
          <div className="grid-toolbar">
            <span className="product-count">{products.length} products</span>
          </div>

          {loadingProducts ? (
            <div className="products-loading">
              <Skeleton variant="rectangular" width="100%" height={200} />
            </div>
          ) : (
            <div className="product-grid">{productCards}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
        const prices = safe.map(
          (item) =>
            item.finalPrice ?? item.originalPrice ?? item.unitPrice ?? item.price ?? 0
        );
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;
        setPriceRange([minPrice, maxPrice]);
