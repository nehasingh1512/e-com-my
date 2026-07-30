import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { getProductBySlug, getProducts } from "../api/api.js";
import { useCart } from "../context/CartContext.jsx";
import { getVariantPrice, getDiscountPercent } from "../utils/variant.js";
import ReviewsSection from "../components/ReviewsSection.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [similarProducts, setSimilarProducts] = useState([]);
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProductBySlug(slug)
      .then((res) => {
        const nextProduct = res.data;
        setProduct(nextProduct);
        if (nextProduct.sizes?.length) setSelectedSize(nextProduct.sizes[0].label);
        const colors = [...new Set((nextProduct.variants || []).map((v) => v.color).filter(Boolean))];
        if (colors.length) setSelectedColor(colors[0]);

        const relatedParams = { limit: 4 };
        const categorySlug = nextProduct.category?.slug || nextProduct.category;
        if (categorySlug) relatedParams.category = categorySlug;

        return getProducts(relatedParams).then((productsRes) => {
          const related = (productsRes.data.products || []).filter((p) => (p._id || p.slug) !== (nextProduct._id || nextProduct.slug));
          setSimilarProducts(related);
        });
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const colorOptions = useMemo(
    () => [...new Set((product?.variants || []).map((v) => v.color).filter(Boolean))],
    [product]
  );

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-16 text-gray-500">Loading product...</div>;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">
          We couldn't find this product. Make sure the backend + database are running, or browse the shop.
        </p>
        <Link to="/shop" className="text-rakhired font-medium">Back to Shop</Link>
      </div>
    );
  }

  const id = product._id || product.slug;
  const wishlisted = isWishlisted(id);
  const display = product.display || { showQuantitySelector: true, showSizeDropdown: false, showColorDropdown: false };
  const images = product.images || [];

  // Price reacts live to the size/color picked below — uses the same resolver
  // the cart uses, so what's shown here always matches what gets charged.
  const activeSizeForPricing = display.showSizeDropdown ? selectedSize : "";
  const activeColorForPricing = display.showColorDropdown ? selectedColor : "";
  const displayPrice = getVariantPrice(product, activeSizeForPricing, activeColorForPricing);
  const displayDiscountPercent =
    displayPrice !== product.price ? getDiscountPercent(product.mrp, displayPrice) : product.discountPercent;

  // Determine the stock ceiling for the current selection, so customers can never
  // order more than what's actually available (per-size stock takes priority).
  const selectedSizeStock = display.showSizeDropdown && product.sizes?.length
    ? product.sizes.find((s) => s.label === selectedSize)?.stock ?? 0
    : null;
  const maxQty = selectedSizeStock !== null ? selectedSizeStock : product.stock;
  const outOfStock = maxQty <= 0;

  const handleAddToCart = () => {
    const cartItem = { ...product, selectedSize: display.showSizeDropdown ? selectedSize : undefined, selectedColor: display.showColorDropdown ? selectedColor : undefined };
    addToCart(cartItem, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#f3e3cd] to-[#efd9c4] flex items-center justify-center text-[8rem] overflow-hidden">
            {images.length > 0 ? (
              <img src={images[activeImage]?.url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              product.emoji || "🪢"
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, idx) => (
                <button
                  key={img._id || idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImage === idx ? "border-rakhired" : "border-transparent"}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl text-maroon mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Star size={14} className="fill-gold text-gold" />
            {product.rating} rating
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-semibold text-maroon">₹{displayPrice}</span>
              <span className="text-lg text-gray-400 line-through">₹{product.mrp}</span>
              {displayDiscountPercent > 0 && (
                <span className="text-sm text-rakhired font-medium bg-rakhired/10 px-2 py-1 rounded-full">
                  {displayDiscountPercent}% OFF
                </span>
              )}
            </div>
            {displayPrice !== product.price && (
              <p className="text-xs text-gray-400 mt-1">
                Price for {[activeSizeForPricing, activeColorForPricing].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">{product.shortDescription || product.description}</p>

          {display.showSizeDropdown && product.sizes?.length > 0 && (
            <div className="mb-5">
              <span className="text-sm font-medium block mb-2">Size</span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.label}
                    disabled={s.stock <= 0}
                    onClick={() => { setSelectedSize(s.label); setQty(1); }}
                    className={`px-4 py-1.5 rounded-full text-sm border ${
                      selectedSize === s.label ? "border-rakhired bg-rakhired/10 text-rakhired" : "border-gray-300 text-gray-600"
                    } ${s.stock <= 0 ? "opacity-40 cursor-not-allowed line-through" : "hover:border-rakhired"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {selectedSizeStock !== null && (
                <p className="text-xs text-gray-400 mt-1">
                  {selectedSizeStock > 0 ? `${selectedSizeStock} left in size ${selectedSize}` : "Out of stock in this size"}
                </p>
              )}
            </div>
          )}

          {display.showColorDropdown && colorOptions.length > 0 && (
            <div className="mb-5">
              <span className="text-sm font-medium block mb-2">Color</span>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-4 py-1.5 rounded-full text-sm border ${
                      selectedColor === c ? "border-rakhired bg-rakhired/10 text-rakhired" : "border-gray-300 text-gray-600 hover:border-rakhired"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {display.showQuantitySelector !== false && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-full">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 hover:text-rakhired">
                  <Minus size={14} />
                </button>
                <span className="px-4 text-sm">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} className="p-2 hover:text-rakhired disabled:opacity-30">
                  <Plus size={14} />
                </button>
              </div>
              {maxQty > 0 && maxQty <= 10 && <span className="text-xs text-orange-500">Only {maxQty} left</span>}
            </div>
          )}

          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex-1 bg-rakhired text-white py-3 rounded-full flex items-center justify-center gap-2 hover:bg-maroon transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} /> {outOfStock ? "Out of Stock" : added ? "Added!" : "Add to Cart"}
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                wishlisted ? "border-rakhired text-rakhired" : "border-gray-300 text-gray-500 hover:text-rakhired"
              }`}
            >
              <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {product.description && product.shortDescription && (
            <p className="text-sm text-gray-500 mb-6 leading-relaxed border-t border-gray-100 pt-4">{product.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
            <div className="flex flex-col items-center text-center gap-1 border border-gray-200 rounded-xl p-3">
              <Truck size={18} className="text-rakhired" /> Free Shipping ₹499+
            </div>
            <div className="flex flex-col items-center text-center gap-1 border border-gray-200 rounded-xl p-3">
              <ShieldCheck size={18} className="text-rakhired" /> Secure Payment
            </div>
            <div className="flex flex-col items-center text-center gap-1 border border-gray-200 rounded-xl p-3">
              <RotateCcw size={18} className="text-rakhired" /> 7 Day Returns
            </div>
          </div>
        </div>
      </div>

      <ReviewsSection product={product} />

      {similarProducts.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl text-maroon">Similar Products</h2>
              <p className="text-sm text-gray-500">More items from the same collection.</p>
            </div>
            <Link to="/shop" className="text-sm text-rakhired font-medium">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {similarProducts.map((p) => (
              <ProductCard key={p._id || p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
