'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore, type PageType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, Loader2, Building2, FileText, ArrowRightLeft, TrendingDown, Plug } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lead, Relegal, Churn, Additional } from '@/lib/types'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  page: PageType
  pageLabel: string
  icon: React.ReactNode
}

export function GlobalSearch() {
  const { setCurrentPage, setGlobalSearch, globalSearch } = useAppStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const effectiveQuery = globalSearch || query

  const cacheRef = useRef<{ leads: Lead[]; relegal: Relegal[]; churn: Churn[]; additional: Additional[] }>({ leads: [], relegal: [], churn: [], additional: [] })

  useEffect(() => {
    if (!open || loaded) return
    Promise.all([
      fetch('/api/leads').then((r) => r.ok ? r.json().then((d: Record<string, unknown>) => Array.isArray(d.leads) ? d.leads : Array.isArray(d) ? d : []) : []).catch(() => []),
      fetch('/api/relegal').then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/churn').then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/additional').then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([leads, relegal, churn, additional]) => {
      cacheRef.current = { leads, relegal, churn, additional }
      setLoaded(true)
    }).finally(() => setLoading(false))
  }, [open, loaded])

  const filterAll = useCallback((search: string) => {
    if (!search.trim()) { setResults([]); return }
    const q = search.toLowerCase()
    const found: SearchResult[] = []
    const { leads, relegal, churn, additional } = cacheRef.current

    for (const l of leads) {
      if (found.length >= 10) break
      const isCombat = l.zayavka === 'Выполнена' || l.status === 'пошли боевых платежи'
      if (isCombat) continue
      const haystack = `${l.organization} ${l.contactInfo} ${l.manager} ${l.comment || ''} ${l.partner}`.toLowerCase()
      if (haystack.includes(q)) {
        found.push({ id: l.id, title: l.organization, subtitle: [l.manager, l.contactInfo].filter(Boolean).join(' · '), page: 'main' as PageType, pageLabel: 'Лиды', icon: <Building2 className="h-3.5 w-3.5" /> })
      }
    }

    for (const l of leads) {
      if (found.length >= 10) break
      const isCombat = l.zayavka === 'Выполнена' || l.status === 'пошли боевых платежи'
      if (!isCombat) continue
      const haystack = `${l.organization} ${l.contactInfo} ${l.manager} ${l.comment || ''} ${l.partner}`.toLowerCase()
      if (haystack.includes(q)) {
        found.push({ id: l.id, title: l.organization, subtitle: [l.manager, l.contactInfo].filter(Boolean).join(' · '), page: 'combat' as PageType, pageLabel: 'Боевые', icon: <FileText className="h-3.5 w-3.5" /> })
      }
    }

    for (const r of relegal) {
      if (found.length >= 10) break
      const haystack = `${r.fromOrg} ${r.toOrg} ${r.action} ${r.manager}`.toLowerCase()
      if (haystack.includes(q)) {
        found.push({ id: r.id, title: r.fromOrg || r.toOrg, subtitle: [r.toOrg && r.fromOrg ? `→ ${r.toOrg}` : '', r.action, r.manager].filter(Boolean).join(' · '), page: 'relegal' as PageType, pageLabel: 'Юр.лица', icon: <ArrowRightLeft className="h-3.5 w-3.5" /> })
      }
    }

    for (const c of churn) {
      if (found.length >= 10) break
      const haystack = `${c.organization} ${c.manager} ${c.comment || ''} ${c.status}`.toLowerCase()
      if (haystack.includes(q)) {
        found.push({ id: c.id, title: c.organization, subtitle: [c.manager, c.status].filter(Boolean).join(' · '), page: 'churn' as PageType, pageLabel: 'Оттоки', icon: <TrendingDown className="h-3.5 w-3.5" /> })
      }
    }

    for (const a of additional) {
      if (found.length >= 10) break
      const haystack = `${a.organization} ${a.partner} ${a.finInstrument}`.toLowerCase()
      if (haystack.includes(q)) {
        found.push({ id: a.id, title: a.organization, subtitle: [a.partner, a.finInstrument].filter(Boolean).join(' · '), page: 'dop' as PageType, pageLabel: 'Доп.', icon: <Plug className="h-3.5 w-3.5" /> })
      }
    }

    setResults(found.slice(0, 10))
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => filterAll(effectiveQuery), 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [effectiveQuery, filterAll])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleResultClick(result: SearchResult) {
    setOpen(false)
    setCurrentPage(result.page)
    setGlobalSearch(result.title)
    setQuery(result.title)
  }

  function handleClear() {
    setQuery('')
    setGlobalSearch('')
    setResults([])
    setOpen(false)
  }

  function highlight(text: string, search: string) {
    if (!search.trim()) return text
    const idx = text.toLowerCase().indexOf(search.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-foreground">{text.slice(idx, idx + search.length)}</span>
        {text.slice(idx + search.length)}
      </>
    )
  }

  const hasDropdown = open && effectiveQuery.trim().length > 0

  return (
    <div ref={containerRef} className="relative">
      {/* ─── Desktop Search ─── */}
      <div className="hidden md:flex items-center">
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="search-input"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative overflow-hidden"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); if (results.length > 0) handleResultClick(results[0]) }
                  if (e.key === 'Escape') handleClear()
                }}
                placeholder="Поиск..."
                className="h-9 w-full text-sm pl-10 pr-9 bg-white/[0.08] border-white/[0.1] text-white placeholder:text-white/30 focus-visible:bg-white/[0.12] focus-visible:border-white/[0.2]"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.button
              key="search-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(true)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm transition-all hover:scale-[1.02]',
                globalSearch
                  ? 'text-teal-400'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
              )}
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">Поиск</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Mobile Search Button ─── */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
          globalSearch ? 'text-teal-400' : 'text-white/40'
        )}
      >
        <Search className="h-4 w-4" />
      </button>

      {/* ─── Mobile Search Bar ─── */}
      <AnimatePresence>
        <motion.div
          key="mobile-bar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="md:hidden overflow-hidden"
        >
          {open && (
            <div className="px-3 pb-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); if (results.length > 0) handleResultClick(results[0]) }
                    if (e.key === 'Escape') handleClear()
                  }}
                  placeholder="Поиск..."
                  className="pl-9 h-10 text-sm bg-white/[0.08] border-white/[0.1] text-white placeholder:text-white/30"
                />
                {query && (
                  <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ─── Dropdown Results ─── */}
      <AnimatePresence>
        {hasDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-full right-0 mt-2 w-[360px] sm:w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-black/[0.12] z-50 overflow-hidden origin-top-right"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Загрузка...</span>
              </div>
            ) : results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center text-sm text-slate-400"
              >
                <Search className="h-6 w-6 mx-auto mb-2 opacity-20" />
                Ничего не найдено
              </motion.div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {results.map((result, i) => (
                  <motion.button
                    key={`${result.page}-${result.id}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors',
                      i === 0 && 'bg-slate-50/50',
                      i > 0 && 'border-t border-slate-100',
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 shrink-0">{result.icon}</span>
                        <span className="text-sm font-medium truncate text-slate-900">
                          {highlight(result.title, effectiveQuery)}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-slate-400 truncate pl-[22px]">
                          {highlight(result.subtitle, effectiveQuery)}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full shrink-0 mt-0.5 font-medium">
                      {result.pageLabel}
                    </Badge>
                  </motion.button>
                ))}
                <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 font-medium">
                  Найдено: {results.length}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
