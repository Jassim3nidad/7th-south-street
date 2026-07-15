import { create } from 'zustand'

type Admin = { id: string; name: string; email: string; role: string }

type AdminStore = {
  admin: Admin | null
  token: string | null
  setAuth: (admin: Admin, token: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAdmin = create<AdminStore>((set, get) => ({
  admin: null,
  token: null,

  setAuth: (admin, token) => {
    set({ admin, token })
  },

  logout: () => {
    set({ admin: null, token: null })
  },

  isAuthenticated: () => !!get().token,
}))
