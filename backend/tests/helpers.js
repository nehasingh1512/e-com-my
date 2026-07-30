import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import generateToken from "../utils/generateToken.js";

export const createAdmin = async (overrides = {}) => {
  const admin = await User.create({
    name: "Test Admin",
    email: "admin@test.com",
    password: "password123",
    role: "super_admin",
    ...overrides,
  });
  return { admin, token: generateToken(admin._id) };
};

export const createCustomer = async (overrides = {}) => {
  const customer = await User.create({
    name: "Test Customer",
    email: "customer@test.com",
    password: "password123",
    role: "customer",
    ...overrides,
  });
  return { customer, token: generateToken(customer._id) };
};

export const createCategory = async (overrides = {}) => {
  return Category.create({
    name: "Designer Rakhi",
    slug: "designer-rakhi",
    isActive: true,
    ...overrides,
  });
};

export const createProduct = async (categoryId, overrides = {}) => {
  return Product.create({
    name: "Elegant Pearl Rakhi",
    slug: `test-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: categoryId,
    price: 199,
    mrp: 249,
    stock: 10,
    isActive: true,
    ...overrides,
  });
};

export const validAddress = {
  fullName: "Test User",
  phone: "9876543210",
  line1: "123 Test Street",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "302001",
};
