'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import { LeadFormDialog } from './lead-form-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  ArrowUpDown,
  Building2,
  User,
  Calendar,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useSettings } from '@/hooks/use-settings'
import { PARTNERS, MANAGERS, ZAYAVKA_OPTIONS, STATUS_OPTIONS, ACTIVITY_TYPES } from '@/lib/constants'

// Статусы по цветам: зелёный = успех, сине-голубой = ожидание, жёлто-оранжевый = проблема, красный = отказ
function getStatusBadge(status: string, compact = false) {
  const size = compact ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'
  const colors: Record<string, string> = {
    // Зелёные — успех
    'пошли боевые платежи': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    'личный кабинет создан': 'bg-teal-100 text-teal-700 hover:bg-teal-100',
    // Сине-голубые — ожидание / процесс
    'заключаем договор': 'bg-sky-100 text-sky-700 hover:bg-sky-100',
    'ожидаем банковские параметры': 'bg-sky-100 text-sky-700 hover:bg-sky-100',
    'параметры получены': 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
    'настраиваем сервис': 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
    'ожидание боевых платежей': 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
    // Жёлто-оранжевые — возможная проблема
    'не открыт ОКВЭД': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    'высокая комиссия': 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    'высокая процентная ставка': 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    // Красные — отказ / проблема
    'не актуально': 'bg-red-100 text-red-700 hover:bg-red-100',
    'не поддерживаем оборудование': 'bg-rose-100 text-rose-700 hover:bg-rose-100',
    'нет совместной интеграции': 'bg-red-100 text-red-700 hover:bg-red-100',
    'отказ СБ': 'bg-red-100 text-red-800 hover:bg-red-100',
    'другая причина': 'bg-stone-100 text-stone-600 hover:bg-stone-100',
  }
  const color = colors[status] || 'bg-gray-100 text-gray-600 hover:bg-gray-100'
  return <Badge variant="default" className={cn(color, size, 'whitespace-nowrap font-medium')}>{status}</Badge>
}

