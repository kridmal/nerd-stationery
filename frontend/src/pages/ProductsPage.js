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
  Divider,
} from "@mui/material";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";
import "./ProductsPage.css";

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

const CategorySidebar = ({
  loading,
  categories,
  openCategory,
  expandedSubcategories,
  onCategoryClick,
  onSubCategoryClick,
  onToggleSubcategoryList,
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
      <Typography
        variant="h6"
        sx={{
          px: 2.5,
          mb: 1.5,
          fontWeight: 600,
          fontSize: "18px",
          color: "#111",
        }}
      >
        Browse by Category
      </Typography>
      <Divider sx={{ mb: 2 }} />

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
        <Typography sx={{ color: "#666", fontSize: 14, px: 2.5 }}>
          No categories found.
        </Typography>
      ) : (
        <List disablePadding>
          {categories.map(({ category, subcategories }) => {
            const isOpen = openCategory === category;
            const showAll = expandedSubcategories[category] || false;
            const visibleSubcategories = showAll
              ? subcategories
              : subcategories.slice(0, 5);
            const hasMore = subcategories.length > 5;

            return (
              <React.Fragment key={category}>
                <ListItemButton
                  onClick={() => onCategoryClick(category)}
                  sx={{
                    px: 2.5,
                    py: 1,
                    borderRadius: 0,
                    color: "#222",
                    fontWeight: 600,
                    fontSize: "17px",
                    "&:hover": { color: "#111" },
                    ...(isOpen && {
                      color: "#4f46e5",
                    }),
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: "17px",
                      fontWeight: 600,
                      flexGrow: 1,
                    }}
                  >
                    {category}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#4f46e5",
                      transition: "transform 0.2s ease",
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >
                    &gt;
                  </Typography>
                </ListItemButton>

                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <Box
                    sx={{
                      ml: 4,
                      pl: 1.5,
                      borderLeft: "1px solid rgba(79,70,229,0.15)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.2,
                    }}
                  >
                    {visibleSubcategories.map((subCategory) => (
                      <ListItemButton
                        key={`${category}-${subCategory}`}
                        onClick={() => onSubCategoryClick(category, subCategory)}
                        sx={{
                          pl: 2.5,
                          pr: 2,
                          py: 0.45,
                          borderRadius: 0,
                          alignItems: "center",
                          "&:hover": { bgcolor: "transparent", color: "#111" },
                        }}
                      >
                        <ListItemText
                          primary={subCategory}
                          primaryTypographyProps={{
                            fontFamily: '"Poppins","Inter",sans-serif',
                            fontSize: "14px",
                            fontWeight: 400,
                            color: "#555",
                          }}
                        />
                      </ListItemButton>
                    ))}
                    {hasMore && (
                      <ListItemButton
                        onClick={() => onToggleSubcategoryList(category)}
                        sx={{ pl: 2.5, pr: 2, py: 0.4 }}
                      >
                        <ListItemText
                          primary={showAll ? "Less..." : "More..."}
                          primaryTypographyProps={{
                            fontFamily: '"Poppins","Inter",sans-serif',
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#4f46e5",
                          }}
                        />
                      </ListItemButton>
                    )}
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

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [expandedSubcategories, setExpandedSubcategories] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoadingProducts(true);
      try {
        const data = await getProducts();
        const safeProducts = Array.isArray(data) ? data : [];
        setProducts(safeProducts);
        const grouped = groupProductsByCategory(safeProducts);
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

  const handleCategoryClick = (categoryName) => {
    console.log("Selected", categoryName);
    setOpenCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  const handleSubCategoryClick = (categoryName, subCategoryName) => {
    console.log("Selected", categoryName, subCategoryName);
  };

  const handleToggleSubcategoryList = (categoryName) => {
    setExpandedSubcategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const productCards = useMemo(
    () =>
      products.map((product) => (
        <ProductCard
          key={product._id || product.id || product.itemCode}
          image={product.imageUrl || product.image}
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
      )),
    [products]
  );

  return (
    <div className="products-page-wrapper">
      <div className="catalog-hero">
        <h1>Our Products</h1>
        <p>
          Browse curated stationery designed for creativity, productivity, and
          modern workspaces.
        </p>
      </div>
      <div className="products-layout">
        <CategorySidebar
          loading={loadingProducts}
          categories={categoryGroups}
          openCategory={openCategory}
          expandedSubcategories={expandedSubcategories}
          onCategoryClick={handleCategoryClick}
          onSubCategoryClick={handleSubCategoryClick}
          onToggleSubcategoryList={handleToggleSubcategoryList}
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
