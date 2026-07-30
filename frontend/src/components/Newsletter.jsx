import React, { useState } from "react";
import { Mail } from "lucide-react";
import { subscribeNewsletter } from "../api/api.js";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await subscribeNewsletter(email);
      setStatus(res.data.message);
      setEmail("");
    } catch (err) {
      setStatus(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="bg-[#fdeee0] rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/70 shadow-sm">
        <div className="flex items-center gap-4">
          <Mail className="text-rakhired" size={28} />
          <div>
            <p className="font-semibold text-maroon">Subscribe to Our Newsletter</p>
            <p className="text-sm text-gray-600">
              Get the latest updates on new arrivals, offers and more.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="px-4 py-2 rounded-full border border-gray-300 text-sm w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-rakhired"
          />
          <button
            type="submit"
            className="bg-rakhired text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-maroon transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
      {status && <p className="text-sm text-center mt-3 text-maroon">{status}</p>}
    </section>
  );
}
