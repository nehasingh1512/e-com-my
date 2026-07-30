import React from "react";
import { Routes, Route } from "react-router-dom";
import StorefrontLayout from "./components/StorefrontLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import HomePage from "./pages/HomePage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import TrackOrderPage from "./pages/TrackOrderPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import OrderDetailPage from "./pages/OrderDetailPage.jsx";
import AddressesPage from "./pages/AddressesPage.jsx";
import ShippingPolicyPage from "./pages/ShippingPolicyPage.jsx";
import ReturnPolicyPage from "./pages/ReturnPolicyPage.jsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.jsx";
import TermsConditionsPage from "./pages/TermsConditionsPage.jsx";
import FaqPage from "./pages/FaqPage.jsx";

import { AdminAuthProvider } from "./admin/context/AdminAuthContext.jsx";
import AdminLayout from "./admin/components/AdminLayout.jsx";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute.jsx";
import AdminLoginPage from "./admin/pages/AdminLoginPage.jsx";
import DashboardPage from "./admin/pages/DashboardPage.jsx";
import CategoriesPage from "./admin/pages/CategoriesPage.jsx";
import ProductsPage from "./admin/pages/ProductsPage.jsx";
import ProductFormPage from "./admin/pages/ProductFormPage.jsx";
import CustomersPage from "./admin/pages/CustomersPage.jsx";
import AdminOrdersPage from "./admin/pages/OrdersPage.jsx";
import AdminOrderDetailPage from "./admin/pages/OrderDetailPage.jsx";
import CouponsPage from "./admin/pages/CouponsPage.jsx";
import BannersPage from "./admin/pages/BannersPage.jsx";
import ReviewsPage from "./admin/pages/ReviewsPage.jsx";
import SettingsPage from "./admin/pages/SettingsPage.jsx";
import ReportsPage from "./admin/pages/ReportsPage.jsx";
import StaffPage from "./admin/pages/StaffPage.jsx";
import NotificationsPage from "./admin/pages/NotificationsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* ---- Storefront ---- */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<CategoryPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsConditionsPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
      </Route>

      {/* ---- Admin Panel ---- */}
      <Route
        path="/admin/*"
        element={
          <AdminAuthProvider>
            <Routes>
              <Route path="login" element={<AdminLoginPage />} />
              <Route
                path="*"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="categories" element={<AdminProtectedRoute permission="categories"><CategoriesPage /></AdminProtectedRoute>} />
                <Route path="products" element={<AdminProtectedRoute permission="products"><ProductsPage /></AdminProtectedRoute>} />
                <Route path="products/:id" element={<AdminProtectedRoute permission="products"><ProductFormPage /></AdminProtectedRoute>} />
                <Route path="customers" element={<AdminProtectedRoute permission="customers"><CustomersPage /></AdminProtectedRoute>} />
                <Route path="orders" element={<AdminProtectedRoute permission="orders"><AdminOrdersPage /></AdminProtectedRoute>} />
                <Route path="orders/:id" element={<AdminProtectedRoute permission="orders"><AdminOrderDetailPage /></AdminProtectedRoute>} />
                <Route path="coupons" element={<AdminProtectedRoute permission="products"><CouponsPage /></AdminProtectedRoute>} />
                <Route path="banners" element={<AdminProtectedRoute permission="settings"><BannersPage /></AdminProtectedRoute>} />
                <Route path="reviews" element={<AdminProtectedRoute permission="products"><ReviewsPage /></AdminProtectedRoute>} />
                <Route path="reports" element={<AdminProtectedRoute permission="reports"><ReportsPage /></AdminProtectedRoute>} />
                <Route path="settings" element={<AdminProtectedRoute permission="settings"><SettingsPage /></AdminProtectedRoute>} />
                <Route path="notifications" element={<AdminProtectedRoute><NotificationsPage /></AdminProtectedRoute>} />
                <Route path="staff" element={<AdminProtectedRoute superAdminOnly><StaffPage /></AdminProtectedRoute>} />
              </Route>
            </Routes>
          </AdminAuthProvider>
        }
      />
    </Routes>
  );
}
