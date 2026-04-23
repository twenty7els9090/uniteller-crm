import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Lead } from '@/lib/types'

// ─── Status color maps ────────────────────────────────────────────────

/** Detailed status → pill color config */
const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string; ring: string }> = {
  // Gray — not started
  'Не начато': { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200' },
  'Не звонили': { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200' },
  // Green — success/progress
  'Звонок выполнен': { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  'пошли боевые платежи': { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  'личный кабинет создан': { dot: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200' },
  // Amber — pending
  'Перезвонить': { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  'ожидание боевых платежей': { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200' },
  // Sky — in progress
  'заключаем договор': { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
  'ожидаем банковские параметры': { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
  'параметры получены': { dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-200' },
  'настраиваем сервис': { dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-200' },
  // Orange — issues
  'не открыт ОКВЭД': { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  'высокая комиссия': { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
  'высокая процентная ставка': { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
  // Red — rejected
  'Отказался': { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  'не актуально': { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  'не поддерживаем оборудование': { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
  'нет совместной интеграции': { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  'отказ СБ': { dot: 'bg-red-600', bg: 'bg-red-50', text: 'text-red-800', ring: 'ring-red-200' },
  'другая причина': { dot: 'bg-stone-400', bg: 'bg-stone-50', text: 'text-stone-600', ring: 'ring-stone-200' },
  'Нужна интеграция': { dot: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200' },
}

/** Zayavka (request status) → pill color config */
const ZAYAVKA_STYLES: Record<string, { dot: string; bg: string; text: string; ring: string }> = {
  'Выполнена': { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', ring: 'ring-emerald-200' },
  'В работе': { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', ring: 'ring-amber-200' },
  'На паузе': { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-800', ring: 'ring-orange-200' },
  'Отклонена': { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-800', ring: 'ring-red-200' },
  'Входящий': { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-800', ring: 'ring-sky-200' },
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

// ─── Pill Badge components ────────────────────────────────────────────

export function StatusBadge({
  status,
  compact = false,
}: {
  status: string
  compact?: boolean
  hover?: boolean
}) {
  const styles = STATUS_STYLES[status]
  const size = compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5'

  if (styles) {
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full whitespace-nowrap border-0 ring-1 ring-inset transition-all',
          styles.bg, styles.text, styles.ring, size,
        )}
      >
        <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5 -translate-y-px', styles.dot)} />
        {status}
      </span>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={cn(size, 'whitespace-nowrap font-medium rounded-full')}
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
  const styles = ZAYAVKA_STYLES[zayavka]
  const size = compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5'

  if (styles) {
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-full whitespace-nowrap border-0 ring-1 ring-inset transition-all',
          styles.bg, styles.text, styles.ring, size,
          hover && 'hover:brightness-95 cursor-default',
        )}
      >
        <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5 -translate-y-px', styles.dot)} />
        {zayavka}
      </span>
    )
  }

  return (
    <Badge variant="secondary" className={cn(size, 'whitespace-nowrap font-medium rounded-full')}>
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
  if (days > 7) return 'text-red-500'
  if (days >= 4) return 'text-amber-500'
  return 'text-emerald-500'
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
    case 'В работе': return 'border-l-teal-400 hover:bg-teal-50/30'
    case 'На паузе': return 'border-l-orange-400 bg-orange-50/20 hover:bg-orange-50/40'
    case 'Отклонена': return 'border-l-red-300 bg-red-50/10 opacity-70 hover:opacity-100'
    default: return 'border-l-slate-200 hover:bg-slate-50/60'
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
