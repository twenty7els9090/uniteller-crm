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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-top">
      <motion.div
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xs"
      >
        <motion.div
          variants={fadeIn}
          className="text-center mb-8"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">CRM Лиды</h1>
          <p className="text-muted-foreground mt-1 text-sm">Управление лидами и партнёрами</p>
        </motion.div>

        <motion.p
          variants={slideUp}
          className="text-base font-medium text-foreground mb-3"
        >
          Войти как:
        </motion.p>

        <motion.div variants={slideUp} className="space-y-3">
          <motion.button
            onClick={() => setSelectedRole('uniteller')}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'w-full rounded-xl py-3 text-center text-sm font-semibold transition-all',
              selectedRole === 'uniteller'
                ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-100'
            )}
          >
            UNITELLER
          </motion.button>

          <motion.button
            onClick={() => setSelectedRole('vtb')}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'w-full rounded-xl py-3 text-center text-sm font-semibold transition-all',
              selectedRole === 'vtb'
                ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-100'
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
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="space-y-2.5 overflow-hidden"
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
                className="h-12 rounded-lg bg-white border-gray-200 text-base"
              />
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className={cn(
                    'w-full h-12 rounded-lg text-base font-semibold transition-all',
                    selectedRole === 'uniteller'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
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
  )
}
