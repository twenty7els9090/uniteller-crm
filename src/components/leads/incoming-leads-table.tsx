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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import { IncomingLeadFormDialog } from './incoming-lead-form-dialog'
import { REJECTION_REASONS, WORK_STATUSES, MANAGERS, ACTIVITY_TYPES } from '@/lib/constants'
import { EditableTextCell } from '@/components/ui/editable-cells'
import {
  Plus, Phone, Mail, Building2, Calendar, Clock,
  Trash2, PhoneOff, AlertTriangle, Check,
  MessageSquare,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────

function isOverdue(callDate: string | null): boolean {
  if (!callDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(callDate) < today
}

function formatCallDate(callDate: string): string {
  return new Date(callDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })
}

function getOverdueDays(callDate: string | null): number {
  if (!callDate) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - new Date(callDate).getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

// ─── Editable Field ────────────────────────────────────────────────

function EditableField({
  value,
  onSave,
  className,
  type = 'text',
  icon: Icon,
}: {
  value: string
  onSave: (val: string) => void
  className?: string
  type?: 'text' | 'tel' | 'email'
  icon?: React.FC<{ className?: string }>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => { setDraft(value) }, [value])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    } else {
      setDraft(value)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type={type}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        className={cn(
          'h-6 text-xs bg-white border border-green-400 text-foreground rounded px-1.5 outline-none focus:ring-1 focus:ring-green-500/40 w-full',
          className,
        )}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn('cursor-pointer truncate transition-colors hover:text-foreground hover:bg-slate-100 rounded px-1 -mx-1', className)}
      title="Нажмите для редактирования"
    >
      {Icon && <Icon className="h-3 w-3 shrink-0 inline mr-1 align-[-2px]" />}
      {value || '—'}
    </span>
  )
}

// ─── Inline Status Controls ────────────────────────────────────────

type InlineMode = 'idle' | 'callback' | 'reject' | 'work'

