const CART_KEY = "cartItems";

const safeStorage = {
  get() {
    try {
      const raw = localStorage.getItem(CART_KEY) || "[]";
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to read cart:", error);
      return [];
    }
  },
  set(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to persist cart:", error);
    }
  },
};

export const loadCart = () => safeStorage.get();

export const saveCart = (items) => {
  safeStorage.set(items);
};

export const addToCart = (product, quantity = 1) => {
  if (!product || !product.slug) return;
  const items = loadCart();
  const idx = items.findIndex((item) => item.slug === product.slug);
  if (idx >= 0) {
    const existing = items[idx];
    items[idx] = {
      ...existing,
      quantity: Math.max(1, Number(existing.quantity || 0) + Number(quantity || 1)),
    };
  } else {
    items.push({
      id: product.id || product._id || product.slug,
      slug: product.slug,
      name: product.name,
      image: product.image,
      shortDescription: product.shortDescription || product.description || "",
      variations: product.variations || null,
      originalPrice: Number(product.originalPrice ?? product.price ?? product.finalPrice ?? 0),
      finalPrice: Number(product.finalPrice ?? product.price ?? product.originalPrice ?? 0),
      discountType: product.discountType,
      discountValue: product.discountValue,
      quantity: Math.max(1, Number(quantity || 1)),
    });
  }
  saveCart(items);
  return items;
};

export const updateQuantity = (slug, quantity) => {
  const items = loadCart();
  const idx = items.findIndex((item) => item.slug === slug);
  if (idx >= 0) {
    items[idx].quantity = Math.max(1, Number(quantity || 1));
    saveCart(items);
  }
  return items;
};

export const removeFromCart = (slug) => {
  const items = loadCart().filter((item) => item.slug !== slug);
  saveCart(items);
  return items;
};
