import axios from "axios";

// In dev, the Vite proxy forwards "/api" to the backend, so a relative path
// works with no config. In production, if the frontend and backend are on
// different origins (e.g. frontend on Vercel/Netlify, backend on
// Render/Railway), set VITE_API_URL to the backend's full URL at build time.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

// Attach the auth token (if present) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rakhi_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Products ----
export const getProducts = (params = {}) => api.get("/products", { params });
export const getBestSellers = () => api.get("/products", { params: { bestSeller: true, limit: 6 } });
export const getProductBySlug = (slug) => api.get(`/products/${slug}`);

// ---- Reviews ----
export const getProductReviews = (slug) => api.get("/reviews", { params: { product: slug } });
export const getMyReview = (slug) => api.get("/reviews/mine", { params: { product: slug } });
export const submitReview = (data) => api.post("/reviews", data);

// ---- Categories ----
export const getCategories = () => api.get("/categories");
export const getCategoryTree = () => api.get("/categories/tree");

// ---- Banners ----
export const getBanners = (params = {}) => api.get("/banners", { params });

// ---- Newsletter ----
export const subscribeNewsletter = (email) => api.post("/newsletter/subscribe", { email });

// ---- Auth ----
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
export const resetPassword = (token, password) => api.post(`/auth/reset-password/${token}`, { password });

// ---- Addresses ----
export const getAddresses = () => api.get("/addresses");
export const createAddress = (data) => api.post("/addresses", data);
export const updateAddress = (id, data) => api.put(`/addresses/${id}`, data);
export const deleteAddress = (id) => api.delete(`/addresses/${id}`);

// ---- Orders ----
export const createOrder = (data) => api.post("/orders", data);
export const createRazorpayOrder = (data) => api.post("/payments/razorpay/order", data);
export const getMyOrders = () => api.get("/orders/mine");
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const trackGuestOrder = (id, email) => api.get(`/orders/${id}`, { params: { email } });

// ---- Coupons ----
export const getCoupons = () => api.get("/coupons");
export const validateCoupon = (data) => api.post("/coupons/validate", data);

// ---- User cart/wishlist sync ----
export const syncWishlist = (productIds) => api.put("/users/wishlist", { productIds });
export const syncCart = (items) => api.put("/users/cart", { items });
export const getServerWishlist = () => api.get("/users/wishlist");
export const getServerCart = () => api.get("/users/cart");

export default api;
