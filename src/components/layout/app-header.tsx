'use client'

import { useAppStore, type PageType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BarChart3, Users, LogOut, Swords, Plug, Building2, TrendingDown, Settings } from 'lucide-react'

interface NavTab {
  label: string
  page: PageType
  icon: React.ReactNode
  adminOnly?: boolean
  unitellerOnly?: boolean
}

const tabs: NavTab[] = [
  { label: 'Лиды', page: 'main', icon: <Users className="h-5 w-5" /> },
  { label: 'Боевые', page: 'combat', icon: <Swords className="h-5 w-5" /> },
  { label: 'Доп.', page: 'dop', icon: <Plug className="h-5 w-5" />, unitellerOnly: true },
  { label: 'Юр.лица', page: 'relegal', icon: <Building2 className="h-5 w-5" />, unitellerOnly: true },
  { label: 'Оттоки', page: 'churn', icon: <TrendingDown className="h-5 w-5" />, unitellerOnly: true },
  { label: 'Статистика', page: 'statistics', icon: <BarChart3 className="h-5 w-5" />, unitellerOnly: true },
  { label: 'Настройки', page: 'settings', icon: <Settings className="h-5 w-5" />, adminOnly: true },
]

export function AppHeader() {
  const { user, currentPage, setCurrentPage, logout } = useAppStore()

  if (!user) return null

  const isAdmin = user.role === 'uniteller'
  const visibleTabs = tabs.filter((t) => {
    if (t.adminOnly && !isAdmin) return false
    if (t.unitellerOnly && !isAdmin) return false
    return true
  })

  return (
    <>
      {/* ─── Desktop Header ─── */}
      <header className="hidden md:block sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        {/* Accent bar at top */}
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
        <div className="flex items-center justify-between h-13 px-4 md:px-6">
          {/* Left: logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm text-foreground">
                {isAdmin ? 'Uniteller CRM' : 'ВТБ Партнёр'}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">{user.fullName}</span>
            </div>
          </div>

          {/* Center: nav tabs with animated indicator */}
          <nav className="relative flex items-center gap-1">
            {visibleTabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors z-10',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary rounded-md -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right: logout */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Header (compact) ─── */}
      <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b safe-top">
        <div className="flex items-center justify-between h-12 px-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <span className="font-semibold text-sm">
              {isAdmin ? 'Uniteller' : 'ВТБ'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {visibleTabs.find((t) => t.page === currentPage)?.label}
            </span>
            <button
              onClick={logout}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t safe-bottom">
        <div className="flex items-stretch overflow-x-auto no-scrollbar">
          {visibleTabs.map((tab) => {
            const isActive = currentPage === tab.page
            return (
              <button
                key={tab.page}
                onClick={() => setCurrentPage(tab.page)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[56px] flex-1 py-2 px-1 transition-colors relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-foreground'
                )}
              >
                <div className="relative flex items-center justify-center">
                  <span className={cn(
                    'transition-transform',
                    isActive && 'scale-110'
                  )}>
                    {tab.icon}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] leading-tight font-medium whitespace-normal break-words text-center',
                  isActive && 'font-semibold'
                )}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
