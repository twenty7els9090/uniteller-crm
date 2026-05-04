'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { fadeIn, slideUp, expand } from '@/lib/motion'

function LogoIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  )
}

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
    <div className="min-h-screen flex bg-slate-50">
      {/* ═══ Left Brand Panel (desktop) ═══ */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[42%] relative overflow-hidden">
        {/* Violet gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-800 to-green-900" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        {/* Gradient orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-slate-50 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-400/6 blur-[140px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-slate-200 flex items-center justify-center">
                <LogoIcon className="h-5 w-5 text-green-200" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Uniteller</h1>
                <p className="text-[11px] text-white/50 font-medium tracking-wide uppercase">CRM Platform</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={slideUp} initial="hidden" animate="visible" transition={{ delay: 0.25 }} className="space-y-8 max-w-sm">
            <div>
              <h2 className="text-[28px] xl:text-[32px] font-bold text-white leading-tight tracking-tight">
                Управление
                <br />
                <span className="bg-gradient-to-r from-green-200 to-cyan-200 bg-clip-text text-transparent">
                  лидами и партнёрами
                </span>
              </h2>
              <p className="text-white/50 text-sm mt-3 leading-relaxed">
                Единая платформа для отслеживания воронки продаж, боевых подключений и партнёрских отношений.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: '◈', text: 'Входящие лиды и воронка продаж', sub: 'Автоматический импорт и обработка' },
                { icon: '◎', text: 'Боевые подключения', sub: 'Статистика и аналитика' },
                { icon: '◑', text: 'Партнёрский доступ', sub: 'ВТБ · Интеграция в реальном времени' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-green-200/80 text-xs font-light">{item.icon}</span>
                  </div>
                  <div>
                    <span className="text-white/70 text-[13px] font-medium">{item.text}</span>
                    <p className="text-white/35 text-[11px] mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
            <p className="text-white/25 text-[11px]">© 2025 Uniteller · Все права защищены</p>
          </motion.div>
        </div>
      </div>

      {/* ═══ Right Form Panel ═══ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div variants={slideUp} initial="hidden" animate="visible" className="w-full max-w-[360px] relative z-10">

          {/* Mobile logo */}
          <motion.div variants={fadeIn} className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-4">
              <LogoIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Uniteller</h1>
            <p className="text-slate-500 mt-1 text-sm">CRM Platform</p>
          </motion.div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-primary to-cyan-500" />
              <h2 className="text-[22px] font-bold tracking-tight text-slate-900">Вход в систему</h2>
            </div>
            <p className="text-slate-500 mt-2 text-sm pl-[14px]">Выберите тип аккаунта для продолжения</p>
          </div>

          <p className="text-xs text-slate-400 mb-4 font-medium uppercase tracking-wider">Тип аккаунта</p>

          <div className="space-y-2.5">
            {/* VTB */}
            <motion.button
              onClick={handleVtbLogin}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={cn(
                'w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 border bg-white',
                'border-slate-200 hover:border-green-300 hover:bg-green-50/50',
                'active:scale-[0.98] disabled:opacity-50',
              )}
            >
              {loading && selectedRole !== 'uniteller'
                ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                : (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <span className="text-blue-600 text-[10px] font-bold">В</span>
                    </div>
                    <span className="text-slate-700">ВТБ Партнёр</span>
                  </div>
                )
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
                  ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                  : 'bg-white text-primary border-green-200 hover:bg-green-50 hover:border-green-300 hover:shadow-glow-sm',
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-primary text-[10px] font-bold">U</span>
                </div>
                <span>UNITELLER</span>
              </div>
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
                className="space-y-3 overflow-hidden mt-4"
              >
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUnitellerLogin() }}
                    autoFocus
                    className="h-12 rounded-xl text-sm bg-white border-slate-200 focus:border-primary/50 focus:shadow-input-focus placeholder:text-slate-400"
                  />
                </div>
                <motion.button
                  onClick={handleUnitellerLogin}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || !password.trim()}
                  className={cn(
                    'w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200',
                    'bg-primary text-primary-foreground shadow-glow',
                    'hover:bg-primary/90 hover:shadow-glow',
                    'active:scale-[0.98] disabled:opacity-50',
                  )}
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
                    : 'Войти в систему'
                  }
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom text */}
          <div className="hidden lg:block mt-12 pt-6 border-t border-slate-200">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Безопасное подключение · Данные шифруются end-to-end
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
