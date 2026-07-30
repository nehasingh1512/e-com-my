import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Phone, Mail, MapPin } from "lucide-react";
import { getCategoryTree } from "../api/api.js";

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Track Order", to: "/track-order" },
];
const customerService = [
  { label: "Shipping Policy", to: "/shipping-policy" },
  { label: "Return Policy", to: "/return-policy" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms-conditions" },
  { label: "FAQ's", to: "/faq" },
];

export default function Footer() {
  const [popularCategories, setPopularCategories] = useState([]);

  useEffect(() => {
    getCategoryTree()
      .then((res) => {
        const topLevel = (res.data || []).slice(0, 5).map((cat) => ({
          label: cat.name,
          to: `/shop?category=${cat.slug}`,
        }));
        setPopularCategories(topLevel);
      })
      .catch(() => setPopularCategories([]));
  }, []);

  return (
    <footer className="bg-maroon-dark bg-maroon text-cream mt-6">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2">
          <h3 className="font-display text-2xl mb-2">Rakhi</h3>
          <p className="text-xs text-cream/70 mb-4">Thread of Love</p>
          <p className="text-cream/80 mb-4 max-w-xs">
            Rakhi is not just a thread, it's a promise of love, care and
            protection. Celebrate this bond with our beautiful collection.
          </p>
          <div className="flex gap-3">
            <Facebook size={18} />
            <Instagram size={18} />
            <Youtube size={18} />
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-cream/80">
            {quickLinks.map((l) => (
              <li key={l.label}><Link to={l.to} className="hover:text-white">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Customer Service</h4>
          <ul className="space-y-2 text-cream/80">
            {customerService.map((l) => (
              <li key={l.label}><Link to={l.to} className="hover:text-white">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Popular Categories</h4>
          <ul className="space-y-2 text-cream/80 mb-4">
            {popularCategories.length > 0 ? (
              popularCategories.map((l) => (
                <li key={l.label}><Link to={l.to} className="hover:text-white">{l.label}</Link></li>
              ))
            ) : (
              <li className="text-cream/60">Loading categories...</li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 grid md:grid-cols-3 gap-4 text-sm text-cream/80">
        <p className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</p>
        <p className="flex items-center gap-2"><Mail size={14} /> support@rakhi.com</p>
        <p className="flex items-center gap-2"><MapPin size={14} /> 123, Love Street, Jaipur, Rajasthan - 302001, India</p>
      </div>

      <div className="border-t border-cream/20 text-center text-xs text-cream/60 py-4">
        © 2024 Rakhi - Thread of Love. All Rights Reserved.
      </div>
    </footer>
  );
}
