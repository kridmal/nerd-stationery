import React, { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import api from "../services/api";
import { buildPackageSummary, formatCurrency } from "../utils/productUtils";
import "./ShowcasePages.css";

function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const preparedPackages = useMemo(
    () => packages.map((pkg) => buildPackageSummary(pkg)),
    [packages]
  );

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
            <article className="package-card--wide" key={pkg.id}>
              <h3>{pkg.name}</h3>
              <p>{pkg.description}</p>
              <div className="package-card__meta">
                <span className="package-card__price">{formatCurrency(pkg.price)}</span>
                {pkg.totalOriginal ? (
                  <span className="package-card__value">
                    Value {formatCurrency(pkg.totalOriginal)}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default PackagesPage;
