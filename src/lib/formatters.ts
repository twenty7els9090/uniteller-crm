/**
 * Форматирует числовое значение как валюту (рубли)
 * Примеры:
 *  - 1500000 → "1.500.000 Р"
 *  - 1500.5 → "1.500,5 Р"
 *  - 0 → "0 Р"
 *  - null/undefined → "—"
 */
export function formatCurrency(value: string | number | undefined | null): string {
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

/**
 * Форматирует дату в формате "15 янв."
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Форматирует дату для отображения в tooltip
 */
export function formatDateTooltip(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
}
