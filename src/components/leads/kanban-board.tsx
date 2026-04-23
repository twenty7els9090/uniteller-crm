'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { StatusBadge, REJECTION_STATUSES } from '@/lib/status'
import { getRelativeTime } from '@/lib/format'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Phone, User, GripVertical, MessageSquare, Search } from 'lucide-react'

// ─── Column Definitions ───────────────────────────────────────────────

interface ColumnDef {
  id: string
  title: string
  dotColor: string
  headerBg: string
  borderColor: string
  filter: (lead: Lead) => boolean
  defaultZayavka: string
  defaultStatus: string | null
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'zvonok',
    title: 'Входящий',
    dotColor: 'bg-sky-500',
    headerBg: 'bg-sky-50',
    borderColor: 'border-sky-200',
    filter: (l) => l.zayavka === 'Входящий' || l.zayavka === 'Звонок',
    defaultZayavka: 'Входящий',
    defaultStatus: null,
  },
  {
    id: 'dogovor',
    title: 'Договор',
    dotColor: 'bg-teal-500',
    headerBg: 'bg-teal-50',
    borderColor: 'border-teal-200',
    filter: (l) => l.status === 'заключаем договор',
    defaultZayavka: 'В работе',
    defaultStatus: 'заключаем договор',
  },
  {
    id: 'bank-params',
    title: 'Ожидание банковских параметров',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    filter: (l) =>
      ['ожидаем банковские параметры', 'параметры получены'].includes(l.status || ''),
    defaultZayavka: 'В работе',
    defaultStatus: 'ожидаем банковские параметры',
  },
  {
    id: 'nastroyka',
    title: 'Настройка',
    dotColor: 'bg-cyan-500',
    headerBg: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    filter: (l) => l.status === 'настраиваем сервис',
    defaultZayavka: 'В работе',
    defaultStatus: 'настраиваем сервис',
  },
  {
    id: 'boevye-platezhi',
    title: 'Ожидание боевых платежей',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    filter: (l) =>
      ['ожидание боевых платежей', 'личный кабинет создан'].includes(
        l.status || '',
      ) || l.zayavka === 'Выполнена',
    defaultZayavka: 'В работе',
    defaultStatus: 'ожидание боевых платежей',
  },
  {
    id: 'na-pauze',
    title: 'На паузе',
    dotColor: 'bg-orange-500',
    headerBg: 'bg-orange-50',
    borderColor: 'border-orange-200',
    filter: (l) => l.zayavka === 'На паузе',
    defaultZayavka: 'На паузе',
    defaultStatus: null,
  },
  {
    id: 'otkazy',
    title: 'Отказы',
    dotColor: 'bg-red-500',
    headerBg: 'bg-red-50',
    borderColor: 'border-red-200',
    filter: (l) =>
      l.zayavka === 'Отклонена' ||
      [
        'не актуально',
        'отказ СБ',
        'не поддерживаем оборудование',
        'нет совместной интеграции',
        'высокая комиссия',
        'высокая процентная ставка',
        'другая причина',
      ].includes(l.status || ''),
    defaultZayavka: 'Отклонена',
    defaultStatus: null,
  },
]

// ─── Lead Card ────────────────────────────────────────────────────────