function getZayavkaBadge(zayavka: string, compact = false) {
  const size = compact ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'
  switch (zayavka) {
    case 'Выполнена':
      return <Badge variant="default" className={cn('bg-emerald-100 text-emerald-800 hover:bg-emerald-100', size, 'whitespace-nowrap font-medium')}>Выполнена</Badge>
    case 'В работе':
      return <Badge variant="default" className={cn('bg-amber-100 text-amber-800 hover:bg-amber-100', size, 'whitespace-nowrap font-medium')}>В работе</Badge>
    case 'На паузе':
      return <Badge variant="default" className={cn('bg-orange-100 text-orange-800 hover:bg-orange-100', size, 'whitespace-nowrap font-medium')}>На паузе</Badge>
    case 'Отклонена':
      return <Badge variant="default" className={cn('bg-red-100 text-red-800 hover:bg-red-100', size, 'whitespace-nowrap font-medium')}>Отклонена</Badge>
    case 'Звонок':
      return <Badge variant="default" className={cn('bg-sky-100 text-sky-800 hover:bg-sky-100', size, 'whitespace-nowrap font-medium')}>Звонок</Badge>
    default:
      return <Badge variant="secondary" className={cn(size, 'whitespace-nowrap font-medium')}>{zayavka}</Badge>
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── SLA timer helpers ───
function getSlaDays(updatedAt: string | null | undefined): number {
  if (!updatedAt) return 0
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
}

function getSlaColorClass(days: number): string {
  if (days > 7) return 'text-red-600'
  if (days >= 4) return 'text-amber-600'
  return 'text-emerald-600'
}

function getSlaTitle(updatedAt: string | null | undefined): string {
  if (!updatedAt) return ''
  return new Date(updatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Row accent by zayavka status ───
function getRowClass(zayavka: string): string {
  switch (zayavka) {
    case 'На паузе': return 'bg-orange-50/70 hover:bg-orange-50'
    case 'Отклонена': return 'bg-red-50/50 hover:bg-red-50/80 opacity-80'
    case 'В работе': return 'hover:bg-teal-50/40'
    default: return ''
  }
}

function getRowLeftBorder(zayavka: string): string {
  switch (zayavka) {
    case 'В работе': return 'border-l-[3px] border-l-teal-400'
    case 'На паузе': return 'border-l-[3px] border-l-orange-400'
    case 'Отклонена': return 'border-l-[3px] border-l-red-300'
    default: return 'border-l-[3px] border-l-transparent'
  }
}

// Check if lead is "new" (created less than 2 days ago)
function isNewLead(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  return (Date.now() - new Date(createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000
}

function NewBadge() {
  return (
    <Badge variant="default" className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 font-semibold">
      новый
    </Badge>
  )
}

// ─── Skeleton loader rows ───
function SkeletonRows({ count = 8 }: { count?: number }) {
  const widths = [200, 72, 88, 130, 110, 88, 60]
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="border-l-[3px] border-l-transparent">
          {widths.map((w, j) => (
            <TableCell key={j} className="py-2.5 px-2 first:pl-4">
              <div
                className="h-5 rounded-md bg-muted animate-pulse"
                style={{ width: w, opacity: 1 - i * 0.09 }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ─── Inline editable phone cell ───
function InlinePhoneCell({ value, onSave }: { value: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => { setDraft(value) }, [value])

  function commit() {
    if (draft === value) { setEditing(false); return }
    onSave(draft)
    setEditing(false)
  }
  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        className="inline-flex items-center rounded px-1.5 py-0 cursor-pointer transition-colors hover:bg-accent"
        onClick={(e) => { e.stopPropagation(); setEditing(true) }}
        title="Нажмите для редактирования"
      >
        <span className={cn(!value && 'text-muted-foreground/50')}>
          {value || '+7 (___) ___-__-__'}
        </span>
      </span>
    )
  }

  return (
    <PhoneInput
      value={draft}
      onChange={setDraft}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() }; if (e.key === 'Escape') cancel() }}
      className="h-6 text-[15px] min-w-[140px] border-primary"
    />
  )
}

// ─── Inline editable text cell ───
function EditableTextCell({
  value,
  onSave,
  maxLength = 200,
  className = '',
  placeholder = '—',
  numericOnly = false,
  suffix = '',
  fullWidth = false,
}: {
  value: string
  onSave: (val: string) => void
  maxLength?: number
  className?: string
  placeholder?: string
  numericOnly?: boolean
  suffix?: string
  fullWidth?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    onSave(trimmed)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded px-1.5 py-0 cursor-pointer transition-colors hover:bg-accent w-full',
          !value && 'text-muted-foreground italic',
          className
        )}
        onClick={(e) => { e.stopPropagation(); setEditing(true) }}
        title={value || 'Нажмите для редактирования'}
      >
        <span className={cn('truncate block', !value && 'italic')}>
          {value ? `${value}${suffix}` : placeholder}
        </span>
      </span>
    )
  }

  return (
    <Input
      ref={inputRef}
      type={numericOnly ? 'number' : 'text'}
      inputMode={numericOnly ? 'decimal' : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit() }
        if (e.key === 'Escape') cancel()
      }}
      maxLength={maxLength}
      disabled={saving}
      className={cn('h-6 text-xs min-w-[80px] border-primary', className)}
    />
  )
}

// ─── Inline editable select cell ───
function EditableSelectCell({
  value,
  options,
  onSave,
  getBadge,
  isPartnerSelect = false,
  disabled = false,
}: {
  value: string
  options: { value: string; label: string }[]
  onSave: (val: string) => void
  getBadge?: (val: string) => React.ReactNode
  isPartnerSelect?: boolean
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleSave(val: string) {
    if (val === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    onSave(val)
    setSaving(false)
    setEditing(false)
  }

  if (editing && !disabled) {
    return (
      <Select value={value} onValueChange={handleSave} open={editing} onOpenChange={setEditing}>
        <SelectTrigger className="h-6 text-xs min-w-[80px] border-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-accent',
        disabled && 'cursor-default'
      )}
      onClick={(e) => { e.stopPropagation(); !disabled && setEditing(true) }}
      title={disabled ? undefined : 'Нажмите для редактирования'}
    >
      {getBadge ? getBadge(value) : <Badge variant="outline">{value}</Badge>}
    </span>
  )
}

// Сортировка по приоритету: статус → заявка
function getLeadPriority(lead: Lead): number {
  const statusOrder: Record<string, number> = {
    'ожидание боевых платежей': 0,
    'настраиваем сервис': 1,
    'ожидаем банковские параметры': 2,
    'заключаем договор': 3,
    'не открыт ОКВЭД': 4,
    'личный кабинет создан': 5,
    'параметры получены': 6,
    'высокая процентная ставка': 6,
    'высокая комиссия': 7,
    'не актуально': 8,
    'не поддерживаем оборудование': 9,
    'нет совместной интеграции': 10,
    'отказ СБ': 11,
  }
  const zayavkaOrder: Record<string, number> = { 'На паузе': 100, 'Отклонена': 200 }

  // Приоритет по детальному статусу (если есть)
  const statusPriority = lead.status ? (statusOrder[lead.status] ?? 50) : 50

  // Приоритет по заявке (На паузе / Отклонена всегда в конце)
  const zayavkaPriority = zayavkaOrder[lead.zayavka] ?? 0

  return zayavkaPriority + statusPriority
}

// ─── Multi-select filter popover ───
function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const allSelected = selected.length === 0
  const count = selected.length

  function toggle(val: string) {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  function selectAll() {
    onChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 text-sm shrink-0 gap-1.5 w-[140px] sm:w-[170px] justify-between font-normal',
            count > 0 && 'border-primary bg-primary/5'
          )}
        >
          <span className="truncate">
            {allSelected ? label : `${label} (${count})`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-1" align="start" side="bottom" sideOffset={4}>
        <div className="space-y-0.5">
          <button
            className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left shrink-0"
            onClick={selectAll}
          >
            <Checkbox checked={allSelected} />
            <span className={cn(!allSelected && 'text-muted-foreground')}>Все</span>
          </button>
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                onClick={() => toggle(opt)}
              >
                <Checkbox checked={selected.includes(opt)} />
                <span className={cn('truncate', !selected.includes(opt) && 'text-muted-foreground')}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface LeadsTableProps {
  showFilters?: boolean
  showDelete?: boolean
}

export function LeadsTable({ showFilters = true, showDelete = true }: LeadsTableProps) {
  const user = useAppStore((s) => s.user)
  const globalSearch = useAppStore((s) => s.globalSearch)
  const { settings } = useSettings()
  const isVTB = user?.role === 'vtb'
  const isAdmin = user?.role === 'uniteller'
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [marginDraft, setMarginDraft] = useState('')
  const [activityDraft, setActivityDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync global search from store to local filter
  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== globalFilter) {
      setGlobalFilter(globalSearch)
    }
  }, [globalSearch])

  // Multi-select filters (empty array = show all)
  const [partnerFilter, setPartnerFilter] = useState<string[]>([])
  const [zayavkaFilter, setZayavkaFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [managerFilter, setManagerFilter] = useState<string[]>([])

  // Quick-hide toggles
  const [hideRejected, setHideRejected] = useState(false)
  const [hidePaused, setHidePaused] = useState(false)

  // Use settings from API, fall back to hardcoded constants
  const dynamicPartners = useMemo(() => settings.partner.length > 0 ? settings.partner : [...PARTNERS], [settings.partner])
  const dynamicManagers = useMemo(() => settings.manager.length > 0 ? settings.manager : [...MANAGERS], [settings.manager])
  const dynamicZayavka = useMemo(() => settings.zayavka.length > 0 ? settings.zayavka : [...ZAYAVKA_OPTIONS], [settings.zayavka])
  const dynamicStatus = useMemo(() => settings.status.length > 0 ? settings.status : [...STATUS_OPTIONS], [settings.status])
  const dynamicActivityTypes = useMemo(() => settings.activityType.length > 0 ? settings.activityType : [...ACTIVITY_TYPES], [settings.activityType])

  // Client-side search & filter — exclude combat leads (Выполнена / пошли боевые платежи) for non-VTB
  const leads = useMemo(() => {
    let result = allLeads.filter((l) =>
      isVTB || (l.zayavka !== 'Выполнена' && l.status !== 'пошли боевые платежей')
    )
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      result = result.filter((l) =>
        l.organization.toLowerCase().includes(q) ||
        l.contactInfo.toLowerCase().includes(q) ||
        l.comment?.toLowerCase().includes(q) ||
        l.manager.toLowerCase().includes(q) ||
        l.status?.toLowerCase().includes(q)
      )
    }
    if (partnerFilter.length > 0) result = result.filter((l) => partnerFilter.includes(l.partner))
    if (zayavkaFilter.length > 0) result = result.filter((l) => zayavkaFilter.includes(l.zayavka))
    if (statusFilter.length > 0) result = result.filter((l) => l.status && statusFilter.includes(l.status))
    if (managerFilter.length > 0) result = result.filter((l) => managerFilter.includes(l.manager))
    if (hideRejected) result = result.filter((l) => l.zayavka !== 'Отклонена')
    if (hidePaused) result = result.filter((l) => l.zayavka !== 'На паузе')
    // Sort by date newest first (statusChangedAt takes priority over createdAt)
    result.sort((a, b) => {
      const dateA = new Date(a.statusChangedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.statusChangedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    return result
  }, [allLeads, globalFilter, partnerFilter, zayavkaFilter, statusFilter, managerFilter, hideRejected, hidePaused, isVTB])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        setAllLeads(data)
      }
    } catch {
      toast.error('Ошибка загрузки лидов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Inline save helper — uses ref to avoid stale closure
  const leadsRef = useRef(allLeads)
  leadsRef.current = allLeads

  const inlineSave = useCallback(async (leadId: string, field: string, value: string) => {
    try {
      const lead = leadsRef.current.find((l) => l.id === leadId)
      if (!lead) return

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          [field]: value,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setAllLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
        toast.success('Сохранено')
      } else {
        toast.error('Ошибка сохранения')
        fetchLeads()
      }
    } catch {
      toast.error('Ошибка соединения')
      fetchLeads()
    }
  }, [fetchLeads])

  // Get unique partners and managers for filters
  const partners = useMemo(() => {
    const set = new Set(leads.map((l) => l.partner))
    return Array.from(set).sort()
  }, [leads])

  const managers = useMemo(() => {
    const set = new Set(leads.map((l) => l.manager))
    return Array.from(set).sort()
  }, [leads])

  const columns: ColumnDef<Lead>[] = useMemo(() => [
    {
      accessorKey: 'organization',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Организация
          <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const lead = row.original
        const slaDays = getSlaDays(lead.updatedAt)
        const slaTitle = getSlaTitle(lead.updatedAt)
        return isVTB ? (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate" title={lead.organization}>{lead.organization}</span>
            {slaDays > 0 && (
              <span className={cn('text-[10px] font-semibold shrink-0', getSlaColorClass(slaDays))} title={slaTitle ? `Обновлено: ${slaTitle}` : undefined}>
                {slaDays}д
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <EditableTextCell
              value={lead.organization}
              onSave={(val) => inlineSave(lead.id, 'organization', val)}
              maxLength={200}
              className="font-medium"
              placeholder="—"
            />
            {slaDays > 0 && (
              <span className={cn('text-[10px] font-semibold shrink-0', getSlaColorClass(slaDays))} title={slaTitle ? `Обновлено: ${slaTitle}` : undefined}>
                {slaDays}д
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'partner',
      header: 'Партнёр',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <EditableSelectCell
            value={lead.partner}
            options={dynamicPartners.map((p) => ({ value: p, label: p }))}
            onSave={(val) => inlineSave(lead.id, 'partner', val)}
            getBadge={(val) => <Badge variant="outline" className="text-xs justify-start">{val}</Badge>}
            disabled={isVTB}
          />
        )
      },
    },
    {
      accessorKey: 'zayavka',
      header: 'Заявка',
      sortingFn: (rowA, rowB) => {
        return getLeadPriority(rowA.original) - getLeadPriority(rowB.original)
      },
      cell: ({ row }) => {
        const lead = row.original
        return isVTB ? (
          getZayavkaBadge(lead.zayavka)
        ) : (
          <EditableSelectCell
            value={lead.zayavka}
            options={dynamicZayavka.map((z) => ({ value: z, label: z }))}
            onSave={(val) => inlineSave(lead.id, 'zayavka', val)}
            getBadge={getZayavkaBadge}
          />
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <EditableSelectCell
            value={lead.status || ''}
            options={dynamicStatus.map((s) => ({ value: s, label: s }))}
            onSave={(val) => inlineSave(lead.id, 'status', val)}
            getBadge={(val) => val ? getStatusBadge(val) : <span className="text-xs text-muted-foreground">—</span>}
            disabled={isVTB}
          />
        )
      },
    },
    {
      accessorKey: 'contactInfo',
      header: 'Контакты',
      cell: ({ row }) => {
        const lead = row.original
        return isVTB ? (
          <span className="text-sm">{lead.contactInfo || '—'}</span>
        ) : (
          <InlinePhoneCell value={lead.contactInfo} onSave={(val) => inlineSave(lead.id, 'contactInfo', val)} />
        )
      },
    },

    {
      accessorKey: 'manager',
      header: 'Менеджер',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <EditableSelectCell
            value={lead.manager}
            options={dynamicManagers.map((m) => ({ value: m, label: m }))}
            onSave={(val) => inlineSave(lead.id, 'manager', val)}
            getBadge={(val) => <Badge variant="outline" className="text-xs justify-start">{val}</Badge>}
            disabled={isVTB}
          />
        )
      },
    },
    {
      accessorKey: 'comment',
      header: 'Комментарий',
      cell: ({ row }) => {
        const lead = row.original
        if (!lead.comment) return <span className="text-sm text-muted-foreground italic">—</span>
        return (
          <div className="max-w-[400px] min-w-[200px]">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{lead.comment}</p>
          </div>
        )
      },
    },
    {
      id: 'details',
      maxSize: 100,
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => openDetails(lead)}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Подробнее
            </Button>
            {showDelete && isAdmin && !isVTB && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setDeleteId(lead.id)}
                title="Удалить"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )
      },
    },
  ], [user, showDelete, isVTB, inlineSave])

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 }, sorting: [{ id: 'zayavka', desc: false }] },
  })

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/leads/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Лид удалён')
        fetchLeads()
      } else {
        toast.error('Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setDeleteId(null)
    }
  }

  // ─── Dialog helpers ───
  function openDetails(lead: Lead) {
    setViewLead(lead)
    setCommentDraft(lead.comment || '')
    setMarginDraft(lead.margin || '')
    setActivityDraft(lead.activityType || '')
    setEditing(false)
  }

  function hasChanges(): boolean {
    if (!viewLead) return false
    return (
      commentDraft !== (viewLead.comment || '') ||
      marginDraft !== (viewLead.margin || '') ||
      activityDraft !== (viewLead.activityType || '')
    )
  }

  async function saveDetails() {
    if (!viewLead) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${viewLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...viewLead,
          comment: commentDraft,
          margin: marginDraft,
          activityType: activityDraft,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAllLeads((prev) => prev.map((l) => (l.id === viewLead.id ? updated : l)))
        setViewLead(updated)
        setEditing(false)
        toast.success('Сохранено')
      } else {
        toast.error('Ошибка сохранения')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setSaving(false)
    }
  }

  // ─── Currency formatter ───
  function formatCurrency(value: string | number | undefined | null): string {
    if (!value && value !== 0) return '—'
    const num = typeof value === 'string'
      ? parseFloat(value.replace(/\s/g, '').replace(',', '.'))
      : value
    if (isNaN(num)) return '—'
    const fixed = Math.abs(num).toFixed(2)
    const [intPart, decPart] = fixed.split('.')
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const decimals = decPart === '00' ? '' : `,${decPart.replace(/0+$/, '')}`
    const prefix = num < 0 ? '-' : ''
    return `${prefix}${formattedInt}${decimals} Р`
  }

  const hasActiveFilters = partnerFilter.length > 0 || zayavkaFilter.length > 0 || statusFilter.length > 0 || managerFilter.length > 0 || hideRejected || hidePaused

  function clearFilters() {
    setPartnerFilter([])
    setZayavkaFilter([])
    setStatusFilter([])
    setManagerFilter([])
    setHideRejected(false)
    setHidePaused(false)
    setGlobalFilter('')
  }

  const currentRows = table.getRowModel().rows

  if (loading && leads.length === 0) {
    return (
      <>
        {!isVTB && (
          <p className="mb-3 text-xs text-muted-foreground hidden md:block">
            Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
          </p>
        )}
        <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2">
                {['Организация', 'Партнёр', 'Заявка', 'Статус', 'Контакты', 'Менеджер', ''].map((h) => (
                  <TableHead key={h} className="text-xs font-semibold text-muted-foreground px-2 first:pl-4 py-3">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <SkeletonRows count={10} />
            </TableBody>
          </Table>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Hint — hidden on mobile */}
      {!isVTB && (
        <motion.div variants={slideUp} initial="hidden" animate="visible">
          <p className="mb-3 text-xs text-muted-foreground hidden md:block">
            Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
          </p>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="space-y-3 mb-4">
        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-11 md:h-9"
            />
          </div>
          {!isVTB && (
            <Button onClick={() => setFormOpen(true)} size="default" className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Новый лид
            </Button>
          )}
        </div>

        {/* Filters — horizontally scrollable on mobile */}
        {showFilters && (
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Фильтры:</span>
            </div>

            <MultiSelectFilter label="Партнёр" options={partners} selected={partnerFilter} onChange={setPartnerFilter} />

            <MultiSelectFilter label="Заявка" options={[...dynamicZayavka]} selected={zayavkaFilter} onChange={setZayavkaFilter} />

            <MultiSelectFilter label="Статус" options={[...dynamicStatus]} selected={statusFilter} onChange={setStatusFilter} />

            <MultiSelectFilter label="Менеджер" options={managers} selected={managerFilter} onChange={setManagerFilter} />

            {/* Quick-hide toggles */}
            <Button
              variant={hideRejected ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 text-xs shrink-0 gap-1.5', hideRejected && 'bg-red-600 hover:bg-red-700 text-white')}
              onClick={() => setHideRejected(!hideRejected)}
            >
              <EyeOff className="h-3 w-3" />
              Отклонённые
            </Button>
            <Button
              variant={hidePaused ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 text-xs shrink-0 gap-1.5', hidePaused && 'bg-orange-600 hover:bg-orange-700 text-white')}
              onClick={() => setHidePaused(!hidePaused)}
            >
              <EyeOff className="h-3 w-3" />
              На паузе
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground shrink-0"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Сбросить
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── Desktop Card-Table ─── */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden shadow-sm">

        {/* Rows */}
        <div className="divide-y">
          {currentRows.length ? currentRows.map((row) => {
            const lead = row.original
            const slaDays = getSlaDays(lead.updatedAt)
            return (
                <div
                  key={row.id}
                  className={cn(
                    'group flex flex-col gap-1.5 px-4 py-3 transition-colors border-l-[3px]',
                    lead.zayavka === 'В работе'  && 'border-l-teal-400 hover:bg-teal-50/20',
                    lead.zayavka === 'На паузе'  && 'border-l-orange-400 bg-orange-50/40 hover:bg-orange-50/70',
                    lead.zayavka === 'Отклонена' && 'border-l-red-300 bg-red-50/25 opacity-75 hover:opacity-100',
                    lead.zayavka === 'Звонок' && 'border-l-sky-400 hover:bg-sky-50/30',
                    !['В работе','На паузе','Отклонена','Звонок'].includes(lead.zayavka) && 'border-l-border hover:bg-muted/30',
                  )}
                >
                  {/* ── Строка 1: Организация + Партнёр + Менеджер ── */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Организация */}
                    <span className="shrink-0 flex items-center gap-1.5">
                      {isVTB ? (
                        <span className="font-semibold text-[17px] leading-tight" title={lead.organization}>{lead.organization}</span>
                      ) : (
                        <EditableTextCell
                          value={lead.organization}
                          onSave={(val) => inlineSave(lead.id, 'organization', val)}
                          className="font-semibold text-[17px]"
                          placeholder="—"
                        />
                      )}
                      <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap" title={`Создан: ${lead.createdAt ? new Date(lead.createdAt).toLocaleString('ru-RU') : ''}${lead.statusChangedAt ? `\nИзменён: ${new Date(lead.statusChangedAt).toLocaleString('ru-RU')}` : ''}`}>{formatDate(lead.statusChangedAt || lead.createdAt || '')}</span>
                      {isNewLead(lead.createdAt) && <NewBadge />}
                    </span>

                    {/* Партнёр */}
                    <span className="shrink-0">
                      <EditableSelectCell
                        value={lead.partner}
                        options={dynamicPartners.map((p) => ({ value: p, label: p }))}
                        onSave={(val) => inlineSave(lead.id, 'partner', val)}
                        getBadge={(val) => <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium whitespace-nowrap">{val}</Badge>}
                        disabled={isVTB}
                      />
                    </span>

                    {/* SLA + Менеджер — прижаты вправо */}
                    <span className="shrink-0 ml-auto flex items-center gap-2">
                      {slaDays > 0 && (
                        <span
                          className={cn('text-[11px] font-bold shrink-0 tabular-nums', getSlaColorClass(slaDays))}
                          title={`Обновлено: ${getSlaTitle(lead.updatedAt)}`}
                        >
                          {slaDays}д
                        </span>
                      )}
                      <EditableSelectCell
                        value={lead.manager}
                        options={dynamicManagers.map((m) => ({ value: m, label: m }))}
                        onSave={(val) => inlineSave(lead.id, 'manager', val)}
                        getBadge={(val) => <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium whitespace-nowrap">{val}</Badge>}
                        disabled={isVTB}
                      />
                    </span>

                  </div>

                  {/* ── Строка 2: Контакты ── */}
                  <div className="flex items-center gap-4 flex-wrap pl-1">
                    {/* Телефон */}
                    <span className="flex items-center gap-1 text-[15px] text-muted-foreground shrink-0">
                      <InlinePhoneCell value={lead.contactInfo} onSave={(val) => inlineSave(lead.id, 'contactInfo', val)} />
                    </span>

                    {/* Почта */}
                    <span className="flex items-center gap-1 text-[15px] text-muted-foreground shrink-0">
                      <Mail className="h-3 w-3 shrink-0" />
                      <EditableTextCell
                        value={lead.email || ''}
                        onSave={(val) => inlineSave(lead.id, 'email', val)}
                        placeholder="example@mail.ru"
                        className="text-[15px]"
                      />
                    </span>
                  </div>

                  {/* ── Строка 3: Заявка + Статус + Маржа + Комментарий ── */}
                  <div className="flex items-center gap-2.5 flex-wrap pl-1">
                    {/* Заявка */}
                    <div className="shrink-0">
                      {isVTB ? getZayavkaBadge(lead.zayavka, true) : (
                        <EditableSelectCell
                          value={lead.zayavka}
                          options={dynamicZayavka.map((z) => ({ value: z, label: z }))}
                          onSave={(val) => inlineSave(lead.id, 'zayavka', val)}
                          getBadge={(val) => getZayavkaBadge(val, true)}
                        />
                      )}
                    </div>

                    {/* Статус */}
                    <div className="shrink-0">
                      <EditableSelectCell
                        value={lead.status || ''}
                        options={dynamicStatus.map((s) => ({ value: s, label: s }))}
                        onSave={(val) => inlineSave(lead.id, 'status', val)}
                        getBadge={(val) => val
                          ? getStatusBadge(val, true)
                          : <span className="text-sm text-muted-foreground/50 italic whitespace-nowrap">—</span>
                        }
                        disabled={isVTB}
                      />
                    </div>

                    {/* Маржа */}
                    {!isVTB && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        Маржа:
                        <EditableTextCell
                          value={lead.margin}
                          onSave={(val) => inlineSave(lead.id, 'margin', val)}
                          suffix="%" numericOnly placeholder="—"
                          className="text-sm"
                        />
                      </span>
                    )}

                    {/* Вид деятельности */}
                    <div className="shrink-0">
                      <EditableSelectCell
                        value={lead.activityType || ''}
                        options={dynamicActivityTypes.map((a) => ({ value: a, label: a }))}
                        onSave={(val) => inlineSave(lead.id, 'activityType', val)}
                        getBadge={(val) => val
                          ? <span className="text-sm bg-muted/70 px-1.5 py-0 rounded-full whitespace-nowrap">{val}</span>
                          : null
                        }
                      />
                    </div>

                    {/* Комментарий */}
                    {isVTB && lead.comment ? (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1 min-w-0">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span className="truncate">{lead.comment}</span>
                      </span>
                    ) : !isVTB ? (
                      <span className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
                        <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <EditableTextCell
                          value={lead.comment || ''}
                          onSave={(val) => inlineSave(lead.id, 'comment', val)}
                          placeholder="Добавить комментарий"
                          className="text-sm text-muted-foreground"
                          fullWidth
                        />
                      </span>
                    ) : null}
                  </div>
                </div>
            )
          }) : (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <svg className="h-9 w-9 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">Лиды не найдены</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-0.5">
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Всего: <span className="font-medium text-foreground">{leads.length}</span> записей
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3">
              {table.getState().pagination.pageIndex + 1} из {table.getPageCount()}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Mobile Card View ─── */}
      <motion.div className="md:hidden space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
        {currentRows.length ? (
          currentRows.map((row) => {
            const lead = row.original
            return (
              <motion.div
                key={row.id}
                variants={slideUp}
                className={cn(
                  'rounded-xl border bg-card p-4 space-y-2.5 transition-colors shadow-sm',
                  'border-l-[3px]',
                  lead.zayavka === 'В работе' && 'border-l-teal-400',
                  lead.zayavka === 'На паузе' && 'border-l-orange-400 bg-orange-50/30',
                  lead.zayavka === 'Отклонена' && 'border-l-red-300 opacity-75',
                  lead.zayavka === 'Звонок' && 'border-l-sky-400',
                  lead.zayavka !== 'В работе' && lead.zayavka !== 'На паузе' && lead.zayavka !== 'Отклонена' && lead.zayavka !== 'Звонок' && 'border-l-border',
                )}
              >
                {/* Header: org + date */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm leading-tight">{lead.organization}</span>
                    {(() => { const d = getSlaDays(lead.updatedAt); return d > 0 ? <span className={cn('text-[10px] font-semibold shrink-0', getSlaColorClass(d))}>{d}д</span> : null })()}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(lead.createdAt)}</span>
                    {isNewLead(lead.createdAt) && <NewBadge />}
                  </div>
                </div>

                {/* Badges row: partner + zayavka */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs px-2 py-0.5 whitespace-nowrap">{lead.partner}</Badge>
                  {getZayavkaBadge(lead.zayavka, true)}
                  {lead.activityType && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">{lead.activityType}</Badge>
                  )}
                </div>

                {/* Status */}
                {lead.status && getStatusBadge(lead.status, true)}

                {/* Comment */}
                {lead.comment && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2 whitespace-pre-wrap break-words">{lead.comment}</p>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div className="text-muted-foreground">
                    <User className="inline h-3.5 w-3.5 mr-1" />
                    <span className="text-foreground">{lead.manager}</span>
                  </div>
                  {lead.margin && !isVTB && (
                    <div className="text-muted-foreground">
                      Маржа: <span className="text-foreground">{lead.margin}%</span>
                    </div>
                  )}
                  {lead.contactInfo && (
                    <div className="text-muted-foreground col-span-2">
                      <span className="text-foreground">{lead.contactInfo}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    className="h-11 text-sm flex-1 rounded-lg"
                    onClick={() => openDetails(lead)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Подробнее
                  </Button>
                  {!isVTB && showDelete && isAdmin && (
                    <Button
                      variant="outline"
                      className="h-11 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => setDeleteId(lead.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">Лиды не найдены</p>
          </div>
        )}

        {/* Mobile pagination */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{leads.length}</span> записей
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">
              {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* FAB — Floating Action Button for mobile */}
      {!isVTB && (
        <button
          onClick={() => setFormOpen(true)}
          className="sm:hidden fixed right-4 bottom-24 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Новый лид"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* New Lead Dialog (only for creation) */}
      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={null}
        onSaved={fetchLeads}
      />

      {/* Delete Confirmation — full height on mobile */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить лид?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Лид будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Lead Detail Dialog ─── */}
      <Dialog open={!!viewLead} onOpenChange={(open) => { if (!open) setViewLead(null) }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold leading-tight pr-8">{viewLead?.organization || 'Детали лида'}</DialogTitle>
            <DialogDescription>
              {viewLead && (
                <span className="flex items-center gap-3 flex-wrap text-sm">
                  {viewLead.partner && <Badge variant="outline">{viewLead.partner}</Badge>}
                  {viewLead.contactInfo && <span>{viewLead.contactInfo}</span>}
                  {viewLead.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {viewLead.email}
                    </span>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewLead && (
            <div className="space-y-4">
              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {getZayavkaBadge(viewLead.zayavka)}
                {viewLead.status && getStatusBadge(viewLead.status)}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-0.5">Менеджер</p>
                  <p className="font-medium">{viewLead.manager || '—'}</p>
                </div>
                {viewLead.turnoverTsp && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Оборот ТСП</p>
                    <p className="font-medium">{formatCurrency(viewLead.turnoverTsp)}</p>
                  </div>
                )}
                {viewLead.margin && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Маржа</p>
                    <p className="font-medium">{viewLead.margin}%</p>
                  </div>
                )}
                {viewLead.revenue && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Выручка</p>
                    <p className="font-medium">{formatCurrency(viewLead.revenue)}</p>
                  </div>
                )}
                {viewLead.activityType && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Вид деятельности</p>
                    <p className="font-medium">{viewLead.activityType}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-0.5">Создан</p>
                  <p className="font-medium">{viewLead.createdAt ? new Date(viewLead.createdAt).toLocaleDateString('ru-RU') : '—'}</p>
                </div>
              </div>

              {/* Editable fields */}
              {!isVTB && (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Маржа (%)</label>
                    <Input
                      type="number"
                      value={marginDraft}
                      onChange={(e) => { setEditing(true); setMarginDraft(e.target.value) }}
                      placeholder="—"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Вид деятельности</label>
                    <Select value={activityDraft} onValueChange={(val) => { setEditing(true); setActivityDraft(val) }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Выбрать..." />
                      </SelectTrigger>
                      <SelectContent>
                        {dynamicActivityTypes.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Комментарий</label>
                    <Textarea
                      value={commentDraft}
                      onChange={(e) => { setEditing(true); setCommentDraft(e.target.value) }}
                      placeholder="Добавить комментарий..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}

              {isVTB && viewLead.comment && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-1.5">Комментарий</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewLead.comment}</p>
                </div>
              )}

              {/* Actions */}
              {!isVTB && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewLead(null)}
                    >
                      Закрыть
                    </Button>
                    {editing && (
                      <Button
                        size="sm"
                        onClick={saveDetails}
                        disabled={saving}
                      >
                        {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                        Сохранить
                      </Button>
                    )}
                  </div>
                  {showDelete && isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { setViewLead(null); setDeleteId(viewLead.id) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Удалить
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
