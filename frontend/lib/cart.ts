export type CartItem = {
  id: number;
  designation: string;
  price: number;
  quantity: number;
  image?: string;
};

const KEY = "bricomenage_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-change"));
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
  const items = getCart();
  const quantity = Math.max(1, Number(item.quantity || 1));
  const found = items.find((entry) => entry.id === item.id);
  if (found) found.quantity += quantity;
  else items.push({ ...item, quantity });
  saveCart(items);
}