function InlineStatusControls({
  lead,
  onRemove,
  onUpdate,
  isVTB = false,
}: {
  lead: Lead
  onRemove: (id: string) => void
  onUpdate: (id: string, field: string, value: string | Record<string, unknown>) => void
  isVTB?: boolean
}) {
  const [mode, setMode] = useState<InlineMode>('idle')
  const [callDate, setCallDate] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [workStatus, setWorkStatus] = useState('')
  const [workMargin, setWorkMargin] = useState('')
  const [workManager, setWorkManager] = useState('')
  const [workActivity, setWorkActivity] = useState('')
  const [saving, setSaving] = useState(false)

  const isNotStarted = !lead.status || lead.status === 'Не начато'
  const overdue = lead.status === 'Перезвонить' && isOverdue(lead.callDate)

  async function saveStatus(newZayavka: string, newStatus: string, newCallDate: string | null) {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        ...lead,
        zayavka: newZayavka,
        status: newStatus,
        callDate: newCallDate ? new Date(newCallDate).toISOString() : null,
      }
      if (newZayavka === 'В работе') {
        body.statusChangedAt = new Date().toISOString()
        if (workMargin) body.margin = workMargin
        if (workManager) body.manager = workManager
        if (workActivity) body.activityType = workActivity
      }
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
          const updated = await res.json()
          if (newZayavka === 'Отклонена') {
            toast.success(`Отказ: ${newStatus}`)
            onRemove(lead.id)
          } else if (newZayavka === 'В работе') {
            toast.success(`В работу: ${newStatus}`)
            onRemove(lead.id)
          } else if (newStatus === 'Перезвонить') {
            // Use server response instead of separate updates to avoid stale data
            onUpdate(lead.id, '__merge', updated)
            toast.success(`Перезвонить ${formatCallDate(newCallDate || '')}`)
            setMode('idle')
          } else {
            onUpdate(lead.id, '__merge', updated)
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

  const btnBase = 'h-8 text-xs rounded-lg font-medium'

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
      {/* Current status badge */}
      {isNotStarted && mode === 'idle' && (
        <Badge className="bg-slate-100 text-slate-500 text-xs px-2.5 py-0.5 border border-slate-200/80 h-8 rounded-lg">
          <Clock className="h-3.5 w-3.5 mr-1" /> Не начато
        </Badge>
      )}

      {lead.status === 'Перезвонить' && mode === 'idle' && (
        <div className="flex items-center gap-1.5">
          <Badge className={cn(
            'text-xs px-2.5 py-0.5 border h-8 rounded-lg',
            overdue ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          )}>
            {overdue ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Просрочено {getOverdueDays(lead.callDate)} дн.
              </span>
            ) : (
              `${lead.callDate ? formatCallDate(lead.callDate) : ''}`
            )}
          </Badge>
        </div>
      )}

      {/* ── Callback date inline ── */}
      {mode === 'callback' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={callDate}
            onChange={(e) => setCallDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="h-8 w-[130px] text-xs bg-slate-50 border-slate-200 text-foreground rounded-lg focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40"
          />
          <Button
            size="sm"
            className={`${btnBase} w-8 p-0 bg-green-600 hover:bg-green-700 text-white`}
            disabled={!callDate || saving}
            onClick={() => saveStatus('Входящий', 'Перезвонить', callDate)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`${btnBase} w-8 p-0 text-slate-500 hover:text-foreground hover:bg-slate-100`}
            onClick={() => setMode('idle')}
          >
            ✕
          </Button>
        </div>
      )}

      {/* ── Reject reason inline ── */}
      {mode === 'reject' && (
        <div className="flex items-center gap-2">
          <Select value={rejectionReason} onValueChange={setRejectionReason}>
            <SelectTrigger className="h-8 w-[180px] text-xs bg-slate-50 border-slate-200 text-foreground rounded-lg">
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
            className={`${btnBase} w-8 p-0 bg-red-600 hover:bg-red-700 text-white`}
            disabled={!rejectionReason || saving}
            onClick={() => saveStatus('Отклонена', rejectionReason, null)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`${btnBase} w-8 p-0 text-slate-500 hover:text-foreground hover:bg-slate-100`}
            onClick={() => setMode('idle')}
          >
            ✕
          </Button>
        </div>
      )}

      {/* ── Work status dialog ── */}
      <Dialog open={mode === 'work'} onOpenChange={(open) => { if (!open) setMode('idle') }}>
        <DialogContent className="sm:max-w-[400px] p-0 gap-0 max-h-[100dvh] md:my-4 my-0 rounded-b-none md:rounded-2xl bg-surface-2 border-slate-200/80 shadow-popover">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg text-foreground">Взять в работу</DialogTitle>
            <DialogDescription className="text-slate-500">
              {lead.organization}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-slate-500 text-sm font-medium">Статус <span className="text-red-400">*</span></label>
              <Select value={workStatus} onValueChange={setWorkStatus}>
                <SelectTrigger className="h-9 w-full text-sm bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-500 text-sm font-medium">Маржа (%) <span className="text-red-400">*</span></label>
                <Input
                  type="number"
                  placeholder="0"
                  value={workMargin}
                  onChange={(e) => setWorkMargin(e.target.value)}
                  className="h-9 text-sm bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-500 text-sm font-medium">Менеджер <span className="text-red-400">*</span></label>
                <Select value={workManager} onValueChange={setWorkManager}>
                  <SelectTrigger className="h-9 w-full text-sm bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40">
                    <SelectValue placeholder="Выбрать" />
                  </SelectTrigger>
                  <SelectContent>
                    {MANAGERS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-500 text-sm font-medium">Вид деятельности <span className="text-red-400">*</span></label>
              <Select value={workActivity} onValueChange={setWorkActivity}>
                <SelectTrigger className="h-9 w-full text-sm bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40">
                  <SelectValue placeholder="Выберите вид" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="px-6 py-3 border-t border-slate-100 gap-2 sm:gap-0 shrink-0">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-500 hover:text-foreground hover:bg-slate-100"
              onClick={() => setMode('idle')}
            >
              Отмена
            </Button>
            <Button
              disabled={!workStatus || !workMargin || !workManager || !workActivity || saving}
              className="btn-primary"
              onClick={() => saveStatus('В работе', workStatus, null)}
            >
              <Check className="h-4 w-4 mr-2" />
              В работу
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Action buttons (when idle) — hidden for VTB ── */}
      {mode === 'idle' && !isVTB && (
        <>
          <Button
            size="sm"
            className={`${btnBase} min-w-[100px] bg-white hover:bg-slate-50 text-slate-900 border border-slate-300`}
            onClick={() => { setMode('callback'); setCallDate(new Date().toISOString().slice(0, 10)) }}
          >
            Перезвонить
          </Button>
          <Button
            size="sm"
            className={`${btnBase} min-w-[100px] bg-white hover:bg-red-50 text-red-500 border border-red-300`}
            onClick={() => setMode('reject')}
          >
            Отказ
          </Button>
          <Button
            size="sm"
            className={`${btnBase} min-w-[100px] bg-green-600 hover:bg-green-700 text-white`}
            onClick={() => { setMode('work'); setWorkStatus(''); setWorkMargin(''); setWorkManager(''); setWorkActivity('') }}
          >
            В работу
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
  onUpdate,
  isVTB = false,
}: {
  lead: Lead
  onDelete: (id: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: string, value: string | Record<string, unknown>) => void
  isVTB?: boolean
}) {
  const d = new Date(lead.createdAt)
  const day = d.getDate()
  const month = d.toLocaleDateString('ru-RU', { month: 'long' })
  const isNotStarted = !lead.status || lead.status === 'Не начато'
  const overdue = lead.status === 'Перезвонить' && isOverdue(lead.callDate)

  return (
    <div className={cn(
      'group flex items-center gap-3 px-4 py-2.5 transition-all duration-200 border-l-[3px] row-hover',
      isNotStarted && 'border-l-slate-400',
      lead.status === 'Перезвонить' && !overdue && 'border-l-amber-400',
      overdue && 'bg-amber-500/[0.04] border-l-red-400',
    )}>
      {/* Date */}
      <div className="flex flex-col items-center justify-center w-11 h-10 rounded-lg bg-slate-100 border border-slate-200/80 shrink-0">
        <span className="text-sm font-bold tabular-nums leading-none text-foreground">{day}</span>
        <span className="text-[9px] text-slate-500 capitalize">{month}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <EditableField
            value={lead.organization}
            onSave={(val) => onUpdate(lead.id, 'organization', val)}
            className="font-semibold text-sm leading-tight text-foreground max-w-[200px]"
          />
          {lead.partner && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 border-slate-200/80 bg-slate-100 text-slate-500">{lead.partner}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
          <EditableField
            value={lead.contactInfo}
            onSave={(val) => onUpdate(lead.id, 'contactInfo', val)}
            type="tel"
            icon={Phone}
            className="hover:text-foreground"
          />
          <EditableField
            value={lead.email}
            onSave={(val) => onUpdate(lead.id, 'email', val)}
            type="email"
            icon={Mail}
            className="hover:text-foreground"
          />
        </div>
        <span className="flex items-center gap-1.5 text-[13px] text-slate-500 min-w-0">
          <MessageSquare className="h-3 w-3 shrink-0 text-slate-600" />
          <EditableTextCell
            value={lead.comment || ''}
            onSave={(val) => onUpdate(lead.id, 'comment', val)}
            placeholder="комментарий..."
            className="text-[13px] text-slate-500"
          />
        </span>
      </div>

      {/* Inline status controls */}
      <InlineStatusControls lead={lead} onRemove={onRemove} onUpdate={onUpdate} isVTB={isVTB} />

      {/* Delete — hidden for VTB */}
      {!isVTB && (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0 opacity-40 hover:opacity-100 transition-opacity"
        onClick={() => onDelete(lead.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      )}
    </div>
  )
}

// ─── Mobile Card ──────────────────────────────────────────────────

function IncomingMobileCard({
  lead,
  onDelete,
  onRemove,
  onUpdate,
  isVTB = false,
}: {
  lead: Lead
  onDelete: (id: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: string, value: string | Record<string, unknown>) => void
  isVTB?: boolean
}) {
  const d = new Date(lead.createdAt)
  const day = d.getDate()
  const month = d.toLocaleDateString('ru-RU', { month: 'long' })
  const isNotStarted = !lead.status || lead.status === 'Не начато'
  const overdue = lead.status === 'Перезвонить' && isOverdue(lead.callDate)

  return (
    <motion.div
      variants={slideUp}
      className={cn(
        'rounded-2xl border bg-slate-50 p-4 space-y-3 transition-all duration-200 glass-card shadow-card',
        isNotStarted && 'border-dashed border-slate-500 bg-slate-50',
        overdue && 'border-amber-500/20 bg-amber-500/[0.04]',
        lead.status === 'Перезвонить' && !overdue && 'border-amber-500/20',
      )}
    >
      {/* Header: date + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />
          <span>{day} {month}</span>
        </div>
        {isNotStarted && (
          <Badge className="bg-slate-100 text-slate-500 text-xs px-2.5 py-0.5 border border-slate-200/80 h-8 rounded-lg">
            <Clock className="h-3.5 w-3.5 mr-1" /> Не начато
          </Badge>
        )}
        {lead.status === 'Перезвонить' && (
          <Badge className={cn(
            'text-xs px-2.5 py-0.5 border h-8 rounded-lg',
            overdue ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          )}>
            {overdue ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Просрочено {getOverdueDays(lead.callDate)} дн.
              </span>
            ) : (
              `${lead.callDate ? formatCallDate(lead.callDate) : ''}`
            )}
          </Badge>
        )}
      </div>

      {/* Org */}
      <div>
        <EditableField
          value={lead.organization}
          onSave={(val) => onUpdate(lead.id, 'organization', val)}
          className="font-semibold text-[15px] leading-tight text-foreground"
        />
        {lead.partner && (
          <Badge variant="outline" className="text-xs px-2 py-0 mt-1 border-slate-200/80 bg-slate-100 text-slate-500">{lead.partner}</Badge>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-1 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <EditableField
            value={lead.contactInfo}
            onSave={(val) => onUpdate(lead.id, 'contactInfo', val)}
            type="tel"
            icon={Phone}
            className="hover:text-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <EditableField
            value={lead.email}
            onSave={(val) => onUpdate(lead.id, 'email', val)}
            type="email"
            icon={Mail}
            className="hover:text-foreground"
          />
        </div>
      </div>

      {/* Comment */}
      <div className="flex items-start gap-1.5 text-[12.5px] text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
        <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
        <EditableTextCell
          value={lead.comment || ''}
          onSave={(val) => onUpdate(lead.id, 'comment', val)}
          placeholder="комментарий..."
          className="text-[12.5px] text-slate-500"
        />
      </div>

      {/* Inline controls */}
      <div className="pt-1">
        <InlineStatusControls lead={lead} onRemove={onRemove} onUpdate={onUpdate} isVTB={isVTB} />
      </div>

      {/* Delete — hidden for VTB */}
      {!isVTB && (
      <div className="flex justify-end pt-1 border-t border-slate-100">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 text-xs rounded-lg font-medium gap-1"
          onClick={() => onDelete(lead.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Удалить
        </Button>
      </div>
      )}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export function IncomingLeadsTable() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  const storeGlobalSearch = useAppStore((s) => s.globalSearch)

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads?zayavka=Входящий&limit=2000')
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

  // Filter by global search
  const filtered = useMemo(() => {
    if (!storeGlobalSearch.trim()) return leads
    const q = storeGlobalSearch.toLowerCase()
    return leads.filter((l) => {
      const haystack = `${l.organization || ''} ${l.contactInfo || ''} ${l.manager || ''} ${l.comment || ''} ${l.partner || ''} ${l.email || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [leads, storeGlobalSearch])

  // Sort: newest created first
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [filtered])

  const notStartedCount = useMemo(() => filtered.filter((l) => !l.status || l.status === 'Не начато').length, [filtered])
  const overdueCount = useMemo(() => filtered.filter((l) => l.status === 'Перезвонить' && isOverdue(l.callDate)).length, [filtered])
  const callbackCount = useMemo(() => filtered.filter((l) => l.status === 'Перезвонить' && !isOverdue(l.callDate)).length, [filtered])

  // Remove lead from list (used after reject/work transfer)
  function handleRemove(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    useAppStore.getState().bumpSearchVersion()
  }

  async function handleUpdate(id: string, field: string, value: string | Record<string, unknown>) {
    const lead = leads.find((l) => l.id === id)
    if (!lead) return
    try {
      const body = field === '__merge' && typeof value === 'object'
        ? value
        : { ...lead, [field]: value }
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        setLeads((prev) => prev.map((l) => l.id === id ? updated : l))
        toast.success('Сохранено')
        useAppStore.getState().bumpSearchVersion()
      } else {
        toast.error('Ошибка сохранения')
      }
    } catch {
      toast.error('Ошибка соединения')
    }
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
          <div key={i} className="h-20 skeleton-shimmer rounded-xl" />
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
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Входящие</h2>
          </div>
          <Badge variant="secondary" className="text-xs tabular-nums bg-slate-100 text-slate-500 border-slate-200/80">{leads.length}</Badge>
          {notStartedCount > 0 && (
            <Badge className="bg-slate-100 text-slate-500 text-xs border border-slate-200/80 tabular-nums">
              {notStartedCount} новых
            </Badge>
          )}
          {callbackCount > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20 tabular-nums">
              {callbackCount} перезвонить
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge className="bg-red-500/10 text-red-400 text-xs border border-red-500/20 tabular-nums">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {overdueCount} просрочено
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isVTB && (
            <Button onClick={() => setFormOpen(true)} size="default" className="hidden sm:flex btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Новый входящий
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block glass-card shadow-card rounded-2xl border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {sorted.length ? sorted.map((lead) => (
            <IncomingDesktopRow
              key={lead.id}
              lead={lead}
              onDelete={setDeleteId}
              onRemove={handleRemove}
              onUpdate={handleUpdate}
              isVTB={isVTB}
            />
          )) : (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-600">
              <PhoneOff className="h-9 w-9 opacity-40" />
              <p className="text-sm">Входящих лидов нет</p>
              {!isVTB && (
                <Button variant="outline" size="sm" className="mt-2 border-slate-200/80 bg-slate-50 text-slate-500 hover:text-foreground hover:bg-slate-100" onClick={() => setFormOpen(true)}>
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
            onUpdate={handleUpdate}
            isVTB={isVTB}
          />
        )) : (
          <div className="flex flex-col items-center gap-2 py-12">
            <PhoneOff className="h-9 w-9 opacity-40" />
            <p className="text-slate-600 text-sm">Входящих лидов нет</p>
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
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg bg-surface-2 border-slate-200/80 rounded-2xl shadow-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Удалить лид?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-500 hover:text-foreground">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
