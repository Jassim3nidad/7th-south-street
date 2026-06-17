import { create } from 'zustand'

type Admin = { id: number; name: string; email: string; role: string }

type AdminStore = {
  admin: Admin | null
  token: string | null
  setAuth: (admin: Admin, token: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAdmin = create<AdminStore>((set, get) => ({
  admin:
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('7ss_admin') || 'null')
      : null,
  token:
    typeof window !== 'undefined' ? localStorage.getItem('7ss_token') : null,

  setAuth: (admin, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('7ss_admin', JSON.stringify(admin))
      localStorage.setItem('7ss_token', token)
    }
    set({ admin, token })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('7ss_admin')
      localStorage.removeItem('7ss_token')
    }
    set({ admin: null, token: null })
  },

  isAuthenticated: () => !!get().token,
}))