function LeadCard({
  lead,
  isReadOnly,
  isDragging,
}: {
  lead: Lead
  isReadOnly: boolean
  isDragging: boolean
}) {
  const isRejection = lead.status ? REJECTION_STATUSES.has(lead.status) : false

  return (
    <div
      draggable={!isReadOnly}
      onDragStart={(e) => {
        if (isReadOnly) return
        e.dataTransfer.setData('text/plain', lead.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'group relative rounded-xl border bg-card p-3 card-soft transition-all duration-200 hover:-translate-y-0.5 hover:card-soft-hover',
        isDragging && 'opacity-40 shadow-lg ring-2 ring-primary/20 scale-[0.97]',
        !isReadOnly && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {/* Drag handle */}
      {!isReadOnly && (
        <div
          className={cn(
            'absolute top-2.5 right-2 p-0.5 rounded transition-colors',
            'text-muted-foreground/20 hover:text-muted-foreground/50',
            'opacity-0 group-hover:opacity-100 focus:opacity-100 pointer-events-none',
          )}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}

      <div className="space-y-1.5 min-w-0">
        {/* Organization + Partner */}
        <div className="flex items-start justify-between gap-1.5">
          <span
            className={cn(
              'font-semibold text-sm leading-tight truncate',
              isRejection && 'line-through decoration-red-300',
            )}
            title={lead.organization}
          >
            {lead.organization}
          </span>
          {lead.partner && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 shrink-0 font-medium leading-4"
            >
              {lead.partner}
            </Badge>
          )}
        </div>

        {/* Manager + Contact */}
        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground min-w-0">
          {lead.manager && (
            <span className="flex items-center gap-0.5 truncate">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.manager}</span>
            </span>
          )}
          {lead.contactInfo && (
            <span className="flex items-center gap-0.5 truncate">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.contactInfo}</span>
            </span>
          )}
        </div>

        {/* Status + Margin */}
        {(lead.status || lead.margin) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {lead.status && <StatusBadge status={lead.status} compact />}
            {lead.margin && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 leading-4 font-medium text-emerald-700 border-emerald-200"
              >
                {lead.margin}%
              </Badge>
            )}
          </div>
        )}

        {/* Comment (truncated) */}
        {lead.comment && (
          <p
            className="text-[11px] text-muted-foreground leading-relaxed truncate"
            title={lead.comment}
          >
            {lead.comment}
          </p>
        )}

        {/* Date */}
        {lead.createdAt && (
          <span className="text-[10px] text-muted-foreground/50">
            {getRelativeTime(lead.createdAt)}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────

function KanbanColumn({
  column,
  leads,
  isReadOnly,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  draggingId,
}: {
  column: ColumnDef
  leads: Lead[]
  isReadOnly: boolean
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  draggingId: string | null
}) {
  const highlight = isDragOver && !isReadOnly

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'flex flex-col rounded-2xl border bg-muted/15 min-w-[290px] w-[290px] shrink-0 transition-all duration-200',
        column.borderColor,
        highlight && 'bg-primary/5 ring-2 ring-primary/20 scale-[1.01]',
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          'px-3.5 py-3 rounded-t-[15px] border-b flex items-center justify-between shrink-0',
          column.headerBg,
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', column.dotColor)} />
          <h3 className="text-sm font-semibold select-none">{column.title}</h3>
        </div>
        <span className="text-xs font-bold tabular-nums text-muted-foreground bg-white/70 rounded-full px-2 py-0.5 min-w-[24px] text-center">
          {leads.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-160px)] scrollbar-smooth">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            isReadOnly={isReadOnly}
            isDragging={draggingId === lead.id}
          />
        ))}

        {leads.length === 0 && !highlight && (
          <div className="flex flex-col items-center justify-center h-20 text-xs text-muted-foreground/40 gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>Пусто</span>
          </div>
        )}

        {highlight && leads.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-primary/30 rounded-lg">
            <span className="text-xs text-primary/60">Переместить сюда</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton column loader ───────────────────────────────────────────

function SkeletonBoard() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className="flex flex-col rounded-xl border bg-muted/20 min-w-[290px] w-[290px] shrink-0"
        >
          <div className={cn('px-3 py-2.5 rounded-t-[11px] border-b', col.headerBg)}>
            <div className="flex items-center gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', col.dotColor)} />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-3 space-y-2"
              >
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main KanbanBoard ─────────────────────────────────────────────────

export function KanbanBoard() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  const isReadOnly = !!isVTB

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const leadsRef = useRef(leads)
  leadsRef.current = leads

  // ─── Fetch leads ───
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data)
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

  // ─── Filtered leads (search) ───
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads
    const q = search.toLowerCase()
    return leads.filter((l) =>
      l.organization.toLowerCase().includes(q) ||
      l.contactInfo.toLowerCase().includes(q) ||
      l.comment?.toLowerCase().includes(q) ||
      l.manager.toLowerCase().includes(q) ||
      l.partner?.toLowerCase().includes(q) ||
      l.status?.toLowerCase().includes(q)
    )
  }, [leads, search])

  // ─── Build column → leads mapping ───
  const columnData = useMemo(() => {
    return COLUMNS.map((col) => ({
      column: col,
      leads: filteredLeads.filter(col.filter),
    }))
  }, [filteredLeads])

  // ─── Update lead via API on column change ───
  const updateLeadColumn = useCallback(
    async (leadId: string, column: ColumnDef) => {
      const lead = leadsRef.current.find((l) => l.id === leadId)
      if (!lead) return

      try {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...lead,
            zayavka: column.defaultZayavka,
            status: column.defaultStatus,
          }),
        })

        if (res.ok) {
          const updated = await res.json()
          setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
          toast.success(`Лид перемещён в «${column.title}»`)
        } else {
          toast.error('Ошибка перемещения')
          fetchLeads()
        }
      } catch {
        toast.error('Ошибка соединения')
        fetchLeads()
      }
    },
    [fetchLeads],
  )

  // ─── Native HTML5 DnD handlers ───
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleColumnDragOver = useCallback(
    (columnId: string) => (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverColumn(columnId)
    },
    [],
  )

  const handleColumnDragLeave = useCallback(
    (columnId: string) => (e: React.DragEvent) => {
      // Only clear if actually leaving the column (not entering a child)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setDragOverColumn(null)
      }
    },
    [],
  )

  const handleColumnDrop = useCallback(
    (columnId: string) => (e: React.DragEvent) => {
      e.preventDefault()
      setDragOverColumn(null)
      setDraggingId(null)

      const leadId = e.dataTransfer.getData('text/plain')
      if (!leadId || isReadOnly) return

      const column = COLUMNS.find((c) => c.id === columnId)
      if (!column) return

      // Check if lead is already in this column
      const lead = leadsRef.current.find((l) => l.id === leadId)
      if (!lead) return

      if (column.filter(lead)) return // Already in this column

      updateLeadColumn(leadId, column)
    },
    [isReadOnly, updateLeadColumn],
  )

  // Global drag tracking
  useEffect(() => {
    const handleDragEnd = () => {
      setDraggingId(null)
      setDragOverColumn(null)
    }

    document.addEventListener('dragend', handleDragEnd)
    return () => {
      document.removeEventListener('dragend', handleDragEnd)
    }
  }, [])

  // ─── Loading skeleton ───
  if (loading) {
    return <SkeletonBoard />
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по доске..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {columnData.map(({ column, leads: colLeads }) => (
          <KanbanColumn
            key={column.id}
            column={column}
            leads={colLeads}
            isReadOnly={isReadOnly}
            isDragOver={dragOverColumn === column.id}
            onDragOver={handleColumnDragOver(column.id)}
            onDragLeave={handleColumnDragLeave(column.id)}
            onDrop={handleColumnDrop(column.id)}
            draggingId={draggingId}
          />
        ))}
      </div>
    </div>
  )
}
