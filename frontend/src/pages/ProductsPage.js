import React, { useEffect, useMemo, useState } from "react";
import { getProducts, getCategories } from "../services/api";
import ProductCard from "../components/ProductCard/ProductCard";\nimport "./ProductsPage.css";

function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getProducts();
      setProducts(data);
    };
    fetchData();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Ã°Å¸â€ºÂÃ¯Â¸Â Our Products</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {products.map((product) => (
          <ProductCard
            key={product._id}
            image={product.imageUrl || product.image}
            name={product.name}
            finalPrice={
              product.finalPrice ?? product.originalPrice ?? product.unitPrice ?? product.price
            }
            originalPrice={
              product.originalPrice ?? product.unitPrice ?? product.price ?? product.finalPrice
            }
            discountType={product.discountType}
            discountValue={product.discountValue}
            description={product.shortDescription || product.description}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;
