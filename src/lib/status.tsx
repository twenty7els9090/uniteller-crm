import { cn } from '@/lib/utils'
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
  success:  'bg-emerald-500/10  text-emerald-400  border-emerald-500/20',
  progress: 'bg-cyan-500/10     text-cyan-400     border-cyan-500/20',
  wait:     'bg-amber-500/10   text-amber-400    border-amber-500/20',
  warn:     'bg-orange-500/10  text-orange-400   border-orange-500/20',
  danger:   'bg-red-500/10     text-red-400      border-red-500/20',
  neutral:  'bg-slate-100    text-zinc-400     border-slate-200/80',
}

const GROUP_DOT: Record<ColorGroup, string> = {
  success:  'bg-emerald-400',
  progress: 'bg-cyan-400',
  wait:     'bg-amber-400',
  warn:     'bg-orange-400',
  danger:   'bg-red-400',
  neutral:  'bg-zinc-500',
}

// ─── Badge components ──────────────────────────────────────────────────

export function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const group = STATUS_GROUP[status] ?? 'neutral'
  const classes = GROUP_CLASSES[group]
  const size = compact ? 'text-[11px] px-1.5 py-0 h-[18px]' : 'text-xs px-2 py-0.5'
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap bg-slate-50',
      classes, size,
    )}>
      <span className={cn('inline-block w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_4px_currentColor]', GROUP_DOT[group])} />
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
        'inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap bg-slate-50',
        classes, size,
        hover && 'cursor-pointer',
      )}>
        {zayavka}
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center rounded-md border bg-slate-100 border-slate-200/80 text-zinc-400 font-medium whitespace-nowrap', size)}>
      {zayavka}
    </span>
  )
}

// ─── Lead meta ─────────────────────────────────────────────────────────

export function isNewLead(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  return (Date.now() - new Date(createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000
}

export function getZayavkaRowClass(zayavka: string): string {
  switch (zayavka) {
    case 'Входящий': return 'border-l-cyan-400 hover:bg-cyan-500/[0.03]'
    case 'В работе': return 'border-l-teal-400 hover:bg-teal-500/[0.03]'
    case 'На паузе': return 'border-l-amber-400 bg-amber-500/[0.04] hover:bg-amber-500/[0.07]'
    case 'Отклонена': return 'border-l-red-400 bg-red-500/[0.03] opacity-70 hover:opacity-100'
    default: return 'border-l-border hover:bg-slate-50'
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
