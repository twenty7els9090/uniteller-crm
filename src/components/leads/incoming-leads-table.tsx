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
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import { IncomingLeadFormDialog } from './incoming-lead-form-dialog'
import { REJECTION_REASONS, WORK_STATUSES } from '@/lib/constants'
import {
  Plus, Phone, Mail, Building2, Calendar, Clock, XCircle,
  ArrowRight, Trash2, PhoneOff, AlertTriangle, Check,
  Search, MessageSquare,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────

function isOverdue(callDate: string | null): boolean {
  if (!callDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(callDate) < today
}

function formatCallDate(callDate: string): string {
  return new Date(callDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

function getOverdueDays(callDate: string | null): number {
  if (!callDate) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - new Date(callDate).getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

// ─── Inline Status Controls ────────────────────────────────────────

type InlineMode = 'idle' | 'callback' | 'reject' | 'work'

function InlineStatusControls({
  lead,
  onRemove,
}: {
  lead: Lead
  onRemove: (id: string) => void
}) {
  const [mode, setMode] = useState<InlineMode>('idle')
  const [callDate, setCallDate] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [workStatus, setWorkStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const isNotStarted = !lead.status || lead.status === 'Не начато'
  const overdue = lead.status === 'Перезвонить' && isOverdue(lead.callDate)

  async function saveStatus(newZayavka: string, newStatus: string, newCallDate: string | null) {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          zayavka: newZayavka,
          status: newStatus,
          callDate: newCallDate ? new Date(newCallDate).toISOString() : null,
          ...(newZayavka === 'В работе' ? { statusChangedAt: new Date().toISOString() } : {}),
        }),
      })
      if (res.ok) {
        if (newZayavka === 'Отклонена') {
          toast.success(`Отказ: ${newStatus}`)
          onRemove(lead.id)
        } else if (newZayavka === 'В работе') {
          toast.success(`В работу: ${newStatus}`)
          onRemove(lead.id)
        } else if (newStatus === 'Перезвонить') {
          toast.success(`Перезвонить ${formatCallDate(newCallDate || '')}`)
          setMode('idle')
        } else {
          toast.success('Статус обновлён')
          setMode('idle')
        }
      } else {
        toast.error('Ошибка обновления')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
      {/* Current status badge */}
      {isNotStarted && mode === 'idle' && (
        <Badge className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0 border-gray-200 border">
          <Clock className="h-3 w-3 mr-1" /> Не начато
        </Badge>
      )}

      {lead.status === 'Перезвонить' && mode === 'idle' && (
        <div className="flex items-center gap-1.5">
          <Badge className={cn(
            'text-[11px] px-2 py-0 border',
            overdue ? 'bg-red-500 text-white border-red-500' : 'bg-amber-100 text-amber-700 border-amber-200',
          )}>
            {overdue ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Просрочено {getOverdueDays(lead.callDate)} дн.
              </span>
            ) : (
              `📞 ${lead.callDate ? formatCallDate(lead.callDate) : ''}`
            )}
          </Badge>
        </div>
      )}

      {/* ── Callback date inline ── */}
      {mode === 'callback' && (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={callDate}
            onChange={(e) => setCallDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="h-8 w-[130px] text-xs"
          />
          <Button
            size="sm"
            className="h-8 w-8 p-0 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
            disabled={!callDate || saving}
            onClick={() => saveStatus('Входящий', 'Перезвонить', callDate)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground rounded-lg"
            onClick={() => setMode('idle')}
          >
            ✕
          </Button>
        </div>
      )}

      {/* ── Reject reason inline ── */}
      {mode === 'reject' && (
        <div className="flex items-center gap-1.5">
          <Select value={rejectionReason} onValueChange={setRejectionReason}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="Причина..." />
            </SelectTrigger>
            <SelectContent>
              {REJECTION_REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            disabled={!rejectionReason || saving}
            onClick={() => saveStatus('Отклонена', rejectionReason, null)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground rounded-lg"
            onClick={() => setMode('idle')}
          >
            ✕
          </Button>
        </div>
      )}

      {/* ── Work status inline ── */}
      {mode === 'work' && (
        <div className="flex items-center gap-1.5">
          <Select value={workStatus} onValueChange={setWorkStatus}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder="Статус..." />
            </SelectTrigger>
            <SelectContent>
              {WORK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            disabled={!workStatus || saving}
            onClick={() => saveStatus('В работе', workStatus, null)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground rounded-lg"
            onClick={() => setMode('idle')}
          >
            ✕
          </Button>
        </div>
      )}

      {/* ── Action buttons (when idle) ── */}
      {mode === 'idle' && (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-xs rounded-lg gap-1"
            onClick={() => { setMode('callback'); setCallDate(new Date().toISOString().slice(0, 10)) }}
          >
            <Phone className="h-3 w-3" />
            <span className="hidden xl:inline">Перезвонить</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs rounded-lg gap-1"
            onClick={() => setMode('reject')}
          >
            <XCircle className="h-3 w-3" />
            <span className="hidden xl:inline">Отказ</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs rounded-lg gap-1"
            onClick={() => setMode('work')}
          >
            <ArrowRight className="h-3 w-3" />
            <span className="hidden xl:inline">В работу</span>
          </Button>
        </>
      )}
    </div>
  )
}

// ─── Desktop Row ──────────────────────────────────────────────────

function IncomingDesktopRow({
  lead,
  onDelete,
  onRemove,
}: {
  lead: Lead
  onDelete: (id: string) => void
  onRemove: (id: string) => void
}) {
  const d = new Date(lead.createdAt)
  const day = d.getDate()
  const month = d.toLocaleDateString('ru-RU', { month: 'short' })
  const isNotStarted = !lead.status || lead.status === 'Не начато'
  const overdue = lead.status === 'Перезвонить' && isOverdue(lead.callDate)

  return (
    <div className={cn(
      'group flex items-center gap-3 px-4 py-2.5 transition-all duration-200 border-l-[3px]',
      isNotStarted && 'border-l-gray-300 hover:bg-gray-50/30',
      lead.status === 'Перезвонить' && !overdue && 'border-l-amber-400 hover:bg-amber-50/20',
      overdue && 'bg-amber-50/40 border-l-red-400',
    )}>
      {/* Date */}
      <div className="flex flex-col items-center justify-center w-11 h-10 rounded-md bg-muted/40 shrink-0">
        <span className="text-sm font-bold tabular-nums leading-none">{day}</span>
        <span className="text-[9px] text-muted-foreground capitalize">{month}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm leading-tight truncate">{lead.organization}</span>
          {lead.partner && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0">{lead.partner}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
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
        {lead.comment && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-0.5 truncate">
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.comment}</span>
          </div>
        )}
      </div>

      {/* Inline status controls */}
      <InlineStatusControls lead={lead} onRemove={onRemove} />

      {/* Delete */}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 opacity-40 hover:opacity-100 transition-opacity"
        onClick={() => onDelete(lead.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ─── Mobile Card ──────────────────────────────────────────────────

function IncomingMobileCard({
  lead,
  onDelete,
  onRemove,
}: {
  lead: Lead
  onDelete: (id: string) => void
  onRemove: (id: string) => void
}) {
  const d = new Date(lead.createdAt)
  const day = d.getDate()
  const month = d.toLocaleDateString('ru-RU', { month: 'short' })
  const isNotStarted = !lead.status || lead.status === 'Не начато'
  const overdue = lead.status === 'Перезвонить' && isOverdue(lead.callDate)

  return (
    <motion.div
      variants={slideUp}
      className={cn(
        'rounded-xl border bg-card p-4 space-y-3 transition-all duration-200 card-soft',
        isNotStarted && 'border-dashed border-gray-200 bg-gray-50/30',
        overdue && 'border-amber-300 bg-amber-50/40',
        lead.status === 'Перезвонить' && !overdue && 'border-amber-200',
      )}
    >
      {/* Header: date + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{day} {month}</span>
        </div>
        {isNotStarted && (
          <Badge className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0 border-gray-200 border">
            <Clock className="h-3 w-3 mr-1" /> Не начато
          </Badge>
        )}
        {lead.status === 'Перезвонить' && (
          <Badge className={cn(
            'text-[11px] px-2 py-0 border',
            overdue ? 'bg-red-500 text-white border-red-500' : 'bg-amber-100 text-amber-700 border-amber-200',
          )}>
            {overdue ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Просрочено {getOverdueDays(lead.callDate)} дн.
              </span>
            ) : (
              `📞 ${lead.callDate ? formatCallDate(lead.callDate) : ''}`
            )}
          </Badge>
        )}
      </div>

      {/* Org */}
      <div>
        <p className="font-semibold text-[15px] leading-tight">{lead.organization}</p>
        {lead.partner && (
          <Badge variant="outline" className="text-xs px-2 py-0 mt-1">{lead.partner}</Badge>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-1 text-sm text-muted-foreground">
        {lead.contactInfo && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" />
            <a href={`tel:${lead.contactInfo}`} className="hover:text-foreground">{lead.contactInfo}</a>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" />
            <a href={`mailto:${lead.email}`} className="hover:text-foreground truncate">{lead.email}</a>
          </div>
        )}
      </div>

      {/* Comment */}
      {lead.comment && (
        <div className="flex items-start gap-1.5 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{lead.comment}</span>
        </div>
      )}

      {/* Inline controls */}
      <div className="pt-1">
        <InlineStatusControls lead={lead} onRemove={onRemove} />
      </div>

      {/* Delete */}
      <div className="flex justify-end pt-1 border-t">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs rounded-lg gap-1"
          onClick={() => onDelete(lead.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Удалить
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export function IncomingLeadsTable() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads?zayavka=Входящий')
      if (res.ok) {
        const data = await res.json()
        setLeads(Array.isArray(data.leads) ? data.leads : Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // Sort: not started first, then overdue, then by callDate, then newest
  const sorted = useMemo(() => {
    let result = [...leads]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((l) =>
        l.organization.toLowerCase().includes(q) ||
        l.contactInfo.toLowerCase().includes(q) ||
        l.partner.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.comment && l.comment.toLowerCase().includes(q))
      )
    }
    return result.sort((a, b) => {
      const aNS = (!a.status || a.status === 'Не начато') ? 0 : 1
      const bNS = (!b.status || b.status === 'Не начато') ? 0 : 1
      if (aNS !== bNS) return aNS - bNS

      const aOD = (a.status === 'Перезвонить' && isOverdue(a.callDate)) ? 0 : 1
      const bOD = (b.status === 'Перезвонить' && isOverdue(b.callDate)) ? 0 : 1
      if (aOD !== bOD) return aOD - bOD

      const aD = a.callDate ? new Date(a.callDate).getTime() : Infinity
      const bD = b.callDate ? new Date(b.callDate).getTime() : Infinity
      if (aD !== bD) return aD - bD

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [leads, search])

  const notStartedCount = useMemo(() => leads.filter((l) => !l.status || l.status === 'Не начато').length, [leads])
  const overdueCount = useMemo(() => leads.filter((l) => l.status === 'Перезвонить' && isOverdue(l.callDate)).length, [leads])
  const callbackCount = useMemo(() => leads.filter((l) => l.status === 'Перезвонить' && !isOverdue(l.callDate)).length, [leads])

  // Remove lead from list (used after reject/work transfer)
  function handleRemove(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/leads/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Лид удалён')
        handleRemove(deleteId)
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
          <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />
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
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-sky-600" />
            </div>
            <h2 className="text-lg font-semibold">Входящие</h2>
          </div>
          <Badge variant="secondary" className="text-xs tabular-nums">{leads.length}</Badge>
          {notStartedCount > 0 && (
            <Badge className="bg-gray-100 text-gray-600 text-xs border-gray-200 border tabular-nums">
              {notStartedCount} новых
            </Badge>
          )}
          {callbackCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 text-xs border-amber-200 border tabular-nums">
              📞 {callbackCount} перезвонить
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs border-0 tabular-nums">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {overdueCount} просрочено
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {!isVTB && (
            <Button onClick={() => setFormOpen(true)} size="default" className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Новый входящий
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden card-soft">
        <div className="divide-y">
          {sorted.length ? sorted.map((lead) => (
            <IncomingDesktopRow
              key={lead.id}
              lead={lead}
              onDelete={setDeleteId}
              onRemove={handleRemove}
            />
          )) : (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <PhoneOff className="h-9 w-9 opacity-25" />
              <p className="text-sm">Входящих лидов нет</p>
              {!isVTB && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setFormOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Создать первый
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <motion.div className="md:hidden space-y-3 pb-24" variants={staggerContainer} initial="hidden" animate="visible">
        {sorted.length ? sorted.map((lead) => (
          <IncomingMobileCard
            key={lead.id}
            lead={lead}
            onDelete={setDeleteId}
            onRemove={handleRemove}
          />
        )) : (
          <div className="flex flex-col items-center gap-2 py-12">
            <PhoneOff className="h-9 w-9 opacity-25" />
            <p className="text-muted-foreground text-sm">Входящих лидов нет</p>
          </div>
        )}
      </motion.div>

      {/* FAB */}
      {!isVTB && (
        <button
          onClick={() => setFormOpen(true)}
          className="sm:hidden fixed right-4 bottom-28 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Новый входящий"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* New Lead Dialog */}
      <IncomingLeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={fetchLeads}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить лид?</AlertDialogTitle>
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
