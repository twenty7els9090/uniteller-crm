'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Phone, User, Loader2, GripVertical, MessageSquare } from 'lucide-react'

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
    title: 'Звонок',
    dotColor: 'bg-sky-500',
    headerBg: 'bg-sky-50',
    borderColor: 'border-sky-200',
    filter: (l) => l.zayavka === 'Звонок',
    defaultZayavka: 'Звонок',
    defaultStatus: null,
  },
  {
    id: 'v-rabote',
    title: 'В работе',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    filter: (l) =>
      l.zayavka === 'В работе' && (!l.status || l.status === 'не открыт ОКВЭД'),
    defaultZayavka: 'В работе',
    defaultStatus: null,
  },
  {
    id: 'dogovor',
    title: 'Договор',
    dotColor: 'bg-teal-500',
    headerBg: 'bg-teal-50',
    borderColor: 'border-teal-200',
    filter: (l) =>
      ['заключаем договор', 'ожидаем банковские параметры', 'параметры получены'].includes(
        l.status || '',
      ),
    defaultZayavka: 'В работе',
    defaultStatus: 'заключаем договор',
  },
  {
    id: 'nastroyka',
    title: 'Настройка',
    dotColor: 'bg-cyan-500',
    headerBg: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    filter: (l) =>
      ['настраиваем сервис', 'ожидание боевых платежей'].includes(l.status || ''),
    defaultZayavka: 'В работе',
    defaultStatus: 'настраиваем сервис',
  },
  {
    id: 'boevye',
    title: 'Боевые',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    filter: (l) =>
      ['пошли боевые платежи', 'личный кабинет создан'].includes(l.status || '') ||
      l.zayavka === 'Выполнена',
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

// ─── Rejection status set (for visual flagging) ────────────────────────

const REJECTION_STATUSES = new Set([
  'не актуально',
  'отказ СБ',
  'не поддерживаем оборудование',
  'нет совместной интеграции',
  'высокая комиссия',
  'высокая процентная ставка',
  'другая причина',
])

// ─── Status badge helper ──────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  'пошли боевые платежи': 'bg-emerald-100 text-emerald-700',
  'личный кабинет создан': 'bg-teal-100 text-teal-700',
  'заключаем договор': 'bg-sky-100 text-sky-700',
  'ожидаем банковские параметры': 'bg-sky-100 text-sky-700',
  'параметры получены': 'bg-cyan-100 text-cyan-700',
  'настраиваем сервис': 'bg-cyan-100 text-cyan-700',
  'ожидание боевых платежей': 'bg-violet-100 text-violet-700',
  'не открыт ОКВЭД': 'bg-amber-100 text-amber-700',
  'высокая комиссия': 'bg-orange-100 text-orange-700',
  'высокая процентная ставка': 'bg-orange-100 text-orange-700',
  'не актуально': 'bg-red-100 text-red-700',
  'не поддерживаем оборудование': 'bg-rose-100 text-rose-700',
  'нет совместной интеграции': 'bg-red-100 text-red-700',
  'отказ СБ': 'bg-red-100 text-red-800',
  'другая причина': 'bg-stone-100 text-stone-600',
  'Нужна интеграция': 'bg-teal-100 text-teal-700',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'
  return (
    <Badge
      className={cn(
        color,
        'text-[10px] px-1.5 py-0 leading-4 whitespace-nowrap font-medium border-0',
      )}
    >
      {status}
    </Badge>
  )
}

// ─── Date formatting ──────────────────────────────────────────────────

function getRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return 'Вчера'
  if (diffDays < 7) return `${diffDays}д назад`
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Lead Card Content (shared between sortable and overlay) ──────────

function LeadCardContent({ lead }: { lead: Lead }) {
  const isRejection = lead.status ? REJECTION_STATUSES.has(lead.status) : false

  return (
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
          {lead.status && <StatusBadge status={lead.status} />}
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
  )
}

// ─── Sortable Lead Card ───────────────────────────────────────────────

function SortableLeadCard({
  lead,
  isReadOnly,
}: {
  lead: Lead
  isReadOnly: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, disabled: isReadOnly })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md',
        isDragging && 'opacity-40 shadow-lg ring-2 ring-primary/20 rotate-2',
        !isReadOnly && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {/* Drag handle */}
      {!isReadOnly && (
        <button
          type="button"
          className={cn(
            'absolute top-2.5 right-2 p-0.5 rounded transition-colors',
            'text-muted-foreground/20 hover:text-muted-foreground/50',
            'opacity-0 group-hover:opacity-100 focus:opacity-100',
          )}
          aria-label="Перетащить"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      <LeadCardContent lead={lead} />
    </div>
  )
}

// ─── Drag Overlay Card ────────────────────────────────────────────────

