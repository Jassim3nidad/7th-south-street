import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: number
  name: string
  price: number
  size: string
  quantity: number
  image: string
  sku: string
  slug: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: number, size: string) => void
  updateQuantity: (id: number, size: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.id === newItem.id && i.size === newItem.size
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id && i.size === newItem.size
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (id, size) => {
        set((state) => ({
          items: state.items.filter((i) => !(i.id === id && i.size === size)),
        }))
      },

      updateQuantity: (id, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id, size)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id && i.size === size ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotal: () => {
        const { items } = get()
        return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },

      getItemCount: () => {
        const { items } = get()
        return items.reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    {
      name: '7ss-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

// ── Auth Store ────────────────────────────────
interface AuthStore {
  token: string | null
  user: any | null
  isAdmin: boolean
  setAuth: (token: string, user: any) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAdmin: false,

      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('7ss_token', token)
        }
        set({ token, user, isAdmin: user?.role === 'admin' })
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('7ss_token')
        }
        set({ token: null, user: null, isAdmin: false })
      },
    }),
    {
      name: '7ss-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAdmin: state.isAdmin }),
    }
  )
)

// ── Wishlist Store ────────────────────────────
interface WishlistStore {
  items: number[]
  toggle: (productId: number) => void
  has: (productId: number) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (productId) => {
        set((state) => ({
          items: state.items.includes(productId)
            ? state.items.filter((id) => id !== productId)
            : [...state.items, productId],
        }))
      },
      has: (productId) => get().items.includes(productId),
    }),
    { name: '7ss-wishlist' }
  )
)
