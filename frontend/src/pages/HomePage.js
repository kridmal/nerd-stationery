import React, { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import api from "../services/api"; // ✅ use default import (matches your backend setup)
import ProductCard from "../components/ProductCard/ProductCard";
import "./HomePage.css";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

import facebookIcon from "../assets/facebook.png";
import instagramIcon from "../assets/instagram.png";
import whatsappIcon from "../assets/whatsapp.png";

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Updated to match `api.js` default export
        const response = await api.get("/products");
        const data = response.data;

        if (data && data.length > 0) {
          setProducts(data);
        } else {
          // fallback mock data
          setProducts([
            {
              id: 1,
              name: "Luxury Notebook",
              price: "$12.99",
              description: "Premium paper with elegant cover.",
              image:
                "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
            },
            {
              id: 2,
              name: "Designer Pen",
              price: "$7.50",
              description: "Smooth ink flow with modern design.",
              image:
                "https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8",
            },
            {
              id: 3,
              name: "Art Sketchbook",
              price: "$14.99",
              description: "Ideal for sketches and journaling.",
              image:
                "https://images.unsplash.com/photo-1503602642458-232111445657",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home-container">
      <Carousel
        showArrows={true}
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

      <section className="new-arrivals">
        <h2>🆕 New Arrivals</h2>

        {loading ? (
          <div style={{ marginTop: "40px" }}>
            <CircularProgress />
          </div>
        ) : (
          <div className="product-grid">
            {products.map((item) => (
              <ProductCard key={item.id || item._id} {...item} />
            ))}
          </div>
        )}
      </section>

      <footer className="social-footer">
        <h3>Connect with us</h3>
        <div className="social-icons">
          <a href="https://facebook.com" target="_blank" rel="noreferrer">
            <img src={facebookIcon} alt="Facebook" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            <img src={instagramIcon} alt="Instagram" />
          </a>
          <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer">
            <img src={whatsappIcon} alt="WhatsApp" />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
