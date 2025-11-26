import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ProductsPage from "./pages/ProductsCatalogPage";
import ContactPage from "./pages/ContactPage";
import NewArrivalsPage from "./pages/NewArrivalsPage";
import DiscountsPage from "./pages/DiscountsPage";
import PackagesPage from "./pages/PackagesPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import PackageDetailPage from "./pages/PackageDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutOverviewPage from "./pages/CheckoutOverviewPage";
import CheckoutDeliveryPage from "./pages/CheckoutDeliveryPage";
import CheckoutReviewPage from "./pages/CheckoutReviewPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import AdminProductsPage from "./features/admin/pages/AdminProductsPage";
import ProductActivityPage from "./features/admin/pages/ProductActivityPage";
import AdminLoginPage from "./features/admin/pages/AdminLoginPage";
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import CategoryManager from "./features/admin/pages/CategoryManager";
import ManageQuantityPage from "./features/admin/pages/ManageQuantityPage";
import NewArrivalPage from "./features/admin/pages/NewArrivalPage";
import ManageOrdersPage from "./features/admin/pages/ManageOrdersPage";
import ManageCustomersPage from "./features/admin/pages/ManageCustomersPage";
import StockManagerPage from "./features/admin/pages/StockManagerPage";
import AdminReportsPage from "./features/admin/pages/AdminReportsPage";
import AdminUsersPage from "./features/admin/pages/AdminUsersPage";
import AdminAccountPage from "./features/admin/pages/AdminAccountPage";
import theme from "./theme";
import PackageManagerPage from "./features/admin/pages/PackageManagerPage";
import AlertSettingsPage from "./features/admin/pages/AlertSettingsPage";


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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <LayoutWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutOverviewPage />} />
            <Route path="/checkout/delivery" element={<CheckoutDeliveryPage />} />
            <Route path="/checkout/review" element={<CheckoutReviewPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/new-arrivals" element={<NewArrivalsPage />} />
            <Route path="/discounts" element={<DiscountsPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/packages/:slug" element={<PackageDetailPage />} />

            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/categories" element={<CategoryManager />} />
            <Route path="/admin/manage-quantity" element={<ManageQuantityPage />} />
            <Route path="/admin/alert-settings" element={<AlertSettingsPage />} />
            <Route path="/admin/new-arrivals" element={<NewArrivalPage />} />
            <Route path="/admin/orders" element={<ManageOrdersPage />} />
            <Route path="/admin/customers" element={<ManageCustomersPage />} />
            <Route path="/admin/stock-manager" element={<StockManagerPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/account" element={<AdminAccountPage />} />
            <Route path="/admin/packages" element={<PackageManagerPage />} />
            <Route path="/admin/products/activity" element={<ProductActivityPage />} />
            <Route path="/admin/activity-logs" element={<ProductActivityPage />} />
          </Routes>
        </LayoutWrapper>
      </Router>
    </ThemeProvider>
  );
}

export default App;
