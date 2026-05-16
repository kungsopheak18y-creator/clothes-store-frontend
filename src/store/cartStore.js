import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product, variant, quantity = 1) => {
    const items = get().items;
    const existing = items.find((i) => i.variantId === variant.id);

    if (existing) {
      set({
        items: items.map((i) =>
          i.variantId === variant.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            price: parseFloat(variant.price || product.price),
            size: variant.size,
            color: variant.color,
            image: product.images?.[0] ?? null,  // ✅ fixed
            quantity,
          },
        ],
      });
    }
  },

  removeItem: (variantId) =>
    set({ items: get().items.filter((i) => i.variantId !== variantId) }),

  updateQuantity: (variantId, quantity) =>
    set({
      items: get().items.map((i) =>
        i.variantId === variantId ? { ...i, quantity } : i
      ),
    }),

  clearCart: () => set({ items: [] }),

  getTotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));

export default useCartStore;