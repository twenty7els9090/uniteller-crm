'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore, type PageType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, Loader2, ArrowRightLeft, TrendingDown, Plug } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Relegal, Churn, Additional } from '@/lib/types'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  page: PageType
  pageLabel: string
  icon: React.ReactNode
}

interface SearchCache {
  relegal: Relegal[]
  churn: Churn[]
  additional: Additional[]
}

const EMPTY_CACHE: SearchCache = { relegal: [], churn: [], additional: [] }

export function GlobalSearch() {
  const { user, currentPage, navigateWithSearch, setGlobalSearch, searchVersion } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const queryRef = useRef('')

  // Cache
  const cacheRef = useRef<SearchCache>({ ...EMPTY_CACHE })
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const cacheReadyRef = useRef(false)

  const isAdmin = user?.role !== 'vtb'

  // ─── Search logic ──────────────────
  const doSearch = useCallback(
    (search: string) => {
      if (!search.trim() || !cacheReadyRef.current) {
        setResults([])
        return
      }
      const q = search.toLowerCase()
      const found: SearchResult[] = []
      const { relegal, churn, additional } = cacheRef.current

      // Relegal
      if (isAdmin) {
        for (const r of relegal) {
          if (found.length >= 10) break
          const haystack = `${r.fromOrg || ''} ${r.toOrg || ''} ${r.action || ''} ${r.manager || ''}`.toLowerCase()
          if (haystack.includes(q)) {
            found.push({
              id: r.id,
              title: r.fromOrg || r.toOrg || '',
              subtitle: [
                r.fromOrg && r.toOrg ? `→ ${r.toOrg}` : '',
                r.action,
                r.manager,
              ]
                .filter(Boolean)
                .join(' · '),
              page: 'relegal' as PageType,
              pageLabel: 'Юр.лица',
              icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
            })
          }
        }
      }

      // Churn
      if (isAdmin) {
        for (const c of churn) {
          if (found.length >= 10) break
          const haystack = `${c.organization || ''} ${c.manager || ''} ${c.comment || ''} ${c.status || ''}`.toLowerCase()
          if (haystack.includes(q)) {
            found.push({
              id: c.id,
              title: c.organization || '',
              subtitle: [c.manager, c.status].filter(Boolean).join(' · '),
              page: 'churn' as PageType,
              pageLabel: 'Оттоки',
              icon: <TrendingDown className="h-3.5 w-3.5" />,
            })
          }
        }
      }

      // Additional
      if (isAdmin) {
        for (const a of additional) {
          if (found.length >= 10) break
          const haystack = `${a.organization || ''} ${a.partner || ''} ${a.finInstrument || ''}`.toLowerCase()
          if (haystack.includes(q)) {
            found.push({
              id: a.id,
              title: a.organization || '',
              subtitle: [a.partner, a.finInstrument].filter(Boolean).join(' · '),
              page: 'dop' as PageType,
              pageLabel: 'Доп.',
              icon: <Plug className="h-3.5 w-3.5" />,
            })
          }
        }
      }

      setResults(found.slice(0, 10))
    },
    [isAdmin]
  )

  // ─── Fetch all searchable entities ─────────────────────────────
  const refreshCache = useCallback(() => {
    return Promise.all([
      isAdmin
        ? fetch('/api/relegal').then((r) => (r.ok ? r.json() : [])).catch(() => [])
        : Promise.resolve([]),
      isAdmin
        ? fetch('/api/churn').then((r) => (r.ok ? r.json() : [])).catch(() => [])
        : Promise.resolve([]),
      isAdmin
        ? fetch('/api/additional').then((r) => (r.ok ? r.json() : [])).catch(() => [])
        : Promise.resolve([]),
    ]).then(([relegal, churn, additional]) => {
      cacheRef.current = { relegal, churn, additional }
      cacheReadyRef.current = true
      setIsFirstLoad(false)
    })
  }, [isAdmin])

  // Initial data fetch
  useEffect(() => {
    refreshCache().finally(() => setLoading(false))
  }, [refreshCache])

  // Re-fetch when searchVersion bumps
  useEffect(() => {
    if (searchVersion > 0 && !isFirstLoad) {
      refreshCache().then(() => {
        if (queryRef.current.trim()) {
          doSearch(queryRef.current)
        }
      })
    }
  }, [searchVersion, isFirstLoad, refreshCache, doSearch])

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query)
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  // ─── Close on click outside ────────────────────────────────────
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

  // ─── Handlers ──────────────────────────────────────────────────
  function handleFocus() {
    setOpen(true)
    refreshCache()
  }

  function handleSelectResult(result: SearchResult) {
    setOpen(false)
    setQuery(result.title)
    queryRef.current = result.title
    setResults([])
    navigateWithSearch(result.title, result.page)
  }

  function handleClear() {
    setQuery('')
    queryRef.current = ''
    setResults([])
    setGlobalSearch('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (results.length > 0) {
        handleSelectResult(results[0])
      } else if (query.trim()) {
        setGlobalSearch(query)
      }
    }
    if (e.key === 'Escape') {
      setOpen(false)
      handleClear()
      inputRef.current?.blur()
    }
  }

  // ─── Highlight matching text ───────────────────────────────────
  function highlight(text: string, search: string) {
    if (!search.trim() || !text) return text
    const idx = text.toLowerCase().indexOf(search.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-bold text-foreground">
          {text.slice(idx, idx + search.length)}
        </span>
        {text.slice(idx + search.length)}
      </>
    )
  }

  const hasDropdown = open && query.trim().length > 0
  const isCurrentPage = (page: PageType) => currentPage === page

  return (
    <div ref={containerRef} className="relative w-full max-w-[700px] lg:max-w-[900px]">
      {/* ─── Search Input ─── */}
      <div className="relative">
        <Search
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 transition-colors',
            open ? 'text-primary' : 'text-slate-400'
          )}
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); queryRef.current = e.target.value }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Поиск по всем разделам..."
          className={cn(
            'h-11 w-full text-base pl-10 pr-9 rounded-xl border-2 border-primary/60 transition-all duration-200 font-medium',
            open
              ? 'bg-white border-primary ring-2 ring-primary/15 shadow-md shadow-primary/10'
              : 'bg-slate-50 border-primary/60 hover:bg-white hover:border-primary/80'
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ─── Dropdown Results ─── */}
      <AnimatePresence>
        {hasDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] sm:w-[400px] glass-strong border border-border/60 rounded-xl shadow-xl shadow-black/[0.06] z-50 overflow-hidden"
          >
            {loading && isFirstLoad ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Загрузка...</span>
              </div>
            ) : results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                <Search className="h-5 w-5 mx-auto mb-1.5 opacity-30" />
                Ничего не найдено
              </motion.div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {results.map((result, i) => (
                  <motion.button
                    key={`${result.page}-${result.id}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => handleSelectResult(result)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-100 transition-colors',
                      i === 0 && 'bg-slate-100/60',
                      i > 0 && 'border-t border-slate-100',
                      isCurrentPage(result.page) && 'opacity-60'
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 shrink-0">{result.icon}</span>
                        <span className="text-sm font-medium truncate">
                          {highlight(result.title, query)}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate pl-[22px]">
                          {highlight(result.subtitle, query)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] px-1.5 py-0 shrink-0 mt-0.5',
                        isCurrentPage(result.page)
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : ''
                      )}
                    >
                      {result.pageLabel}
                    </Badge>
                  </motion.button>
                ))}
                <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
                  Найдено: {results.length} · Enter для перехода
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
