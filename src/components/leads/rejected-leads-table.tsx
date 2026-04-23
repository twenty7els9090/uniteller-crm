'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import { StatusBadge } from '@/lib/status'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import { formatDate } from '@/lib/format'
import { Trash2, XCircle, Search, Phone, Mail } from 'lucide-react'

export function RejectedLeadsTable() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [reasonFilter, setReasonFilter] = useState('__all__')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads?zayavka=Отклонена')
      if (res.ok) {
        const data = await res.json()
        setLeads(data)
      }
    } catch {
      toast.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // Get unique reasons from data
  const reasons = useMemo(() => {
    const set = new Set(leads.map((l) => l.status).filter((s): s is string => !!s))
    return Array.from(set).sort()
  }, [leads])

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...leads]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((l) =>
        l.organization.toLowerCase().includes(q) ||
        l.contactInfo.toLowerCase().includes(q) ||
        l.manager.toLowerCase().includes(q)
      )
    }
    if (reasonFilter !== '__all__') {
      result = result.filter((l) => l.status === reasonFilter)
    }
    // Sort newest first by statusChangedAt or createdAt
    result.sort((a, b) => {
      const dateA = new Date(a.statusChangedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.statusChangedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    return result
  }, [leads, search, reasonFilter])

  // Count by reason
  const countByReason = useMemo(() => {
    const map: Record<string, number> = {}
    leads.forEach((l) => {
      const reason = l.status || '—'
      map[reason] = (map[reason] || 0) + 1
    })
    return map
  }, [leads])

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/leads/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Запись удалена')
        setLeads((prev) => prev.filter((l) => l.id !== deleteId))
      } else {
        toast.error('Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Отказы</h2>
          </div>
          <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative max-w-[200px] w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="h-9 w-[180px] text-sm">
              <SelectValue placeholder="Все причины" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Все причины ({leads.length})</SelectItem>
              {reasons.map((r) => (
                <SelectItem key={r} value={r}>
                  {r} ({countByReason[r] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden card-soft">
        {filtered.length ? (
          <div className="divide-y">
            {filtered.map((lead) => (
              <div
                key={lead.id}
                className="group flex items-center gap-4 px-4 py-3 transition-all duration-200 border-l-[3px] border-l-red-300 hover:bg-red-50/20"
              >
                {/* Date */}
                <div className="flex flex-col items-center justify-center w-11 h-10 rounded-md bg-red-50 shrink-0">
                  <span className="text-sm font-bold tabular-nums leading-none text-red-600">
                    {lead.statusChangedAt ? new Date(lead.statusChangedAt).getDate() : '—'}
                  </span>
                  <span className="text-[9px] text-muted-foreground capitalize">
                    {lead.statusChangedAt ? new Date(lead.statusChangedAt).toLocaleDateString('ru-RU', { month: 'short' }) : ''}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm leading-tight truncate text-muted-foreground">{lead.organization}</span>
                    {lead.partner && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0">{lead.partner}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {lead.manager && <span>{lead.manager}</span>}
                    {lead.contactInfo && (
                      <a href={`tel:${lead.contactInfo}`} className="flex items-center gap-1 hover:text-foreground truncate">
                        <Phone className="h-3 w-3 shrink-0" />{lead.contactInfo}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground truncate">
                        <Mail className="h-3 w-3 shrink-0" />{lead.email}
                      </a>
                    )}
                  </div>
                </div>

                {/* Reason badge */}
                {lead.status && <StatusBadge status={lead.status} compact />}

                {/* Delete */}
                {!isVTB && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteId(lead.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <XCircle className="h-9 w-9 opacity-25" />
            <p className="text-sm">Отказов нет</p>
          </div>
        )}

        {/* Count footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Показано: <span className="font-medium text-foreground">{filtered.length}</span>
              {filtered.length !== leads.length && <> из <span className="font-medium text-foreground">{leads.length}</span></>}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <motion.div className="md:hidden space-y-3 pb-24" variants={staggerContainer} initial="hidden" animate="visible">
        {filtered.length ? filtered.map((lead) => (
          <motion.div
            key={lead.id}
            variants={slideUp}
            className="rounded-xl border border-red-100 bg-card p-4 space-y-2 card-soft"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{lead.statusChangedAt ? formatDate(lead.statusChangedAt) : ''}</span>
              </div>
              {lead.status && <StatusBadge status={lead.status} compact />}
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight text-muted-foreground">{lead.organization}</p>
              {lead.partner && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">{lead.partner}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {lead.manager && <span>{lead.manager}</span>}
              {lead.contactInfo && <a href={`tel:${lead.contactInfo}`} className="hover:text-foreground">{lead.contactInfo}</a>}
            </div>
            {!isVTB && (
              <div className="flex justify-end pt-1 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs rounded-lg gap-1"
                  onClick={() => setDeleteId(lead.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Удалить
                </Button>
              </div>
            )}
          </motion.div>
        )) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">Отказов нет</p>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
