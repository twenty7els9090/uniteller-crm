'use client'

import { useAppStore, PAGE_LABELS, type PageType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BarChart3, Users, LogOut, Swords, Plug, Building2, TrendingDown, Settings, PhoneIncoming } from 'lucide-react'
import { GlobalSearch } from './global-search'

interface NavTab {
  label: string
  page: PageType
  icon: React.ReactNode
  adminOnly?: boolean
  unitellerOnly?: boolean
}

const tabs: NavTab[] = [
  { label: 'Входящие', page: 'incoming', icon: <PhoneIncoming className="h-4 w-4" /> },
  { label: 'Лиды', page: 'main', icon: <Users className="h-4 w-4" /> },
  { label: 'Боевые', page: 'combat', icon: <Swords className="h-4 w-4" /> },
  { label: 'Доп.', page: 'dop', icon: <Plug className="h-4 w-4" />, unitellerOnly: true },
  { label: 'Юр.лица', page: 'relegal', icon: <Building2 className="h-4 w-4" />, unitellerOnly: true },
  { label: 'Оттоки', page: 'churn', icon: <TrendingDown className="h-4 w-4" />, unitellerOnly: true },
  { label: 'Статистика', page: 'statistics', icon: <BarChart3 className="h-4 w-4" />, unitellerOnly: true },
  { label: 'Настройки', page: 'settings', icon: <Settings className="h-4 w-4" />, adminOnly: true },
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
      <header className="hidden md:block sticky top-0 z-30 glass border-b border-border/60">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm text-foreground">
                {isAdmin ? 'Uniteller CRM' : 'ВТБ Партнёр'}
              </span>
              <span className="text-[10px] text-muted-foreground/70 leading-none">{user.fullName}</span>
            </div>
          </div>

          {/* Center: nav tabs with animated pill indicator */}
          <nav className="relative flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
            {visibleTabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 z-10',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary rounded-md -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right: global search + logout */}
          <div className="flex items-center gap-1.5 shrink-0">
            <GlobalSearch />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-150"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden xl:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Header (compact) ─── */}
      <header className="md:hidden sticky top-0 z-30 glass border-b border-border/60 safe-top">
        <div className="flex items-center justify-between h-12 px-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">
                {isAdmin ? 'Uniteller' : 'ВТБ'}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground font-medium">
                {PAGE_LABELS[currentPage]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <GlobalSearch />
            <button
              onClick={logout}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Navigation (floating pill) ─── */}
      <nav className="md:hidden fixed bottom-4 left-3 right-3 z-40">
        <div className="glass-strong rounded-2xl border border-border/40 shadow-xl shadow-black/[0.06] safe-bottom">
          <div className="flex items-stretch overflow-x-auto no-scrollbar">
            {visibleTabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 min-w-[52px] flex-1 py-2.5 px-1 transition-colors duration-150 relative',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground/70 active:text-foreground'
                  )}
                >
                  <div className="relative flex items-center justify-center">
                    <span className={cn(
                      'transition-all duration-200',
                      isActive && 'scale-110'
                    )}>
                      {tab.icon}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-dot"
                        className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] leading-tight font-medium whitespace-normal break-words text-center transition-colors duration-150',
                    isActive && 'font-semibold text-primary'
                  )}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