function DragOverlayCard({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-2xl ring-2 ring-primary/30 w-[270px] rotate-2">
      <LeadCardContent lead={lead} />
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────

function KanbanColumn({
  column,
  leadIds,
  leadsMap,
  isReadOnly,
  isDragOver,
}: {
  column: ColumnDef
  leadIds: string[]
  leadsMap: Record<string, Lead>
  isReadOnly: boolean
  isDragOver: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const cards = leadIds.map((id) => leadsMap[id]).filter(Boolean)
  const highlight = isDragOver || isOver

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border bg-muted/20 min-w-[280px] w-[280px] shrink-0 transition-all',
        column.borderColor,
        highlight && !isReadOnly && 'bg-primary/5 ring-2 ring-primary/20 scale-[1.01]',
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          'px-3 py-2.5 rounded-t-[11px] border-b flex items-center justify-between shrink-0',
          column.headerBg,
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', column.dotColor)} />
          <h3 className="text-sm font-semibold select-none">{column.title}</h3>
        </div>
        <span className="text-xs font-bold tabular-nums text-muted-foreground bg-white/70 dark:bg-black/20 rounded-full px-2 py-0.5 min-w-[24px] text-center">
          {cards.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-280px)]">
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {cards.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              isReadOnly={isReadOnly}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && !highlight && (
          <div className="flex flex-col items-center justify-center h-20 text-xs text-muted-foreground/40 gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>Пусто</span>
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
          className="flex flex-col rounded-xl border bg-muted/20 min-w-[280px] w-[280px] shrink-0"
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
  const [activeId, setActiveId] = useState<string | null>(null)
  const [columnItems, setColumnItems] = useState<Record<string, string[]>>({})
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Ref to avoid stale closure in async callbacks
  const leadsRef = useRef(leads)
  leadsRef.current = leads

  // ─── DnD sensors ───
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

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

  // ─── Build column → lead IDs mapping ───
  useEffect(() => {
    const items: Record<string, string[]> = {}
    for (const col of COLUMNS) {
      items[col.id] = leads.filter(col.filter).map((l) => l.id)
    }
    setColumnItems(items)
  }, [leads])

  // ─── Lookup helpers ───
  const findColumnForItem = useCallback(
    (id: string): string | undefined => {
      for (const [colId, ids] of Object.entries(columnItems)) {
        if (ids.includes(id)) return colId
      }
      return undefined
    },
    [columnItems],
  )

  const leadsMap = useMemo(() => {
    const map: Record<string, Lead> = {}
    for (const l of leads) map[l.id] = l
    return map
  }, [leads])

  // ─── Determine target column from over target ───
  function getTargetColumn(overId: string): string | undefined {
    if (COLUMNS.some((c) => c.id === overId)) return overId
    return findColumnForItem(overId)
  }

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

  // ─── Reset column items to match current leads ───
  const resetColumnItems = useCallback(() => {
    const items: Record<string, string[]> = {}
    for (const col of COLUMNS) {
      items[col.id] = leadsRef.current
        .filter(col.filter)
        .map((l) => l.id)
    }
    setColumnItems(items)
  }, [])

  // ─── Drag handlers ───
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    if (isReadOnly) return
    const { active, over } = event
    if (!over) return

    const activeCol = findColumnForItem(active.id as string)
    const overCol = getTargetColumn(over.id as string)

    if (!activeCol || !overCol || activeCol === overCol) {
      setDragOverColumn(activeCol)
      return
    }

    // Optimistically move item between columns
    setColumnItems((prev) => {
      const src = [...(prev[activeCol] || [])]
      const dst = [...(prev[overCol] || [])]

      const activeIdx = src.indexOf(active.id as string)
      if (activeIdx === -1) return prev
      src.splice(activeIdx, 1)

      const overIdx = dst.indexOf(over.id as string)
      if (overIdx !== -1) {
        dst.splice(overIdx, 0, active.id as string)
      } else {
        dst.push(active.id as string)
      }

      return { ...prev, [activeCol]: src, [overCol]: dst }
    })

    setDragOverColumn(overCol)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const prevActiveId = activeId
    setActiveId(null)
    setDragOverColumn(null)

    if (!over) {
      resetColumnItems()
      return
    }

    const activeCol = findColumnForItem(prevActiveId || (active.id as string))
    const overCol = getTargetColumn(over.id as string)

    if (activeCol && overCol && activeCol !== overCol) {
      const column = COLUMNS.find((c) => c.id === overCol)
      if (column) {
        updateLeadColumn(active.id as string, column)
      }
    }
  }

  // ─── Loading skeleton ───
  if (loading) {
    return <SkeletonBoard />
  }

  // ─── Column data ───
  const columnData = COLUMNS.map((col) => ({
    column: col,
    leadIds: columnItems[col.id] || [],
  }))

  // ─── Read-only board (no DnD context) ───
  if (isReadOnly) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {columnData.map(({ column, leadIds }) => (
          <KanbanColumn
            key={column.id}
            column={column}
            leadIds={leadIds}
            leadsMap={leadsMap}
            isReadOnly={true}
            isDragOver={false}
          />
        ))}
      </div>
    )
  }

  // ─── Interactive board ───
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {columnData.map(({ column, leadIds }) => (
          <KanbanColumn
            key={column.id}
            column={column}
            leadIds={leadIds}
            leadsMap={leadsMap}
            isReadOnly={false}
            isDragOver={dragOverColumn === column.id}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId && leadsMap[activeId] ? (
          <DragOverlayCard lead={leadsMap[activeId]} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
