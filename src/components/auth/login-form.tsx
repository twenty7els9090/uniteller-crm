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
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-gradient-to-br from-primary via-primary/85 to-emerald-700 overflow-hidden">
        {/* Mesh gradient pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 20% 80%, white 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 20%, white 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 50%, white 0%, transparent 50%)
          `,
        }} />

        {/* Dot grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        {/* Floating decorative shapes */}
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[12%] right-[10%] w-20 h-20 rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.12]"
        />
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[18%] right-[22%] w-14 h-14 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.10]"
        />
        <motion.div
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
          className="absolute top-[38%] left-[8%] w-10 h-10 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.10]"
        />
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3.5 }}
          className="absolute bottom-[35%] left-[28%] w-6 h-6 rounded-md bg-white/[0.09] backdrop-blur-sm border border-white/[0.10]"
        />
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, -6, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
          className="absolute top-[22%] left-[45%] w-8 h-8 rounded-lg bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]"
        />

        {/* Gradient orbs */}
        <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-white/10 blur-[80px]" />
        <div className="absolute -bottom-36 -left-36 w-[28rem] h-[28rem] rounded-full bg-emerald-400/15 blur-[80px]" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-[60px]" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 2xl:p-16 text-white w-full">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.12] backdrop-blur-md flex items-center justify-center mb-5 border border-white/[0.18] shadow-lg shadow-black/5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h1 className="text-[1.65rem] font-bold tracking-tight leading-tight">CRM Лиды</h1>
            <p className="text-white/60 text-[0.82rem] mt-2 tracking-wide">Платформа управления продажами</p>
          </motion.div>

          <motion.div variants={slideUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <p className="text-xl font-semibold text-white/90 leading-snug">Управляйте лидами эффективно</p>
            <p className="text-white/45 text-sm mt-3 leading-relaxed max-w-[22rem]">
              Воронка продаж, отслеживание статусов, аналитика и работа с партнёрами — всё в одном месте.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-10 sm:px-8 lg:p-12 xl:p-14">
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[360px]"
        >
          {/* Mobile logo */}
          <motion.div
            variants={popIn}
            initial="hidden"
            animate="visible"
            className="lg:hidden text-center mb-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary/25 ring-4 ring-primary/[0.08]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h1 className="text-[1.4rem] font-bold tracking-tight">CRM Лиды</h1>
            <p className="text-muted-foreground mt-1.5 text-[0.82rem]">Управление лидами и партнёрами</p>
          </motion.div>

          {/* Desktop heading */}
          <motion.div variants={fadeIn} className="hidden lg:block mb-10">
            <h2 className="text-[1.65rem] font-bold tracking-tight leading-tight">Вход в систему</h2>
            <p className="text-muted-foreground/80 mt-2 text-[0.88rem]">Выберите способ входа</p>
          </motion.div>

          <motion.p
            variants={slideUp}
            className="text-[0.82rem] font-medium text-muted-foreground/70 mb-4 tracking-wide uppercase"
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
                'relative w-full rounded-2xl py-4 text-center text-sm font-semibold transition-all duration-300 ease-out',
                selectedRole === 'vtb'
                  ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/25 ring-1 ring-blue-400/20 border border-blue-400/20'
                  : 'bg-white/60 text-blue-600 hover:bg-white/80 backdrop-blur-sm border border-blue-500/15 hover:border-blue-500/25 shadow-sm hover:shadow-md'
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
                'relative w-full rounded-2xl py-4 text-center text-sm font-semibold transition-all duration-300 ease-out',
                selectedRole === 'uniteller'
                  ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/25 ring-1 ring-primary/20 border border-primary/20'
                  : 'bg-white/60 text-primary hover:bg-white/80 backdrop-blur-sm border border-primary/15 hover:border-primary/25 shadow-sm hover:shadow-md'
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
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                className="space-y-3.5 overflow-hidden"
              >
                <motion.div
                  animate={{
                    boxShadow: selectedRole === 'uniteller'
                      ? '0 0 0 3px rgba(20, 184, 166, 0.12), 0 1px 3px rgba(0,0,0,0.06)'
                      : '0 0 0 0px rgba(20, 184, 166, 0)',
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                  className="rounded-2xl"
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
                    className="h-[3.15rem] rounded-2xl bg-white/70 border-border/60 text-base backdrop-blur-sm transition-all duration-300"
                  />
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full h-[3.15rem] rounded-2xl text-[0.95rem] font-semibold transition-all duration-300 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 hover:shadow-xl hover:shadow-primary/25"
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
