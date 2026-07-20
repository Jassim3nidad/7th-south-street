'use client'
import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Image from 'next/image'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { AuthNotice } from '@/components/auth/AuthShell'

function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError || !data.user) {
        throw new Error('Invalid email or password.')
      }

      toast.success('Welcome back.')
      router.replace('/admin/dashboard')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="site-shell admin-login flex items-center justify-center px-4">
      <div className="admin-login__theme" aria-label="Appearance settings">
        <ThemeToggle />
      </div>
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="neo-panel w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="neo-inset w-12 h-12 flex items-center justify-center rounded-2xl">
            <Image src="/logo.png" alt="7SS Logo" width={32} height={32} className="brand-logo object-contain" />
          </div>
          <div>
            <span className="text-white text-sm tracking-[0.2em] uppercase font-medium">The Vault</span>
            <p className="text-white/20 text-[10px] tracking-widest uppercase">Admin Dashboard</p>
          </div>
        </div>

        {error === 'forbidden' && (
          <div className="mb-6">
            <AuthNotice tone="error">Access denied. You do not have administrator privileges.</AuthNotice>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-white/30 text-[10px] tracking-widest uppercase block mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
              className="input-dark"
              placeholder="admin@7thsouthstreet.com" />
          </div>
          <div>
            <label className="text-white/30 text-[10px] tracking-widest uppercase block mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
              className="input-dark"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="site-shell flex items-center justify-center">Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  )
}
