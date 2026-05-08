'use client'

import { useState } from 'react'
import { useAppStore, type PageType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plug,
  Building2, TrendingDown, BarChart3, Settings, LogOut,
  Search, Menu, X,
} from 'lucide-react'
import { GlobalSearch } from './global-search'

interface NavTab {
  label: string
  page: PageType
  icon: React.ReactNode
}

const tabs: NavTab[] = [
  { label: 'Доп.',      page: 'dop',        icon: <Plug           className="h-4 w-4" /> },
  { label: 'Юр.лица',   page: 'relegal',    icon: <Building2      className="h-4 w-4" /> },
  { label: 'Оттоки',    page: 'churn',      icon: <TrendingDown   className="h-4 w-4" /> },
  { label: 'Статистика',page: 'statistics', icon: <BarChart3      className="h-4 w-4" /> },
  { label: 'Настройки', page: 'settings',   icon: <Settings       className="h-4 w-4" /> },
]

export function AppHeader() {
  const { user, currentPage, setCurrentPage, logout } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!user) return null

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          DESKTOP — Top Header Bar
         ═══════════════════════════════════════════════════════════ */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-40 flex-col bg-white border-b border-slate-200">
        {/* Accent line */}
        <div className="h-[2px] accent-line shrink-0" />

        {/* Main header row */}
        <div className="flex items-center justify-between h-14 px-5">
          {/* Left: Navigation */}
          <nav className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-slate-50',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="topnav-active"
                      className="absolute inset-0 bg-primary rounded-lg"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Right: Search + Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <GlobalSearch />
            <button
              onClick={logout}
              title="Выйти"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE — Top bar (compact)
         ═══════════════════════════════════════════════════════════ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 safe-top">
        <div className="h-[2px] accent-line" />
        <div className="flex items-center justify-between h-12 px-3">
          <div className="flex-1" />
          <GlobalSearch />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ═══ Mobile slide-in menu ═══ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-white border-r border-slate-200 flex flex-col"
            >
              <div className="h-[2px] accent-line" />
              <div className="flex items-center justify-between h-14 px-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mx-4 h-px accent-line-v" />

              <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                {tabs.map((tab) => {
                  const isActive = currentPage === tab.page
                  return (
                    <button
                      key={tab.page}
                      onClick={() => { setCurrentPage(tab.page); setMobileMenuOpen(false) }}
                      className={cn(
                        'relative flex items-center gap-3 w-full rounded-lg text-[13px] font-medium transition-all duration-150 px-3 py-2.5',
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-slate-50',
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-sidebar-active"
                          className="absolute inset-0 bg-primary rounded-lg"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-3">
                        {tab.icon}
                        <span>{tab.label}</span>
                      </span>
                    </button>
                  )
                })}
              </nav>

              <div className="shrink-0 border-t border-slate-200 px-2 py-2 space-y-1">
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false) }}
                  className="flex items-center gap-2.5 w-full rounded-lg text-[13px] font-medium px-3 py-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выйти</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE — Floating bottom nav
         ═══════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-3 left-2.5 right-2.5 z-40">
        <div className="glass-strong rounded-2xl border border-slate-200 shadow-popover safe-bottom overflow-hidden">
          <div className="flex items-stretch overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 min-w-[52px] flex-1 py-2.5 px-1 transition-all duration-150 relative',
                    isActive ? 'text-primary' : 'text-muted-foreground/50 active:text-foreground',
                  )}
                >
                  <motion.span
                    className="transition-transform duration-200"
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    {tab.icon}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-bottom-dot"
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
