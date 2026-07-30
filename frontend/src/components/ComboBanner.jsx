import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ComboBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4">
      <div className="bg-gradient-to-r from-maroon to-rakhired rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between text-cream overflow-hidden relative">
        <div>
          <p className="text-gold font-display text-xl mb-1">Rakhi Combos</p>
          <h4 className="text-2xl md:text-3xl font-semibold mb-4">
            Make Your Celebrations Special
          </h4>
          <Link
            to="/shop?category=gift-hampers"
            className="bg-white text-rakhired px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-cream transition-colors w-fit"
          >
            Shop Combos <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-6 md:mt-0 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl">
            🍬
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">30%</p>
            <p className="text-xs">
              Up to<br />OFF
            </p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl">
            🎁
          </div>
        </div>
      </div>
    </section>
  );
}
