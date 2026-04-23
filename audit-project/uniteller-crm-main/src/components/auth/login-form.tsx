'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { fadeIn, slideUp } from '@/lib/motion'

export function LoginForm() {
  const setUser = useAppStore((s) => s.setUser)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)

  const [selectedRole, setSelectedRole] = useState<'uniteller' | 'vtb' | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(role: 'uniteller' | 'vtb') {
    if (!password.trim()) {
      toast.error('Введите пароль')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password: password.trim() }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Ошибка входа')
        return
      }

      toast.success('Добро пожаловать!')
      setUser(result)
      setCurrentPage('main')
    } catch {
      toast.error('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex safe-top">
      {/* ─── Left Brand Panel (desktop) ─── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-gradient-to-br from-primary via-primary/90 to-emerald-600 overflow-hidden">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        {/* Gradient orbs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3 border border-white/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CRM Лиды</h1>
            <p className="text-white/70 text-sm mt-1">Платформа управления продажами</p>
          </motion.div>

          <motion.div variants={slideUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <p className="text-lg font-medium text-white/90">Управляйте лидами эффективно</p>
            <p className="text-white/50 text-sm mt-2 leading-relaxed max-w-sm">
              Воронка продаж, отслеживание статусов, аналитика и работа с партнёрами — всё в одном месте.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 lg:p-10">
        <motion.div
          variants={slideUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[340px]"
        >
          {/* Mobile logo */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="lg:hidden text-center mb-10"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">CRM Лиды</h1>
            <p className="text-muted-foreground mt-1 text-sm">Управление лидами и партнёрами</p>
          </motion.div>

          {/* Desktop heading */}
          <motion.div variants={fadeIn} className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Вход в систему</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Выберите роль и введите пароль</p>
          </motion.div>

          <motion.p
            variants={slideUp}
            className="text-sm font-medium text-muted-foreground mb-4"
          >
            Войти как:
          </motion.p>

          <motion.div variants={slideUp} className="space-y-2.5">
            <motion.button
              onClick={() => setSelectedRole('uniteller')}
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
              className={cn(
                'w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-200',
                selectedRole === 'uniteller'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary/30'
                  : 'bg-primary/5 text-primary hover:bg-primary/10 active:bg-primary/10 border border-primary/10'
              )}
            >
              UNITELLER
            </motion.button>

            <motion.button
              onClick={() => setSelectedRole('vtb')}
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
              className={cn(
                'w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-200',
                selectedRole === 'vtb'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30'
                  : 'bg-blue-500/5 text-blue-600 hover:bg-blue-500/10 active:bg-blue-500/10 border border-blue-500/10'
              )}
            >
              ВТБ
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {selectedRole && (
              <motion.div
                key="password-field"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                className="space-y-3 overflow-hidden"
              >
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin(selectedRole)
                  }}
                  autoFocus
                  className="h-12 rounded-xl bg-white/80 border-border/80 text-base backdrop-blur-sm"
                />
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    className={cn(
                      'w-full h-12 rounded-xl text-base font-semibold transition-all duration-200 shadow-lg',
                      selectedRole === 'uniteller'
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
                    )}
                    disabled={loading}
                    onClick={() => handleLogin(selectedRole)}
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
