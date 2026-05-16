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
      return null // ✅ return null on error so we can detect failure
    }
  },

  // ✅ Remove — force remove even if toggle state is out of sync
  remove: async (productId) => {
    try {
      const isCurrentlyWishlisted = get().ids.includes(productId)

      // ✅ If already in store as wishlisted, toggle will remove it
      // ✅ If not in store, call toggle anyway — backend will handle it
      const res = await api.post('/wishlist/toggle', { product_id: productId })
      const wishlisted = res.data.wishlisted

      // ✅ If toggle added it back (out of sync), toggle again to remove
      if (wishlisted) {
        await api.post('/wishlist/toggle', { product_id: productId })
        set({ ids: get().ids.filter(id => id !== productId) })
      } else {
        set({ ids: get().ids.filter(id => id !== productId) })
      }

      return true
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