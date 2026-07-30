import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Truck, Zap, Clock, CreditCard, Wallet, Banknote, CheckCircle2, Tag, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart, getCartLineId } from "../context/CartContext.jsx";
import { getAddresses, createAddress, createOrder, createRazorpayOrder, validateCoupon, getCoupons } from "../api/api.js";
import { validateAddressForm } from "../utils/validation.js";

const DELIVERY_OPTIONS = [
  { id: "standard", label: "Standard Delivery", desc: "5-7 business days", cost: 0, icon: Truck },
  { id: "express", label: "Express Delivery", desc: "2-3 business days", cost: 79, icon: Zap },
  { id: "sameday", label: "Same Day Delivery", desc: "Delivered today (select cities)", cost: 149, icon: Clock },
];

const PAYMENT_OPTIONS = [
  { id: "cod", label: "Cash on Delivery", icon: Banknote },
  { id: "upi", label: "UPI", icon: Wallet },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
];

const emptyAddress = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, cartSubtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [mode, setMode] = useState(user ? "account" : "choose"); // choose | guest | account
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [guestEmail, setGuestEmail] = useState("");
  const [delivery, setDelivery] = useState("standard");
  const [payment, setPayment] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [placedOrderId, setPlacedOrderId] = useState(null);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount }
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  useEffect(() => {
    if (cart.length === 0 && !placedOrderId) navigate("/cart");
  }, [cart, placedOrderId, navigate]);

  useEffect(() => {
    if (user) {
      setMode("account");
      getAddresses()
        .then((res) => {
          setSavedAddresses(res.data || []);
          const def = res.data?.find((a) => a.isDefault) || res.data?.[0];
          if (def) setSelectedAddressId(def._id);
          else setAddingNew(true);
        })
        .catch(() => setAddingNew(true));
    }
  }, [user]);

  useEffect(() => {
    getCoupons()
      .then((res) => setAvailableCoupons(res.data || []))
      .catch(() => setAvailableCoupons([]));
  }, []);

  const deliveryCost = DELIVERY_OPTIONS.find((d) => d.id === delivery)?.cost || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, cartSubtotal + deliveryCost - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const items = cart.map((i) => ({ product: i._id, qty: i.qty, price: i.price }));
      const res = await validateCoupon({ code: couponInput.trim(), items });
      setAppliedCoupon(res.data);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || "Could not apply this coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // Re-check the applied coupon whenever the cart changes (e.g. an item was
  // removed after applying it), since a min-purchase or category restriction
  // might no longer hold.
  useEffect(() => {
    if (!appliedCoupon) return;
    const items = cart.map((i) => ({ product: i._id, qty: i.qty, price: i.price }));
    validateCoupon({ code: appliedCoupon.code, items })
      .then((res) => setAppliedCoupon(res.data))
      .catch((err) => {
        setAppliedCoupon(null);
        setCouponError(err.response?.data?.message || "Your coupon no longer applies to this cart and was removed.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  const getShippingAddress = () => {
    if (user && selectedAddressId && !addingNew) {
      return savedAddresses.find((a) => a._id === selectedAddressId);
    }
    return address;
  };

  const validate = () => {
    const addr = getShippingAddress();
    const nextFieldErrors = {};
    if (!addr) nextFieldErrors.address = "Please select or add a shipping address.";
    else {
      const addressError = validateAddressForm(addr);
      if (addressError) nextFieldErrors.address = addressError;
    }
    if (mode === "guest") {
      if (!guestEmail.trim()) nextFieldErrors.guestEmail = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) nextFieldErrors.guestEmail = "Enter a valid email";
    }
    setFieldErrors(nextFieldErrors);
    return Object.values(nextFieldErrors)[0] || "";
  };

  const handlePlaceOrder = async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setPlacing(true);
    try {
      let shippingAddress = getShippingAddress();

      // Save a brand-new address to the account before ordering
      if (user && addingNew) {
        const res = await createAddress({ ...address, isDefault: savedAddresses.length === 0 });
        shippingAddress = res.data;
        setFieldErrors((prev) => ({ ...prev, address: "" }));
      }

      const items = cart.map((i) => ({
        product: i._id,
        name: i.name,
        emoji: i.emoji,
        price: i.price,
        qty: i.qty,
        size: i.selectedSize || "",
        color: i.selectedColor || "",
      }));

      const payload = {
        items,
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.pincode,
        },
        deliveryMethod: delivery,
        paymentMethod: payment,
      };
      if (!user) payload.guestEmail = guestEmail;
      if (appliedCoupon) payload.couponCode = appliedCoupon.code;

      if (payment === "upi" || payment === "card") {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) throw new Error("Could not load Razorpay checkout.");

        const rpOrder = await createRazorpayOrder({
          items,
          deliveryMethod: delivery,
          couponCode: appliedCoupon?.code || "",
        });

        const options = {
          key: rpOrder.data.keyId,
          amount: rpOrder.data.amount,
          currency: rpOrder.data.currency,
          name: "Rakhi",
          description: "Rakhi order payment",
          order_id: rpOrder.data.id,
          prefill: {
            name: shippingAddress.fullName,
            email: user?.email || guestEmail || "",
            contact: shippingAddress.phone,
          },
          handler: async (response) => {
            const verifiedOrder = await createOrder({
              ...payload,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setPlacedOrderId(verifiedOrder.data._id);
            clearCart();
            setFieldErrors({});
          },
          theme: {
            color: "#c41230",
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
        setPlacing(false);
        return;
      }

      const res = await createOrder(payload);
      setPlacedOrderId(res.data._id);
      clearCart();
      setFieldErrors({});
    } catch (err) {
      setError(err.response?.data?.message || "Could not place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (placedOrderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto text-green-600 mb-4" size={64} />
        <h2 className="font-display text-2xl text-maroon mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-4">
          Thank you — your rakhi is on its way. We've recorded your order.
        </p>

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 inline-block">
          <p className="text-xs text-gray-400 mb-1">Your Order ID</p>
          <p className="font-mono text-sm font-medium text-maroon">{placedOrderId}</p>
        </div>

        {!user && (
          <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
            Save this Order ID — since you checked out as a guest, you'll need it (along
            with your email) to track this order later on the{" "}
            <Link to="/track-order" className="text-rakhired">Track Order</Link> page.
          </p>
        )}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {user ? (
            <Link to={`/orders/${placedOrderId}`} className="bg-rakhired text-white px-6 py-3 rounded-full hover:bg-maroon transition-colors">
              View Order
            </Link>
          ) : (
            <Link to="/track-order" className="bg-rakhired text-white px-6 py-3 rounded-full hover:bg-maroon transition-colors">
              Track This Order
            </Link>
          )}
          <Link to="/shop" className="border border-rakhired text-rakhired px-6 py-3 rounded-full hover:bg-rakhired hover:text-white transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Guest vs account choice screen
  if (!user && mode === "choose") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl text-maroon mb-6">How would you like to checkout?</h2>
        <div className="grid gap-4">
          <button
            onClick={() => setMode("guest")}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
          >
            <p className="font-semibold mb-1">Continue as Guest</p>
            <p className="text-sm text-gray-500">Checkout quickly without creating an account.</p>
          </button>
          <Link to="/login" state={{ from: "/checkout" }} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow text-left block">
            <p className="font-semibold mb-1">Login</p>
            <p className="text-sm text-gray-500">Access saved addresses and order history.</p>
          </Link>
          <Link to="/register" state={{ from: "/checkout" }} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow text-left block">
            <p className="font-semibold mb-1">Create an Account</p>
            <p className="text-sm text-gray-500">Faster checkout next time and order tracking.</p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-[1fr_340px] gap-8">
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-maroon">Checkout</h2>

        {!user && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold mb-3">Contact Email</h3>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.guestEmail)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rakhired ${
                fieldErrors.guestEmail ? "border-rakhired" : "border-gray-300"
              }`}
            />
            {fieldErrors.guestEmail && <p className="mt-1 text-xs text-rakhired">{fieldErrors.guestEmail}</p>}
            <p className="text-xs text-gray-400 mt-2">
              Checking out as guest. <button type="button" className="text-rakhired" onClick={() => setMode("choose")}>Change</button>
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">Shipping Address</h3>
          {fieldErrors.address && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2 mb-4">{fieldErrors.address}</p>}

          {user && savedAddresses.length > 0 && !addingNew && (
            <div className="space-y-2 mb-4">
              {savedAddresses.map((a) => (
                <label
                  key={a._id}
                  className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${
                    selectedAddressId === a._id ? "border-rakhired bg-rakhired/5" : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === a._id}
                    onChange={() => setSelectedAddressId(a._id)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium">{a.fullName} · {a.label}</p>
                    <p className="text-gray-500">{a.line1}, {a.line2 ? `${a.line2}, ` : ""}{a.city}, {a.state} - {a.pincode}</p>
                    <p className="text-gray-500">{a.phone}</p>
                  </div>
                </label>
              ))}
              <button onClick={() => setAddingNew(true)} className="text-sm text-rakhired font-medium">
                + Add a new address
              </button>
            </div>
          )}

          {(!user || addingNew || savedAddresses.length === 0) && (
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Full Name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
              <input placeholder="Phone Number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
              <input placeholder="Address Line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
              <input placeholder="Address Line 2 (optional)" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
              <input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
              {user && savedAddresses.length > 0 && (
                <button type="button" onClick={() => setAddingNew(false)} className="text-sm text-gray-400 hover:text-rakhired sm:col-span-2 text-left">
                  Cancel and use a saved address
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">Delivery Method</h3>
          <div className="space-y-2">
            {DELIVERY_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer ${
                  delivery === opt.id ? "border-rakhired bg-rakhired/5" : "border-gray-200"
                }`}
              >
                <input type="radio" name="delivery" checked={delivery === opt.id} onChange={() => setDelivery(opt.id)} />
                <opt.icon size={18} className="text-rakhired" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-gray-500">{opt.desc}</p>
                </div>
                <span className="text-sm font-medium">{opt.cost === 0 ? "Free" : `₹${opt.cost}`}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold mb-3">Payment Method</h3>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer ${
                  payment === opt.id ? "border-rakhired bg-rakhired/5" : "border-gray-200"
                }`}
              >
                <input type="radio" name="payment" checked={payment === opt.id} onChange={() => setPayment(opt.id)} />
                <opt.icon size={18} className="text-rakhired" />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-rakhired bg-rakhired/10 rounded-lg px-3 py-2">{error}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-24">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
          {cart.map((item) => (
            <div key={getCartLineId(item)} className="flex justify-between text-sm text-gray-600">
              <span className="truncate pr-2">
                {item.name}
                {[item.selectedSize, item.selectedColor].filter(Boolean).length > 0 &&
                  ` (${[item.selectedSize, item.selectedColor].filter(Boolean).join(", ")})`}
                {" × "}{item.qty}
              </span>
              <span className="shrink-0">₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm mb-2 text-gray-600 border-t border-gray-100 pt-3">
          <span>Subtotal</span>
          <span>₹{cartSubtotal}</span>
        </div>
        <div className="flex justify-between text-sm mb-3 text-gray-600">
          <span>Delivery</span>
          <span>{deliveryCost === 0 ? "Free" : `₹${deliveryCost}`}</span>
        </div>

        {appliedCoupon ? (
          <div className="flex items-center justify-between text-sm mb-3 bg-green-50 text-green-700 rounded-lg px-3 py-2">
            <span className="flex items-center gap-1">
              <Tag size={13} /> {appliedCoupon.code} applied
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">− ₹{appliedCoupon.discountAmount}</span>
              <button onClick={handleRemoveCoupon} className="text-green-700/60 hover:text-green-900">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-rakhired"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="px-4 py-2 rounded-lg border border-rakhired text-rakhired text-sm hover:bg-rakhired hover:text-white transition-colors disabled:opacity-50"
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            </div>
            {couponError && <p className="text-xs text-rakhired mt-1">{couponError}</p>}
          </div>
        )}

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowCoupons((v) => !v)}
            className="text-sm font-medium text-rakhired hover:text-maroon flex items-center gap-2"
          >
            {showCoupons ? "Hide available coupon codes" : "Show available coupon codes"}
            <span className="text-xs text-gray-400">
              {availableCoupons.length > 0 ? `(${availableCoupons.length})` : "(0)"}
            </span>
          </button>

          {showCoupons && availableCoupons.length > 0 && (
          <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-maroon">Available coupon codes</h4>
              <span className="text-[11px] text-gray-400">{availableCoupons.length} offers</span>
            </div>
            <div className="space-y-2">
              {availableCoupons.map((coupon) => {
                const discountLabel = coupon.type === "percentage" ? `${coupon.value}% off` : `₹${coupon.value} off`;
                const validity = coupon.startDate || coupon.endDate
                  ? `${coupon.startDate ? new Date(coupon.startDate).toLocaleDateString("en-IN") : "Start anytime"} - ${coupon.endDate ? new Date(coupon.endDate).toLocaleDateString("en-IN") : "No expiry"}`
                  : "Always active";
                return (
                  <button
                    key={coupon._id}
                    type="button"
                    onClick={() => setCouponInput(coupon.code)}
                    className="w-full text-left rounded-lg border border-dashed border-rakhired/30 bg-white px-3 py-2 hover:bg-rakhired/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-rakhired">{coupon.code}</p>
                        <p className="text-xs text-gray-500">{discountLabel} · Min ₹{coupon.minPurchase || 0}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 text-right">{validity}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-gray-400">
              Tap a code to fill it into the coupon box above, then apply it.
            </p>
          </div>
          )}
          {showCoupons && availableCoupons.length === 0 && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              No active coupons right now.
            </div>
          )}
        </div>

        <div className="flex justify-between font-semibold text-maroon border-t border-gray-100 pt-4 mb-6">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className="w-full bg-rakhired text-white py-3 rounded-full hover:bg-maroon transition-colors disabled:opacity-60"
        >
          {placing ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
