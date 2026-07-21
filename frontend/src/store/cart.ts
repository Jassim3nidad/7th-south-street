import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CartItem = {
  id: number
  variant_id: number
  name: string
  price: number
  size: string
  image: string
  quantity: number
  sku: string
}

type CartStore = {
  items: CartItem[]
  isOpen: boolean
  isHydrated: boolean
  setHydrated: () => void
  addItem: (item: CartItem) => void
  removeItem: (id: number, size: string) => void
  updateQty: (id: number, size: string, qty: number) => void
  clearCart: () => void
  toggleCart: () => void
  total: () => number
  count: () => number
  setValidatedItems: (validatedItems: CartItem[]) => void
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(i => i.id === item.id && i.size === item.size)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === item.id && i.size === item.size
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
      },

      removeItem: (id, size) =>
        set((state) => ({ items: state.items.filter(i => !(i.id === id && i.size === size)) })),

      updateQty: (id, size, qty) => {
        if (qty < 1) { get().removeItem(id, size); return }
        set((state) => ({
          items: state.items.map(i =>
            i.id === id && i.size === size ? { ...i, quantity: qty } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      total: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      setValidatedItems: (validatedItems) => set({ items: validatedItems }),
    }),
    {
      name: '7ss-cart',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated()
      },
      partialize: (state) => ({ items: state.items }),
    }
  )
)
