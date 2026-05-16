import { create } from 'zustand'
import api from '../lib/api'

const useWishlistStore = create((set, get) => ({
  ids: [],

  fetchIds: async () => {
    try {
      const res = await api.get('/wishlist/ids')
      set({ ids: res.data.ids || [] })
    } catch {
      set({ ids: [] })
    }
  },

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
      return null
    }
  },

  isWishlisted: (productId) => {
    return get().ids.includes(productId)
  },
}))

export default useWishlistStore