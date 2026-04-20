import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/** Parse a Russian-formatted currency string like "1 500 000 Р" to a number */
function parseCurrency(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[^\d.,]/g, '').replace(/\s/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // VTB users only see their partner's data
    const partnerFilter = user.role === 'vtb' ? { partner: 'ВТБ' } : {}
    const isVTB = user.role === 'vtb'

    // ─── Parallel DB queries ───
    const [
      totalLeads,
      completedLeads,
      inProgressLeads,
      onHoldLeads,
      rejectedLeads,
      leadsByPartner,
      leadsByZayavka,
      rejectedByReason,
      combatLeads,
      // Churns are uniteller-only — VTB gets empty array
      churns,
      allLeads,
    ] = await Promise.all([
      db.lead.count({ where: partnerFilter }),
      db.lead.count({ where: { ...partnerFilter, zayavka: 'Выполнена' } }),
      db.lead.count({ where: { ...partnerFilter, zayavka: 'В работе' } }),
      db.lead.count({ where: { ...partnerFilter, zayavka: 'На паузе' } }),
      db.lead.count({ where: { ...partnerFilter, zayavka: 'Отклонена' } }),
      db.lead.groupBy({
        by: ['partner'],
        where: partnerFilter,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      db.lead.groupBy({
        by: ['zayavka'],
        where: partnerFilter,
        _count: { id: true },
      }),
      db.lead.groupBy({
        by: ['status'],
        where: { ...partnerFilter, zayavka: 'Отклонена', status: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      db.lead.findMany({
        where: { ...partnerFilter, status: 'пошли боевые платежи' },
      }),
      // VTB users must NOT see churn data (no partner field on Churn model)
      isVTB ? Promise.resolve([]) : db.churn.findMany(),
      db.lead.findMany({
        where: partnerFilter,
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // ─── Combat Leads ───
    const totalCombatLeads = combatLeads.length
    const combatLeadsTurnover = combatLeads.reduce((s, l) => s + parseCurrency(l.turnoverTsp), 0)
    const combatLeadsRevenue = combatLeads.reduce((s, l) => s + parseCurrency(l.revenue), 0)
    const combatCompletedLeads = combatLeads.filter((l) => l.zayavka === 'Выполнена').length

    // ─── Churn (Оттоки) ───
    const totalChurns = churns.length
    const churnsTurnover = churns.reduce((s, c) => s + parseCurrency(c.turnoverTsp), 0)
    const churnsRevenue = churns.reduce((s, c) => s + parseCurrency(c.revenue), 0)

    const now = new Date()
    const weekData: { week: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i + 1) * 7)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - i * 7)
      weekEnd.setHours(0, 0, 0, 0)

      const count = allLeads.filter((l) => {
        const d = new Date(l.createdAt)
        return d >= weekStart && d < weekEnd
      }).length

      const day = weekStart.getDate()
      const month = weekStart.toLocaleString('ru-RU', { month: 'short' })
      weekData.push({ week: `${day} ${month}`, count })
    }

    // ─── Top Organizations by Turnover (from combat leads) ───
    const topOrgs = combatLeads
      .filter((l) => parseCurrency(l.turnoverTsp) > 0)
      .map((l) => ({
        organization: l.organization,
        turnover: parseCurrency(l.turnoverTsp),
        revenue: parseCurrency(l.revenue),
        zayavka: l.zayavka,
      }))
      .sort((a, b) => b.turnover - a.turnover)
      .slice(0, 10)

    return NextResponse.json({
      totalLeads,
      completedLeads,
      inProgressLeads,
      onHoldLeads,
      rejectedLeads,
      leadsByPartner,
      leadsByZayavka,
      rejectedByReason: rejectedByReason.map((r) => ({ name: r.status, count: r._count.id })),
      // Combat leads
      totalCombatLeads,
      combatLeadsTurnover,
      combatLeadsRevenue,
      combatCompletedLeads,
      // Churn
      totalChurns,
      churnsTurnover,
      churnsRevenue,
      // Lead dynamics
      leadDynamics: weekData,
      // Top orgs
      topOrgs,
    })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
