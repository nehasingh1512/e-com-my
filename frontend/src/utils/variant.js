// Single source of truth for "what does this product cost given the
// size/color the customer picked" — used by both the product detail page
// (what price to display) and the cart (what price to actually charge), so
// the two can never show different numbers for the same selection.
export const getVariantPrice = (product, selectedSize, selectedColor) => {
  const hasSelection = Boolean(selectedSize || selectedColor);
  if (!hasSelection || !product?.variants?.length) return product?.price;

  const match = product.variants.find(
    (v) =>
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || v.color === selectedColor) &&
      v.price != null
  );
  return match ? match.price : product.price;
};

// Recomputes the "% OFF" badge against the resolved price, since a variant's
// price override can make the product's stored discountPercent stale/wrong.
export const getDiscountPercent = (mrp, price) => {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};
