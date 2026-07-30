import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getBanners } from "../api/api.js";

function DefaultHero() {
  return (
    <section className="relative overflow-hidden bg-[#f8efe3]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center relative">
        <div className="max-w-xl">
          <p className="font-display italic text-rakhired text-lg mb-2">
            Celebrate the Bond of Love ♥
          </p>
          <h2 className="font-display text-4xl md:text-6xl text-maroon leading-tight mb-4">
            Happy <br /> Raksha Bandhan
          </h2>
          <p className="text-gray-600 max-w-md mb-6">
            Beautiful Rakhis, Thoughtful Gifts and Sweet Moments to make this
            Rakhi extra special.
          </p>
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              to="/shop"
              className="bg-rakhired text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-maroon transition-colors shadow-sm"
            >
              Shop Rakhis <ArrowRight size={16} />
            </Link>
            <Link
              to="/shop?category=gift-hampers"
              className="border border-rakhired text-rakhired px-6 py-3 rounded-full hover:bg-rakhired hover:text-white transition-colors"
            >
              Explore Combos
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gold border-2 border-white" />
              ))}
            </div>
            <span className="text-sm text-gray-600">50,000+ Happy Customers</span>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="w-full max-w-lg aspect-square rounded-full bg-[#eadbc4] flex items-center justify-center shadow-inner relative">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-rakhired to-maroon flex items-center justify-center text-cream text-5xl shadow-lg">
              ✿
            </div>
            <span className="absolute top-4 right-4 bg-rakhired text-white rounded-full w-20 h-20 flex flex-col items-center justify-center text-xs font-bold shadow-lg">
              FLAT
              <span className="text-lg">20%</span>
              OFF
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Hero() {
  const [banners, setBanners] = useState(null); // null = still loading, [] = loaded but empty
  const [active, setActive] = useState(0);

  useEffect(() => {
    getBanners({ type: "hero_slider" })
      .then((res) => setBanners(res.data || []))
      .catch(() => setBanners([])); // fall back to the default hero if the API/DB isn't reachable
  }, []);

  useEffect(() => {
    if (!banners || banners.length < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners]);

  // Still loading, or no admin-managed banners exist -> show the built-in default hero.
  if (!banners || banners.length === 0) return <DefaultHero />;

  const banner = banners[active];
  const content = (
    <div className="relative w-full aspect-[16/7] min-h-[320px] rounded-none overflow-hidden">
      <img
        src={banner.desktopImage}
        alt={banner.title}
        className="w-full h-full object-cover absolute inset-0 hidden sm:block"
      />
      <img
        src={banner.mobileImage || banner.desktopImage}
        alt={banner.title}
        className="w-full h-full object-cover absolute inset-0 sm:hidden"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
      <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center text-white">
        <h2 className="font-display text-3xl md:text-5xl mb-2 max-w-lg">{banner.title}</h2>
        {banner.subtitle && <p className="max-w-md mb-5 text-white/90">{banner.subtitle}</p>}
        <Link
          to={banner.linkUrl || "/shop"}
          className="bg-rakhired text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-maroon transition-colors w-fit"
        >
          Shop Now <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  return (
    <section className="relative bg-[#f8efe3]">
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target={banner.linkUrl.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {content}
        </a>
      ) : (
        content
      )}

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setActive((i) => (i - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setActive((i) => (i + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full ${i === active ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
