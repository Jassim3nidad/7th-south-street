'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdmin } from '@/store/admin'
import { authApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, isAuthenticated } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated()) router.push('/admin/dashboard')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res: any = await authApi.login(email, password)
      setAuth(res.data.admin, res.data.token)
      toast.success('Welcome back.')
      router.push('/admin/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo.png" alt="7SS Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
          </div>
          <div>
            <span className="text-white text-sm tracking-[0.2em] uppercase font-medium">The Vault</span>
            <p className="text-white/20 text-[10px] tracking-widest uppercase">Admin Dashboard</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-white/30 text-[10px] tracking-widest uppercase block mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
              className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A96E]/50 transition-colors"
              placeholder="admin@7thsouthstreet.com" />
          </div>
          <div>
            <label className="text-white/30 text-[10px] tracking-widest uppercase block mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
              className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A96E]/50 transition-colors"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-[#F5F2EE] text-[#080808] text-xs font-medium tracking-widest uppercase hover:bg-[#C9A96E] transition-colors duration-300 disabled:opacity-50 mt-6">
            {loading ? 'Logging in...' : 'Enter The Vault'}
          </button>
        </form>

        <p className="text-white/15 text-xs text-center mt-8 tracking-wider">
          Authorized access only.
        </p>
      </motion.div>
    </main>
  )
}
