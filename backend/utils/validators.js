const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const PINCODE_RE = /^[0-9]{6}$/;

export const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export const validateRegisterPayload = ({ name, email, password, phone }) => {
  if (!isNonEmptyString(name)) return "Name is required";
  if (!isNonEmptyString(email)) return "Email is required";
  if (!isNonEmptyString(password)) return "Password is required";
  if (password.trim().length < 6) return "Password must be at least 6 characters";
  if (phone && !PHONE_RE.test(phone.trim())) return "Phone number is invalid";
  return "";
};

export const validateAddressPayload = (address = {}) => {
  const requiredFields = ["fullName", "phone", "line1", "city", "state", "pincode"];
  for (const field of requiredFields) {
    if (!isNonEmptyString(address[field])) return `${field} is required`;
  }
  if (!PHONE_RE.test(address.phone.trim())) return "Phone number is invalid";
  if (!PINCODE_RE.test(String(address.pincode).trim())) return "Pincode must be 6 digits";
  if (address.label && !["Home", "Work", "Other"].includes(address.label)) return "Label must be Home, Work or Other";
  return "";
};

export const validateWishlistPayload = (productIds = []) => {
  if (!Array.isArray(productIds)) return "productIds must be an array";
  return "";
};

export const validateResetPasswordPayload = ({ password }) => {
  if (!isNonEmptyString(password)) return "Password is required";
  if (password.trim().length < 6) return "Password must be at least 6 characters";
  return "";
};

