import React, { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { buildPackageSummary, createPackageSlug } from "../utils/productUtils";
import { addToCart } from "../utils/cartUtils";
import PackageCard from "../components/PackageCard/PackageCard";
import "./ShowcasePages.css";

function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const response = await api.get("/packages");
        const data = Array.isArray(response.data) ? response.data : [];
        setPackages(data);
      } catch (error) {
        console.error("Error fetching packages:", error);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const preparedPackages = useMemo(() => {
    const sorted = [...packages].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : null;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : null;
      if (aTime == null || bTime == null) return 0;
      return aTime - bTime; // older first, new packages appear under previous ones
    });
    return sorted.map((pkg) => buildPackageSummary(pkg));
  }, [packages]);

  const visiblePackages = useMemo(
    () => preparedPackages.filter((pkg) => pkg.isActive !== false),
    [preparedPackages]
  );

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <h1>Curated Packages</h1>
        <p>Save time with ready-to-use bundles chosen for study, work, and creative flows.</p>
      </section>

      {loading ? (
        <div className="showcase-loading">
          <CircularProgress />
        </div>
      ) : visiblePackages.length === 0 ? (
        <p className="showcase-empty">
          There are no packages available right now. Please check back soon!
        </p>
      ) : (
        <div className="showcase-packages">
          {visiblePackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onNavigate={(packageData) => {
                const slug =
                  packageData.slug ||
                  createPackageSlug(packageData.name || packageData.code || packageData.id);
                navigate(`/packages/${slug}`);
              }}
              onAddToCart={(packageData) => {
                const payload = {
                  ...packageData,
                  slug: packageData.slug,
                  name: packageData.name,
                  image: packageData.primaryImage || packageData.images?.[0],
                  finalPrice: packageData.price,
                  originalPrice: packageData.totalOriginal || packageData.price,
                };
                addToCart(payload, 1);
                navigate("/cart");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PackagesPage;
