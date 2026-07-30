import React from "react";
import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const features = [
  { icon: Truck, title: "Free Shipping", subtitle: "On Orders Above ₹499" },
  { icon: ShieldCheck, title: "Secure Payment", subtitle: "100% Secure Payments" },
  { icon: RotateCcw, title: "Easy Returns", subtitle: "7 Days Return Policy" },
  { icon: Headphones, title: "24/7 Support", subtitle: "We're Here to Help" },
];

export default function FeaturesBar() {
  return (
    <div className="max-w-6xl mx-auto -mt-8 relative z-10 px-4">
      <div className="bg-white rounded-2xl shadow-md grid grid-cols-2 md:grid-cols-4 gap-6 px-6 py-6">
        {features.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="text-rakhired" size={26} />
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
