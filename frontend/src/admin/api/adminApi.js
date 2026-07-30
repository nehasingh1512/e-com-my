import axios from "axios";

const adminApi = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("rakhi_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Auth (shared login endpoint; role is checked client-side) ----
export const adminLogin = (data) => adminApi.post("/auth/login", data);
export const adminMe = () => adminApi.get("/auth/me");

// ---- Dashboard ----
export const getDashboard = () => adminApi.get("/admin/dashboard");

// ---- Categories ----
export const getAdminCategories = () => adminApi.get("/admin/categories");
export const getAdminCategory = (id) => adminApi.get(`/admin/categories/${id}`);
export const createAdminCategory = (data) => adminApi.post("/admin/categories", data);
export const updateAdminCategory = (id, data) => adminApi.put(`/admin/categories/${id}`, data);
export const toggleAdminCategory = (id) => adminApi.patch(`/admin/categories/${id}/toggle`);
export const deleteAdminCategory = (id) => adminApi.delete(`/admin/categories/${id}`);

// ---- Products ----
export const getAdminProducts = (params) => adminApi.get("/admin/products", { params });
export const getAdminProduct = (id) => adminApi.get(`/admin/products/${id}`);
export const createAdminProduct = (data) => adminApi.post("/admin/products", data);
export const updateAdminProduct = (id, data) => adminApi.put(`/admin/products/${id}`, data);
export const toggleAdminProduct = (id) => adminApi.patch(`/admin/products/${id}/toggle`);
export const duplicateAdminProduct = (id) => adminApi.post(`/admin/products/${id}/duplicate`);
export const adjustStock = (id, data) => adminApi.post(`/admin/products/${id}/adjust-stock`, data);
export const getStockHistory = (id) => adminApi.get(`/admin/products/${id}/stock-history`);
export const deleteAdminProduct = (id) => adminApi.delete(`/admin/products/${id}`);

// ---- Customers ----
export const getAdminCustomers = (params) => adminApi.get("/admin/customers", { params });
export const getAdminCustomer = (id) => adminApi.get(`/admin/customers/${id}`);
export const updateAdminCustomer = (id, data) => adminApi.put(`/admin/customers/${id}`, data);
export const toggleAdminCustomer = (id) => adminApi.patch(`/admin/customers/${id}/toggle`);

// ---- Orders ----
export const getAdminOrders = (params) => adminApi.get("/admin/orders", { params });
export const getAdminOrder = (id) => adminApi.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id, data) => adminApi.patch(`/admin/orders/${id}/status`, data);
export const updateOrderTracking = (id, data) => adminApi.patch(`/admin/orders/${id}/tracking`, data);
export const refundOrder = (id, data) => adminApi.patch(`/admin/orders/${id}/refund`, data);
export const acceptOrder = (id) => adminApi.post(`/admin/orders/${id}/accept`);
export const rejectOrder = (id, data) => adminApi.post(`/admin/orders/${id}/reject`, data);

// ---- Coupons ----
export const getAdminCoupons = () => adminApi.get("/admin/coupons");
export const createAdminCoupon = (data) => adminApi.post("/admin/coupons", data);
export const updateAdminCoupon = (id, data) => adminApi.put(`/admin/coupons/${id}`, data);
export const toggleAdminCoupon = (id) => adminApi.patch(`/admin/coupons/${id}/toggle`);
export const deleteAdminCoupon = (id) => adminApi.delete(`/admin/coupons/${id}`);

// ---- Banners ----
export const getAdminBanners = () => adminApi.get("/admin/banners");
export const createAdminBanner = (data) => adminApi.post("/admin/banners", data);
export const updateAdminBanner = (id, data) => adminApi.put(`/admin/banners/${id}`, data);
export const toggleAdminBanner = (id) => adminApi.patch(`/admin/banners/${id}/toggle`);
export const deleteAdminBanner = (id) => adminApi.delete(`/admin/banners/${id}`);

// ---- Reviews ----
export const getAdminReviews = (params) => adminApi.get("/admin/reviews", { params });
export const approveReview = (id) => adminApi.patch(`/admin/reviews/${id}/approve`);
export const rejectReview = (id) => adminApi.patch(`/admin/reviews/${id}/reject`);
export const replyReview = (id, data) => adminApi.post(`/admin/reviews/${id}/reply`, data);
export const deleteReview = (id) => adminApi.delete(`/admin/reviews/${id}`);

// ---- Settings ----
export const getAdminSettings = () => adminApi.get("/admin/settings");
export const updateAdminSettings = (data) => adminApi.put("/admin/settings", data);

// ---- Reports ----
export const getSalesReport = (params) => adminApi.get("/admin/reports/sales", { params });
export const getBestSellersReport = (params) => adminApi.get("/admin/reports/best-sellers", { params });
export const getInventoryReport = (params) => adminApi.get("/admin/reports/inventory", { params });
export const getCustomersReport = (params) => adminApi.get("/admin/reports/customers", { params });

// ---- Notifications ----
export const getAdminNotifications = () => adminApi.get("/admin/notifications");
export const markNotificationRead = (id) => adminApi.patch(`/admin/notifications/${id}/read`);
export const markAllNotificationsRead = () => adminApi.patch("/admin/notifications/read-all");

// ---- Staff / Roles ----
export const getStaff = () => adminApi.get("/admin/staff");
export const createStaff = (data) => adminApi.post("/admin/staff", data);
export const updateStaff = (id, data) => adminApi.put(`/admin/staff/${id}`, data);
export const deleteStaff = (id) => adminApi.delete(`/admin/staff/${id}`);
export const getActivityLog = () => adminApi.get("/admin/staff/logs/activity");

// ---- Upload ----
export const uploadImage = (formData) =>
  adminApi.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const uploadImages = (formData) =>
  adminApi.post("/upload/multiple", formData, { headers: { "Content-Type": "multipart/form-data" } });

export default adminApi;
