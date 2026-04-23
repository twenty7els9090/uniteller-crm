import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Lead } from '@/lib/types'

// ─── Status color maps ────────────────────────────────────────────────

/** Detailed status → Tailwind classes (used in table + kanban) */
export const STATUS_COLORS: Record<string, string> = {
  // Incoming lead statuses
  'Не начато': 'bg-gray-100 text-gray-600',
  'Не звонили': 'bg-gray-100 text-gray-600',
  'Звонок выполнен': 'bg-emerald-100 text-emerald-700',
  'Перезвонить': 'bg-amber-100 text-amber-700',
  'Отказался': 'bg-red-100 text-red-700',
  // Green — success
  'пошли боевые платежи': 'bg-emerald-100 text-emerald-700',
  'личный кабинет создан': 'bg-teal-100 text-teal-700',
  // Blue-cyan — in progress
  'заключаем договор': 'bg-sky-100 text-sky-700',
  'ожидаем банковские параметры': 'bg-sky-100 text-sky-700',
  'параметры получены': 'bg-cyan-100 text-cyan-700',
  'настраиваем сервис': 'bg-cyan-100 text-cyan-700',
  'ожидание боевых платежей': 'bg-indigo-100 text-indigo-700',
  // Yellow-orange — potential issue
  'не открыт ОКВЭД': 'bg-amber-100 text-amber-700',
  'высокая комиссия': 'bg-orange-100 text-orange-700',
  'высокая процентная ставка': 'bg-orange-100 text-orange-700',
  // Red — rejected
  'не актуально': 'bg-red-100 text-red-700',
  'не поддерживаем оборудование': 'bg-rose-100 text-rose-700',
  'нет совместной интеграции': 'bg-red-100 text-red-700',
  'отказ СБ': 'bg-red-100 text-red-800',
  'другая причина': 'bg-stone-100 text-stone-600',
  'Нужна интеграция': 'bg-teal-100 text-teal-700',
}

/** Extended status colors for table badges (includes hover states) */
export const STATUS_TABLE_COLORS: Record<string, string> = {
  'пошли боевые платежи': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'личный кабинет создан': 'bg-teal-100 text-teal-700 hover:bg-teal-100',
  'заключаем договор': 'bg-sky-100 text-sky-700 hover:bg-sky-100',
  'ожидаем банковские параметры': 'bg-sky-100 text-sky-700 hover:bg-sky-100',
  'параметры получены': 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
  'настраиваем сервис': 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
  'ожидание боевых платежей': 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  'не открыт ОКВЭД': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'высокая комиссия': 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  'высокая процентная ставка': 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  'не актуально': 'bg-red-100 text-red-700 hover:bg-red-100',
  'не поддерживаем оборудование': 'bg-rose-100 text-rose-700 hover:bg-rose-100',
  'нет совместной интеграции': 'bg-red-100 text-red-700 hover:bg-red-100',
  'отказ СБ': 'bg-red-100 text-red-800 hover:bg-red-100',
  'другая причина': 'bg-stone-100 text-stone-600 hover:bg-stone-100',
}

/** Zayavka (request status) → Tailwind classes */
export const ZAYAVKA_COLORS: Record<string, string> = {
  'Выполнена': 'bg-emerald-100 text-emerald-800',
  'В работе': 'bg-amber-100 text-amber-800',
  'На паузе': 'bg-orange-100 text-orange-800',
  'Отклонена': 'bg-red-100 text-red-800',
  'Входящий': 'bg-sky-100 text-sky-800',
}

// ─── Rejection statuses ───────────────────────────────────────────────

export const REJECTION_STATUSES = new Set([
  'не актуально',
  'отказ СБ',
  'не поддерживаем оборудование',
  'нет совместной интеграции',
  'высокая комиссия',
  'высокая процентная ставка',
  'другая причина',
])

// ─── Badge components ─────────────────────────────────────────────────

export function StatusBadge({
  status,
  compact = false,
  hover = false,
}: {
  status: string
  compact?: boolean
  hover?: boolean
}) {
  const size = compact ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'
  const colors = hover ? STATUS_TABLE_COLORS[status] || `bg-gray-100 text-gray-600 hover:bg-gray-100`
    : STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'
  return (
    <Badge
      variant="default"
      className={cn(colors, size, 'whitespace-nowrap font-medium border-0')}
    >
      {status}
    </Badge>
  )
}

export function ZayavkaBadge({
  zayavka,
  compact = false,
  hover = false,
}: {
  zayavka: string
  compact?: boolean
  hover?: boolean
}) {
  const size = compact ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'
  const color = ZAYAVKA_COLORS[zayavka]
  if (color) {
    return (
      <Badge
        variant="default"
        className={cn(
          color,
          hover && 'hover:bg-opacity-80',
          size,
          'whitespace-nowrap font-medium border-0',
        )}
      >
        {zayavka}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className={cn(size, 'whitespace-nowrap font-medium')}>
      {zayavka}
    </Badge>
  )
}

// ─── SLA helpers ──────────────────────────────────────────────────────

export function getSlaDays(updatedAt: string | null | undefined): number {
  if (!updatedAt) return 0
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
}

export function getSlaColorClass(days: number): string {
  if (days > 7) return 'text-red-600'
  if (days >= 4) return 'text-amber-600'
  return 'text-emerald-600'
}

export function getSlaTitle(updatedAt: string | null | undefined): string {
  if (!updatedAt) return ''
  return new Date(updatedAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Lead meta helpers ────────────────────────────────────────────────

export function isNewLead(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  return (Date.now() - new Date(createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000
}

export function getZayavkaRowClass(zayavka: string): string {
  switch (zayavka) {
    case 'Входящий':
    case 'Звонок': return 'border-l-sky-400 hover:bg-sky-50/30'
    case 'В работе': return 'border-l-teal-400 hover:bg-teal-50/20'
    case 'На паузе': return 'border-l-orange-400 bg-orange-50/40 hover:bg-orange-50/70'
    case 'Отклонена': return 'border-l-red-300 bg-red-50/25 opacity-75 hover:opacity-100'
    default: return 'border-l-border hover:bg-muted/30'
  }
}

// ─── Lead priority for sorting ────────────────────────────────────────

export function getLeadPriority(lead: Lead): number {
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
  const statusPriority = lead.status ? (statusOrder[lead.status] ?? 50) : 50
  const zayavkaPriority = zayavkaOrder[lead.zayavka] ?? 0
  return zayavkaPriority + statusPriority
}
