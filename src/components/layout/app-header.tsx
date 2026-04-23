'use client'

import { useAppStore, PAGE_LABELS, type PageType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BarChart3, Users, LogOut, Swords, Plug, Building2, TrendingDown, Settings, PhoneIncoming } from 'lucide-react'
import { GlobalSearch } from './global-search'
import { SPRING } from '@/lib/motion'

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
      {/* ─── Desktop Header — Light ─── */}
      <header className="hidden md:block sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between h-[54px] px-5 lg:px-6">
          {/* Left: logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/25">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[13px] text-slate-900 tracking-tight">
                {isAdmin ? 'Uniteller CRM' : 'ВТБ Партнёр'}
              </span>
              <span className="text-[10px] text-slate-400 leading-none">{user.fullName}</span>
            </div>
          </div>

          {/* Center: nav tabs with animated pill */}
          <nav className="relative flex items-center gap-0.5 bg-slate-100 rounded-xl p-[3px]">
            {visibleTabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg text-[12.5px] font-medium transition-colors duration-150 z-10',
                    isActive
                      ? 'text-teal-700'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                      transition={SPRING}
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden xl:inline text-[12.5px]">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Header — Light ─── */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200/80 safe-top shadow-sm">
        <div className="flex items-center justify-between h-[48px] px-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/25">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[13px] text-slate-900">
                {isAdmin ? 'Uniteller' : 'ВТБ'}
              </span>
              <span className="text-slate-200 text-xs">·</span>
              <span className="text-[11px] text-slate-400 font-medium">
                {PAGE_LABELS[currentPage]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <GlobalSearch />
            <button
              onClick={logout}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-[14px] w-[14px]" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="md:hidden fixed bottom-4 left-3 right-3 z-40">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/10 safe-bottom">
          <div className="flex items-stretch overflow-x-auto no-scrollbar">
            {visibleTabs.map((tab) => {
              const isActive = currentPage === tab.page
              return (
                <button
                  key={tab.page}
                  onClick={() => setCurrentPage(tab.page)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-w-[52px] flex-1 py-2.5 px-1 transition-colors duration-150 relative',
                    isActive
                      ? 'text-teal-600'
                      : 'text-slate-400 active:text-slate-600'
                  )}
                >
                  <span className={cn(
                    'transition-all duration-200',
                    isActive && 'scale-110'
                  )}>
                    {tab.icon}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-0 w-6 h-0.5 rounded-full bg-teal-500"
                      transition={SPRING}
                    />
                  )}
                  <span className={cn(
                    'text-[10px] leading-tight font-medium whitespace-normal break-words text-center transition-colors duration-150',
                    isActive && 'font-semibold text-teal-600'
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
