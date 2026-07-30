import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingCart, LogOut, Package, MapPin, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { getCategoryTree } from "../api/api.js";

const FALLBACK_NAV = [
  { name: "Rakhi", slug: "rakhi", children: [] },
  { name: "Jewellery", slug: "jewellery", children: [] },
  { name: "Ladies Wear", slug: "ladies-wear", children: [] },
  { name: "Gents Wear", slug: "gents-wear", children: [] },
  { name: "Kids Wear", slug: "kids-wear", children: [] },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { cartCount, wishlist } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [navTree, setNavTree] = useState(FALLBACK_NAV);
  const [openMenu, setOpenMenu] = useState(null); // slug of the hovered top-level item (desktop)
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null); // slug expanded in the mobile accordion
  const navigate = useNavigate();

  useEffect(() => {
    getCategoryTree()
      .then((res) => {
        if (res.data?.length) setNavTree(res.data);
      })
      .catch(() => {
        // keep fallback nav if the API/DB isn't running
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur sticky top-0 z-40 border-b border-maroon/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-rakhired flex items-center justify-center text-white text-lg shadow-sm">
            ✿
          </div>
          <div>
            <h1 className="font-display text-2xl text-maroon leading-none">Rakhi</h1>
            <p className="text-[10px] tracking-wide text-rakhired -mt-1">Thread of Love</p>
          </div>
        </Link>

        {/* Desktop nav with hover submenus */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-700">
          <Link to="/shop" className="px-3 py-2 hover:text-rakhired transition-colors">Shop All</Link>
          {navTree.map((cat) => (
            <div
              key={cat.slug}
              className="relative"
              onMouseEnter={() => setOpenMenu(cat.slug)}
              onMouseLeave={() => setOpenMenu((m) => (m === cat.slug ? null : m))}
            >
              <Link
                to={`/shop?category=${cat.slug}`}
                className="flex items-center gap-1 px-3 py-2 hover:text-rakhired transition-colors"
              >
                {cat.name}
                {cat.children?.length > 0 && <ChevronDown size={13} />}
              </Link>

              {cat.children?.length > 0 && openMenu === cat.slug && (
                <div className="absolute left-0 top-full pt-1 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[200px]">
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.slug}
                        to={`/shop?category=${sub.slug}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-cream hover:text-rakhired"
                        onClick={() => setOpenMenu(null)}
                      >
                        <span>{sub.emoji}</span> {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-gray-700 relative">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => !searchTerm && setSearchOpen(false)}
                placeholder="Search products..."
                className="border border-gray-300 rounded-full px-3 py-1 text-sm w-40 sm:w-56 focus:outline-none focus:ring-2 focus:ring-rakhired"
              />
            </form>
          ) : (
            <Search size={20} className="cursor-pointer hover:text-rakhired" onClick={() => setSearchOpen(true)} />
          )}

          <div className="relative">
            <User
              size={20}
              className="cursor-pointer hover:text-rakhired"
              onClick={() => setAccountOpen((o) => !o)}
            />
            {accountOpen && (
              <div
                className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 text-sm z-50"
                onMouseLeave={() => setAccountOpen(false)}
              >
                {user ? (
                  <>
                    <div className="px-4 py-2 text-gray-500 text-xs">Hi, {user.name}</div>
                    <Link to="/orders" className="flex items-center gap-2 px-4 py-2 hover:bg-cream" onClick={() => setAccountOpen(false)}>
                      <Package size={14} /> My Orders
                    </Link>
                    <Link to="/addresses" className="flex items-center gap-2 px-4 py-2 hover:bg-cream" onClick={() => setAccountOpen(false)}>
                      <MapPin size={14} /> My Addresses
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setAccountOpen(false);
                        navigate("/");
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-cream text-rakhired"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block px-4 py-2 hover:bg-cream" onClick={() => setAccountOpen(false)}>
                      Login
                    </Link>
                    <Link to="/register" className="block px-4 py-2 hover:bg-cream" onClick={() => setAccountOpen(false)}>
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/wishlist" className="relative cursor-pointer hover:text-rakhired">
            <Heart size={20} />
            {wishlist?.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rakhired text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative cursor-pointer hover:text-rakhired">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rakhired text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          <button className="lg:hidden text-gray-700" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile nav: accordion-style submenus */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 max-h-[70vh] overflow-y-auto">
          <Link to="/shop" className="block py-2" onClick={() => setMobileOpen(false)}>Shop All</Link>
          {navTree.map((cat) => (
            <div key={cat.slug} className="border-t border-gray-50">
              <div className="flex items-center justify-between py-2">
                <Link to={`/shop?category=${cat.slug}`} onClick={() => setMobileOpen(false)}>
                  {cat.name}
                </Link>
                {cat.children?.length > 0 && (
                  <button
                    onClick={() => setMobileExpanded((m) => (m === cat.slug ? null : cat.slug))}
                    className="p-1 text-gray-400"
                  >
                    <ChevronDown size={16} className={mobileExpanded === cat.slug ? "rotate-180 transition-transform" : "transition-transform"} />
                  </button>
                )}
              </div>
              {cat.children?.length > 0 && mobileExpanded === cat.slug && (
                <div className="pl-4 pb-2 space-y-1">
                  {cat.children.map((sub) => (
                    <Link
                      key={sub.slug}
                      to={`/shop?category=${sub.slug}`}
                      className="flex items-center gap-2 py-1.5 text-gray-500"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>{sub.emoji}</span> {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
