const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const PINCODE_RE = /^[0-9]{6}$/;

export const validateEmail = (value) => EMAIL_RE.test(String(value || "").trim());

export const validateRegisterForm = ({ name, email, password, phone }) => {
  if (!String(name || "").trim()) return "Name is required";
  if (!validateEmail(email)) return "Enter a valid email address";
  if (String(password || "").length < 6) return "Password must be at least 6 characters";
  if (phone && !PHONE_RE.test(String(phone).trim())) return "Enter a valid phone number";
  return "";
};

export const validateLoginForm = ({ email, password }) => {
  if (!validateEmail(email)) return "Enter a valid email address";
  if (!String(password || "").trim()) return "Password is required";
  return "";
};

export const validateAddressForm = (address) => {
  if (!String(address.fullName || "").trim()) return "Full name is required";
  if (!PHONE_RE.test(String(address.phone || "").trim())) return "Enter a valid phone number";
  if (!String(address.line1 || "").trim()) return "Address line 1 is required";
  if (!String(address.city || "").trim()) return "City is required";
  if (!String(address.state || "").trim()) return "State is required";
  if (!PINCODE_RE.test(String(address.pincode || "").trim())) return "Pincode must be 6 digits";
  if (address.label && !["Home", "Work", "Other"].includes(address.label)) return "Invalid label";
  return "";
};

