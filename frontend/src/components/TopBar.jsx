import React from "react";
import { Phone, Instagram, Facebook } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-maroon text-cream text-xs md:text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 gap-4">
        <span className="hidden sm:block">Free Shipping on Orders Above ₹499</span>
        <span className="font-semibold">Early Bird Sale! Flat 20% OFF</span>
        <div className="hidden sm:flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Phone size={14} /> Call Us: +91 98765 43210
          </span>
          <Instagram size={14} />
          <Facebook size={14} />
        </div>
      </div>
    </div>
  );
}
