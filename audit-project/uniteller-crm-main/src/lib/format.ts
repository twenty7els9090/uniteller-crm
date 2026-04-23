// ─── Shared formatting utilities ───────────────────────────────────────

/** Format number as currency: 1500000 → "1.500.000 Р" */
export function formatCurrency(value: string | number | undefined | null): string {
  if (!value && value !== 0) return '—'
  const num =
    typeof value === 'string'
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

/** Format date as "20 апр" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

/** Relative time: "Сегодня", "Вчера", "3д назад", "20 апр" */
export function getRelativeTime(dateStr: string): string {
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
