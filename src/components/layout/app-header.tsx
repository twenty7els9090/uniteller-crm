'use client'

import { useAppStore, PAGE_LABELS, type PageType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, LogOut, Swords, Plug,
  Building2, TrendingDown, Settings, PhoneIncoming,
} from 'lucide-react'
import { GlobalSearch } from './global-search'

interface NavTab {
  label: string
  page: PageType
  icon: React.ReactNode
  adminOnly?: boolean
  unitellerOnly?: boolean
}

const tabs: NavTab[] = [
  { label: 'Входящие',  page: 'incoming',   icon: <PhoneIncoming className="h-3.5 w-3.5" /> },
  { label: 'Лиды',      page: 'main',        icon: <Users          className="h-3.5 w-3.5" /> },
  { label: 'Боевые',    page: 'combat',      icon: <Swords         className="h-3.5 w-3.5" /> },
  { label: 'Доп.',      page: 'dop',         icon: <Plug           className="h-3.5 w-3.5" />, unitellerOnly: true },
  { label: 'Юр.лица',   page: 'relegal',     icon: <Building2      className="h-3.5 w-3.5" />, unitellerOnly: true },
  { label: 'Оттоки',    page: 'churn',       icon: <TrendingDown   className="h-3.5 w-3.5" />, unitellerOnly: true },
  { label: 'Статистика',page: 'statistics',  icon: <BarChart3      className="h-3.5 w-3.5" />, unitellerOnly: true },
  { label: 'Настройки', page: 'settings',    icon: <Settings       className="h-3.5 w-3.5" />, adminOnly: true },
]

export function AppHeader() {
  const { user, currentPage, setCurrentPage, logout } = useAppStore()

  if (!user) return null

  const isAdmin = user.role === 'uniteller'
  const visibleTabs = tabs.filter((t) => {
    if (t.adminOnly   && !isAdmin) return false
    if (t.unitellerOnly && !isAdmin) return false
    return true
  })

  return (
    <>
      {/* ─── Desktop Header ─── */}
      <header className="hidden md:block sticky top-0 z-30 glass border-b border-border/50">
        {/* Accent gradient line */}
        <div className="h-[2px] accent-line" />

        <div className="flex items-center justify-between h-[52px] px-4 lg:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-semibold text-[13px] text-foreground tracking-tight">
                {isAdmin ? 'Uniteller CRM' : 'ВТБ Партнёр'}
              </span>
              <span className="text-[10px] text-muted-foreground/60 mt-0.5">{user.fullName}</span>
            </div>
          </div>

          {/* Nav pill */}
          <nav className="relative flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5 border border-border/60">
            {visibleTabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors duration-150 z-10',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary rounded-md -z-10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1 shrink-0">
            <GlobalSearch />
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/6 transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden xl:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Header ─── */}
      <header className="md:hidden sticky top-0 z-30 glass border-b border-border/50 safe-top">
        <div className="h-[2px] accent-line" />
        <div className="flex items-center justify-between h-12 px-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[13px]">{isAdmin ? 'CRM' : 'ВТБ'}</span>
              <span className="text-muted-foreground/40 text-sm">·</span>
              <span className="text-[12px] text-muted-foreground font-medium">{PAGE_LABELS[currentPage]}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <GlobalSearch />
            <button
              onClick={logout}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/6 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile floating bottom nav ─── */}
      <nav className="md:hidden fixed bottom-3 left-2.5 right-2.5 z-40">
        <div className="glass-strong rounded-2xl border border-border/40 shadow-popover safe-bottom overflow-hidden">
          <div className="flex items-stretch overflow-x-auto no-scrollbar">
            {visibleTabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 min-w-[52px] flex-1 py-2.5 px-1 transition-all duration-150 relative',
                    isActive ? 'text-primary' : 'text-muted-foreground/60 active:text-foreground',
                  )}
                >
                  <span className={cn('transition-transform duration-200', isActive && 'scale-110')}>
                    {tab.icon}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-dot"
                      className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={cn(
                    'text-[9.5px] leading-tight font-medium break-words text-center',
                    isActive && 'font-semibold',
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
