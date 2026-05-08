import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/** Parse a Russian-formatted currency string like "1 500 000 Р" to a number */
function parseCurrency(val: string | null): number {
  if (!val) return 0
  const cleaned = val.replace(/[^\d.,]/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // ─── Churn (Оттоки) ───
    const churns = await db.churn.findMany()

    const totalChurns = churns.length
    const churnsTurnover = churns.reduce((s, c) => s + parseCurrency(c.turnoverTsp), 0)
    const churnsRevenue = churns.reduce((s, c) => s + parseCurrency(c.revenue), 0)

    return NextResponse.json({
      totalChurns,
      churnsTurnover,
      churnsRevenue,
    })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
