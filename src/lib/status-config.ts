/**
 * Цвета статусов для бейджей (детальные статусы)
 */
export const STATUS_COLORS: Record<string, string> = {
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

/**
 * Цвета статусов заявки
 */
export function getZayavkaColor(zayavka: string): string {
  switch (zayavka) {
    case 'Выполнена':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
    case 'В работе':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
    case 'На паузе':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100'
    case 'Отклонена':
      return 'bg-red-100 text-red-800 hover:bg-red-100'
    case 'Звонок':
      return 'bg-sky-100 text-sky-800 hover:bg-sky-100'
    default:
      return 'bg-gray-100 text-gray-600 hover:bg-gray-100'
  }
}

/**
 * Классы для строк таблицы в зависимости от статуса заявки
 */
export function getRowClass(zayavka: string): string {
  switch (zayavka) {
    case 'На паузе': return 'bg-orange-50/70 hover:bg-orange-50'
    case 'Отклонена': return 'bg-red-50/50 hover:bg-red-50/80 opacity-80'
    case 'В работе': return 'hover:bg-teal-50/40'
    default: return ''
  }
}

/**
 * Левый бордер для строки таблицы
 */
export function getRowLeftBorder(zayavka: string): string {
  switch (zayavka) {
    case 'В работе': return 'border-l-[3px] border-l-teal-400'
    case 'На паузе': return 'border-l-[3px] border-l-orange-400'
    case 'Отклонена': return 'border-l-[3px] border-l-red-300'
    default: return 'border-l-[3px] border-l-transparent'
  }
}

/**
 * SLA таймер: количество дней с последнего обновления
 */
export function getSlaDays(updatedAt: string | null | undefined): number {
  if (!updatedAt) return 0
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * SLA таймер: цвет текста в зависимости от количества дней
 */
export function getSlaColorClass(days: number): string {
  if (days > 7) return 'text-red-600'
  if (days >= 4) return 'text-amber-600'
  return 'text-emerald-600'
}

/**
 * Проверка: новый ли лид (создан менее 2 дней назад)
 */
export function isNewLead(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  return (Date.now() - new Date(createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000
}

/**
 * Статусы отклонения для фильтрации
 */
export const REJECTION_STATUSES = new Set([
  'не актуально',
  'отказ СБ',
  'не поддерживаем оборудование',
  'нет совместной интеграции',
  'высокая комиссия',
  'высокая процентная ставка',
  'другая причина',
])
