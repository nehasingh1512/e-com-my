import React from "react";
import Hero from "../components/Hero.jsx";
import FeaturesBar from "../components/FeaturesBar.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import PromoBanners from "../components/PromoBanners.jsx";
import BestSelling from "../components/BestSelling.jsx";
import ComboBanner from "../components/ComboBanner.jsx";
import Newsletter from "../components/Newsletter.jsx";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturesBar />
      <CategoryGrid />
      <PromoBanners />
      <BestSelling />
      <ComboBanner />
      <Newsletter />
    </>
  );
}
