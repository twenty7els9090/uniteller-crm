'use client'

import { useAppStore, PAGE_LABELS, type PageType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { BarChart3, Users, LogOut, Swords, Plug, Building2, TrendingDown, Settings, Search, ChevronRight, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useRef, useEffect } from 'react'

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
  const { user, currentPage, setCurrentPage, logout, globalSearch, setGlobalSearch } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) {
      setSearchValue(globalSearch)
    }
  }, [globalSearch, searchOpen])

  function handleSearchSubmit() {
    setGlobalSearch(searchValue)
    setSearchOpen(false)
  }

  function handleSearchClear() {
    setSearchValue('')
    setGlobalSearch('')
    setSearchOpen(false)
  }

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

          {/* Right: global search + logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Global search */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={searchInputRef}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchSubmit()
                      if (e.key === 'Escape') handleSearchClear()
                    }}
                    onBlur={() => handleSearchSubmit()}
                    placeholder="Поиск по лидам..."
                    className="h-8 w-[200px] text-sm"
                  />
                  {searchValue && (
                    <button onClick={handleSearchClear} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                    globalSearch
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Search className="h-4 w-4" />
                  {globalSearch && (
                    <span className="max-w-[100px] truncate text-xs">{globalSearch}</span>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>

        {/* Breadcrumb bar */}
        <div className="flex items-center gap-1 px-6 py-1.5 text-xs text-muted-foreground border-t bg-muted/30">
          <span>CRM</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">{PAGE_LABELS[currentPage]}</span>
          {globalSearch && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="truncate max-w-[200px]">Поиск: {globalSearch}</span>
            </>
          )}
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
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">
                {isAdmin ? 'Uniteller' : 'ВТБ'}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground font-medium">
                {PAGE_LABELS[currentPage]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
                globalSearch
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="px-3 pb-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit()
                  if (e.key === 'Escape') handleSearchClear()
                }}
                placeholder="Поиск по лидам..."
                className="pl-9 h-10 text-sm"
                autoFocus
              />
              {searchValue && (
                <button onClick={handleSearchClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
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
