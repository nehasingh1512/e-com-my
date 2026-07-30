import React, { useEffect, useState } from "react";
import { getBanners } from "../api/api.js";

// Renders any admin-uploaded "promo" / "homepage" banners as a row of clickable
// image strips. Renders nothing if there are none, so it's safe to drop into
// the homepage unconditionally.
export default function PromoBanners() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    Promise.all([getBanners({ type: "promo" }), getBanners({ type: "homepage" })])
      .then(([promoRes, homepageRes]) => {
        setBanners([...(promoRes.data || []), ...(homepageRes.data || [])]);
      })
      .catch(() => setBanners([]));
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className={`grid gap-4 ${banners.length === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {banners.map((b) => {
          const image = (
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] group">
              <img src={b.desktopImage} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-black/20 flex flex-col justify-center px-6">
                <h4 className="text-white font-display text-xl">{b.title}</h4>
                {b.subtitle && <p className="text-white/80 text-sm">{b.subtitle}</p>}
              </div>
            </div>
          );
          return b.linkUrl ? (
            <a key={b._id} href={b.linkUrl} target={b.linkUrl.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {image}
            </a>
          ) : (
            <div key={b._id}>{image}</div>
          );
        })}
      </div>
    </section>
  );
}
