import { create } from 'zustand'
import api from '../lib/api'

const useWishlistStore = create((set, get) => ({
  ids: [], // product IDs that are wishlisted

  // Fetch all wishlisted product IDs
  fetchIds: async () => {
    try {
      const res = await api.get('/wishlist/ids')
      set({ ids: res.data.ids || [] })
    } catch {
      set({ ids: [] })
    }
  },

  // Toggle wishlist — add or remove
  toggle: async (productId) => {
    try {
      const res = await api.post('/wishlist/toggle', { product_id: productId })
      const wishlisted = res.data.wishlisted

      if (wishlisted) {
        set({ ids: [...get().ids, productId] })
      } else {
        set({ ids: get().ids.filter(id => id !== productId) })
      }

      return wishlisted
    } catch (err) {
      console.error(err)
      return false
    }
  },

  // Check if a product is wishlisted
  isWishlisted: (productId) => {
    return get().ids.includes(productId)
  },
}))

export default useWishlistStore