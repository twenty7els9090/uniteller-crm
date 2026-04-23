'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { fadeIn, slideUp, popIn } from '@/lib/motion'

export function LoginForm() {
  const setUser = useAppStore((s) => s.setUser)

  const [selectedRole, setSelectedRole] = useState<'uniteller' | 'vtb' | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  /** VTB — instant login by button, no password */
  async function handleVtbLogin() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'vtb' }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Ошибка входа')
        return
      }

      toast.success('Добро пожаловать!')
      setUser(result)
    } catch {
      toast.error('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  /** Uniteller — requires password */
  async function handleUnitellerLogin() {
    if (!password.trim()) {
      toast.error('Введите пароль')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'uniteller', password: password.trim() }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Ошибка входа')
        return
      }

      toast.success('Добро пожаловать!')
      setUser(result)
    } catch {
      toast.error('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex safe-top">
      {/* ─── Left Brand Panel (desktop) ─── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden">
        {/* Deep gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 animate-gradient-shift" />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        {/* Floating geometric shapes */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[14%] right-[12%] w-24 h-24 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.10]"
        />
        <motion.div
          animate={{ y: [0, 16, 0], rotate: [0, -6, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-[20%] right-[25%] w-16 h-16 rounded-xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08]"
        />
        <motion.div
          animate={{ y: [0, -14, 0], x: [0, 10, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-[40%] left-[10%] w-12 h-12 rounded-full bg-teal-400/[0.08] backdrop-blur-sm border border-teal-400/[0.12]"
        />
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute bottom-[38%] left-[32%] w-8 h-8 rounded-lg bg-white/[0.07] backdrop-blur-sm border border-white/[0.09]"
        />

        {/* Gradient orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-cyan-400/10 blur-[100px]" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 2xl:p-16 text-white w-full">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <div className="w-12 h-12 rounded-xl bg-white/[0.10] backdrop-blur-md flex items-center justify-center mb-6 border border-white/[0.15] shadow-lg shadow-black/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <h1 className="text-[1.6rem] font-bold tracking-tight leading-tight">CRM Лиды</h1>
            <p className="text-white/40 text-[0.8rem] mt-2 tracking-wide uppercase font-medium">Uniteller Platform</p>
          </motion.div>

          <motion.div variants={slideUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <p className="text-xl font-semibold text-white/90 leading-snug">Управляйте лидами<br />эффективно</p>
            <p className="text-white/35 text-sm mt-3 leading-relaxed max-w-[20rem]">
              Воронка продаж, отслеживание статусов, аналитика и работа с партнёрами — всё в одном месте.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] px-6 py-10 sm:px-8 lg:p-12 xl:p-14">
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <motion.div
            variants={popIn}
            initial="hidden"
            animate="visible"
            className="lg:hidden text-center mb-14"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/25 ring-4 ring-slate-900/[0.06]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h1 className="text-[1.4rem] font-bold tracking-tight text-slate-900">CRM Лиды</h1>
            <p className="text-slate-400 mt-1.5 text-[0.82rem]">Управление лидами и партнёрами</p>
          </motion.div>

          {/* Desktop heading */}
          <motion.div variants={fadeIn} className="hidden lg:block mb-12">
            <h2 className="text-[1.7rem] font-bold tracking-tight text-slate-900 leading-tight">Вход в систему</h2>
            <p className="text-slate-400 mt-2 text-[0.88rem]">Выберите способ входа</p>
          </motion.div>

          <motion.p
            variants={slideUp}
            className="text-[0.78rem] font-semibold text-slate-400 mb-5 tracking-widest uppercase"
          >
            Войти как
          </motion.p>

          <motion.div variants={slideUp} className="space-y-3">
            {/* VTB — instant login button */}
            <motion.button
              onClick={handleVtbLogin}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2 }}
              disabled={loading}
              className={cn(
                'relative w-full rounded-xl py-4 text-center text-sm font-semibold transition-all duration-300 ease-out',
                selectedRole === 'vtb'
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/25 ring-1 ring-slate-700/50'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
              )}
            >
              {loading && selectedRole === 'vtb' ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                'ВТБ Партнёр'
              )}
            </motion.button>

            {/* Uniteller — expand to password */}
            <motion.button
              onClick={() => setSelectedRole(selectedRole === 'uniteller' ? null : 'uniteller')}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2 }}
              disabled={loading}
              className={cn(
                'relative w-full rounded-xl py-4 text-center text-sm font-semibold transition-all duration-300 ease-out',
                selectedRole === 'uniteller'
                  ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/25 ring-1 ring-teal-500/30'
                  : 'bg-white text-teal-700 hover:bg-teal-50/50 border border-teal-200/70 hover:border-teal-300 shadow-sm hover:shadow-md'
              )}
            >
              {loading && selectedRole === 'uniteller' ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                'UNITELLER'
              )}
            </motion.button>
          </motion.div>

          {/* Uniteller password field */}
          <AnimatePresence>
            {selectedRole === 'uniteller' && (
              <motion.div
                key="password-field"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 28 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                className="space-y-4 overflow-hidden"
              >
                <motion.div
                  animate={{
                    boxShadow: selectedRole === 'uniteller'
                      ? '0 0 0 3px rgba(13, 148, 136, 0.1), 0 1px 3px rgba(0,0,0,0.06)'
                      : '0 0 0 0px rgba(13, 148, 136, 0)',
                  }}
                  transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                  className="rounded-xl"
                >
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUnitellerLogin()
                    }}
                    autoFocus
                    className="h-[3.25rem] rounded-xl bg-white border-slate-200 text-base focus-visible:ring-teal-500/20 focus-visible:border-teal-400 transition-all duration-300"
                  />
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full h-[3.25rem] rounded-xl text-[0.95rem] font-semibold transition-all duration-300 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/25"
                    disabled={loading}
                    onClick={handleUnitellerLogin}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Войти
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
