import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { Lead } from '@/lib/types'

// ─── Semantic color groups ─────────────────────────────────────────────
// Все статусы маппятся на 5 семантических групп: success / progress / wait / warn / danger / neutral

type ColorGroup = 'success' | 'progress' | 'wait' | 'warn' | 'danger' | 'neutral'

const STATUS_GROUP: Record<string, ColorGroup> = {
  // Входящие
  'Не начато':        'neutral',
  'Не звонили':       'neutral',
  'Звонок выполнен':  'success',
  'Перезвонить':      'wait',
  'Отказался':        'danger',
  'Нужна интеграция': 'progress',
  // Воронка
  'пошли боевые платежи':        'success',
  'личный кабинет создан':       'success',
  'заключаем договор':           'progress',
  'ожидаем банковские параметры':'progress',
  'параметры получены':          'progress',
  'настраиваем сервис':          'progress',
  'ожидание боевых платежей':    'wait',
  // Проблемы
  'не открыт ОКВЭД':             'wait',
  'высокая комиссия':            'warn',
  'высокая процентная ставка':   'warn',
  // Отказы
  'не актуально':                'danger',
  'не поддерживаем оборудование':'danger',
  'нет совместной интеграции':   'danger',
  'отказ СБ':                    'danger',
  'другая причина':              'neutral',
}

const ZAYAVKA_GROUP: Record<string, ColorGroup> = {
  'Выполнена': 'success',
  'В работе':  'progress',
  'На паузе':  'warn',
  'Отклонена': 'danger',
  'Входящий':  'neutral',
}

const GROUP_CLASSES: Record<ColorGroup, string> = {
  success:  'bg-emerald-50  text-emerald-700  border-emerald-200/80',
  progress: 'bg-sky-50      text-sky-700      border-sky-200/80',
  wait:     'bg-amber-50    text-amber-700    border-amber-200/80',
  warn:     'bg-orange-50   text-orange-700   border-orange-200/80',
  danger:   'bg-red-50      text-red-700      border-red-200/80',
  neutral:  'bg-stone-50    text-stone-600    border-stone-200/80',
}

const GROUP_DOT: Record<ColorGroup, string> = {
  success:  'bg-emerald-500',
  progress: 'bg-sky-500',
  wait:     'bg-amber-500',
  warn:     'bg-orange-500',
  danger:   'bg-red-500',
  neutral:  'bg-stone-400',
}

// ─── Badge components ──────────────────────────────────────────────────

export function StatusBadge({ status, compact = false }: { status: string; compact?: boolean; hover?: boolean }) {
  const group = STATUS_GROUP[status] ?? 'neutral'
  const classes = GROUP_CLASSES[group]
  const size = compact ? 'text-[11px] px-1.5 py-0 h-[18px]' : 'text-xs px-2 py-0.5'
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap',
      classes, size,
    )}>
      <span className={cn('inline-block w-1.5 h-1.5 rounded-full shrink-0', GROUP_DOT[group])} />
      {status}
    </span>
  )
}

export function ZayavkaBadge({ zayavka, compact = false, hover = false }: { zayavka: string; compact?: boolean; hover?: boolean }) {
  const group = ZAYAVKA_GROUP[zayavka]
  const size = compact ? 'text-[11px] px-1.5 py-0 h-[18px]' : 'text-xs px-2 py-0.5'
  if (group) {
    const classes = GROUP_CLASSES[group]
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap',
        classes, size,
        hover && 'cursor-pointer',
      )}>
        {zayavka}
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center rounded-md border border-border bg-muted text-muted-foreground font-medium whitespace-nowrap', size)}>
      {zayavka}
    </span>
  )
}

// ─── Rejection set ─────────────────────────────────────────────────────

export const REJECTION_STATUSES = new Set([
  'не актуально', 'отказ СБ', 'не поддерживаем оборудование',
  'нет совместной интеграции', 'высокая комиссия', 'высокая процентная ставка', 'другая причина',
])

// ─── SLA helpers ───────────────────────────────────────────────────────

export function getSlaDays(updatedAt: string | null | undefined): number {
  if (!updatedAt) return 0
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
}

export function getSlaBadgeClass(days: number): string {
  if (days > 7) return 'bg-red-100 text-red-700 border-red-200/80'
  if (days >= 4) return 'bg-amber-100 text-amber-700 border-amber-200/80'
  return 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
}

export function getSlaColorClass(days: number): string {
  if (days > 7) return 'text-red-600'
  if (days >= 4) return 'text-amber-600'
  return 'text-emerald-600'
}

export function getSlaTitle(updatedAt: string | null | undefined): string {
  if (!updatedAt) return ''
  return new Date(updatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Lead meta ─────────────────────────────────────────────────────────

export function isNewLead(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  return (Date.now() - new Date(createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000
}

export function getZayavkaRowClass(zayavka: string): string {
  switch (zayavka) {
    case 'Входящий':
    case 'Звонок': return 'border-l-sky-400 hover:bg-sky-50/20'
    case 'В работе': return 'border-l-teal-400 hover:bg-teal-50/20'
    case 'На паузе': return 'border-l-amber-400 bg-amber-50/25 hover:bg-amber-50/40'
    case 'Отклонена': return 'border-l-red-300 bg-red-50/15 opacity-70 hover:opacity-100'
    default: return 'border-l-border hover:bg-muted/30'
  }
}

// ─── Lead priority ─────────────────────────────────────────────────────

export function getLeadPriority(lead: Lead): number {
  const statusOrder: Record<string, number> = {
    'ожидание боевых платежей': 0, 'настраиваем сервис': 1,
    'ожидаем банковские параметры': 2, 'заключаем договор': 3,
    'не открыт ОКВЭД': 4, 'личный кабинет создан': 5,
    'параметры получены': 6, 'высокая процентная ставка': 6,
    'высокая комиссия': 7, 'не актуально': 8,
    'не поддерживаем оборудование': 9, 'нет совместной интеграции': 10, 'отказ СБ': 11,
  }
  const zayavkaOrder: Record<string, number> = { 'На паузе': 100, 'Отклонена': 200 }
  const statusPriority = lead.status ? (statusOrder[lead.status] ?? 50) : 50
  const zayavkaPriority = zayavkaOrder[lead.zayavka] ?? 0
  return zayavkaPriority + statusPriority
}
