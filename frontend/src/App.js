import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ProductsPage from "./pages/ProductsCatalogPage";
import ContactPage from "./pages/ContactPage";
import NewArrivalsPage from "./pages/NewArrivalsPage";
import DiscountsPage from "./pages/DiscountsPage";
import PackagesPage from "./pages/PackagesPage";
import AdminProductsPage from "./features/admin/pages/AdminProductsPage";
import ProductActivityPage from "./features/admin/pages/ProductActivityPage";
import AdminLoginPage from "./features/admin/pages/AdminLoginPage";
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import CategoryManager from "./features/admin/pages/CategoryManager";
import ManageQuantityPage from "./features/admin/pages/ManageQuantityPage";
import NewArrivalPage from "./features/admin/pages/NewArrivalPage";


function LayoutWrapper({ children }) {
  const location = useLocation();

  // Define routes that should NOT show Header/Footer
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header />}
      {children}
      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/new-arrivals" element={<NewArrivalsPage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/packages" element={<PackagesPage />} />

          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/categories" element={<CategoryManager />} />
          <Route path="/admin/manage-quantity" element={<ManageQuantityPage />} />
          <Route path="/admin/new-arrivals" element={<NewArrivalPage />} />
          <Route path="/admin/products/activity" element={<ProductActivityPage />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
