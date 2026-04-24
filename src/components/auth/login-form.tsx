'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { fadeIn, slideUp, expand } from '@/lib/motion'

export function LoginForm() {
  const setUser = useAppStore((s) => s.setUser)
  const [selectedRole, setSelectedRole] = useState<'uniteller' | 'vtb' | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVtbLogin() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'vtb' }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error || 'Ошибка входа'); return }
      toast.success('Добро пожаловать!')
      setUser(result)
    } catch { toast.error('Ошибка соединения') } finally { setLoading(false) }
  }

  async function handleUnitellerLogin() {
    if (!password.trim()) { toast.error('Введите пароль'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'uniteller', password: password.trim() }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error || 'Ошибка входа'); return }
      toast.success('Добро пожаловать!')
      setUser(result)
    } catch { toast.error('Ошибка соединения') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* ─── Brand panel (desktop only) ─── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[38%] relative bg-primary overflow-hidden">
        {/* Dot pattern */}
        <div className="absolute inset-0 bg-dots opacity-100" />
        {/* Gradient orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full bg-white/6 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            {/* Logo mark */}
            <div className="w-11 h-11 rounded-2xl bg-white/12 border border-white/16 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">CRM Лиды</h1>
            <p className="text-white/55 text-sm mt-1 font-medium">Uniteller · Управление продажами</p>
          </motion.div>

          <motion.div variants={slideUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }} className="space-y-5">
            {[
              { icon: '◈', text: 'Входящие лиды и воронка продаж' },
              { icon: '◎', text: 'Боевые подключения и статистика' },
              { icon: '◑', text: 'Партнёрский доступ для ВТБ' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-white/40 text-lg font-light w-5 shrink-0">{item.icon}</span>
                <span className="text-white/65 text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── Form panel ─── */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 lg:p-12">
        <motion.div variants={slideUp} initial="hidden" animate="visible" className="w-full max-w-[320px]">

          {/* Mobile logo */}
          <motion.div variants={fadeIn} className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/25">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">CRM Лиды</h1>
            <p className="text-muted-foreground mt-1 text-sm">Управление лидами и партнёрами</p>
          </motion.div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-[22px] font-bold tracking-tight">Вход в систему</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Выберите тип аккаунта</p>
          </div>

          <p className="text-sm text-muted-foreground mb-4 font-medium">Войти как:</p>

          <div className="space-y-2.5">
            {/* VTB */}
            <motion.button
              onClick={handleVtbLogin}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={cn(
                'w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 border',
                'bg-blue-500/8 text-blue-700 border-blue-500/20 hover:bg-blue-500/14 hover:border-blue-500/35',
              )}
            >
              {loading && selectedRole !== 'uniteller'
                ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                : 'ВТБ Партнёр'
              }
            </motion.button>

            {/* Uniteller */}
            <motion.button
              onClick={() => setSelectedRole(selectedRole === 'uniteller' ? null : 'uniteller')}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={cn(
                'w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 border',
                selectedRole === 'uniteller'
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-primary/8 text-primary border-primary/20 hover:bg-primary/14 hover:border-primary/35',
              )}
            >
              UNITELLER
            </motion.button>
          </div>

          {/* Password expand */}
          <AnimatePresence>
            {selectedRole === 'uniteller' && (
              <motion.div
                key="pw"
                variants={expand}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-2.5 overflow-hidden mt-4"
              >
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUnitellerLogin() }}
                  autoFocus
                  className="h-11 rounded-xl text-base"
                />
                <Button
                  className="w-full h-11 rounded-xl text-base font-semibold shadow-md shadow-primary/20"
                  disabled={loading}
                  onClick={handleUnitellerLogin}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Войти
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
