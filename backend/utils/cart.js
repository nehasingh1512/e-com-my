const isValidQty = (qty) => Number.isInteger(qty) && qty > 0;

// Two cart lines are the "same" line only if they're the same product AND the
// same size/color selection — otherwise different variants would silently
// collapse into one line and lose the customer's actual selection.
const lineKey = (product, size, color) => `${product}::${size || ""}::${color || ""}`;

export const normalizeCartItems = (items = []) => {
  const map = new Map();

  for (const rawItem of items) {
    const product = rawItem?.product ?? rawItem?._id ?? null;
    if (!product) continue;

    const qty = Number(rawItem?.qty ?? 1);
    if (!isValidQty(qty)) continue;

    const size = String(rawItem?.size || "").trim();
    const color = String(rawItem?.color || "").trim();
    const key = lineKey(String(product), size, color);

    if (map.has(key)) {
      map.get(key).qty += qty;
    } else {
      map.set(key, { product, qty, size, color });
    }
  }

  return Array.from(map.values());
};

export const normalizeOrderItems = (items = []) =>
  items
    .filter((item) => item && (item.product || item._id))
    .map((item) => ({
      product: item.product || item._id,
      name: String(item.name || "").trim(),
      image: item.image || "",
      emoji: item.emoji || "",
      price: Number(item.price || 0),
      qty: Number(item.qty || 0),
      size: String(item.size || "").trim(),
      color: String(item.color || "").trim(),
    }))
    .filter((item) => item.product && item.name && item.price >= 0 && isValidQty(item.qty));

export const normalizeWishlistIds = (productIds = []) =>
  Array.from(
    new Set(
      productIds
        .filter((id) => id != null && String(id).trim().length > 0)
        .map((id) => String(id))
    )
  );
