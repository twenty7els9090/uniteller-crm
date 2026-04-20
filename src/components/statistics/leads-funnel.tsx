'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Funnel, BarChart3, PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const STAGES = [
  { key: 'В работе', color: 'bg-amber-100 text-amber-800 border-amber-200', barColor: 'bg-amber-400', fill: '#f59e0b' },
  { key: 'На паузе', color: 'bg-orange-100 text-orange-800 border-orange-200', barColor: 'bg-orange-400', fill: '#f97316' },
  { key: 'Выполнена', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', barColor: 'bg-emerald-500', fill: '#10b981' },
  { key: 'Отклонена', color: 'bg-red-100 text-red-800 border-red-200', barColor: 'bg-red-400', fill: '#ef4444' },
] as const

const PERIODS = [
  { key: '7d', label: '7д' },
  { key: '30d', label: '30д' },
  { key: '90d', label: '90д' },
  { key: 'all', label: 'Всё' },
] as const

type PeriodKey = (typeof PERIODS)[number]['key']

interface LeadRow {
  id: string
  organization: string
  partner: string
  zayavka: string
  status: string | null
  manager: string
  createdAt: string
}

function getPeriodCutoff(period: PeriodKey): Date | null {
  if (period === 'all') return null
  const now = new Date()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return cutoff
}

export function LeadsFunnel() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [partnerFilter, setPartnerFilter] = useState<string>('')
  const [period, setPeriod] = useState<PeriodKey>('all')
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar')

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => { if (r.ok) return r.json(); throw new Error() })
      .then((data) => setLeads(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const partners = useMemo(() => {
    const set = new Set(leads.map((l) => l.partner))
    return Array.from(set).sort()
  }, [leads])

  const filteredLeads = useMemo(() => {
    let result = leads
    if (partnerFilter) {
      result = result.filter((l) => l.partner === partnerFilter)
    }
    const cutoff = getPeriodCutoff(period)
    if (cutoff) {
      result = result.filter((l) => {
        const created = l.createdAt ? new Date(l.createdAt) : null
        return created && created >= cutoff
      })
    }
    return result
  }, [leads, partnerFilter, period])

  const funnel = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const stage of STAGES) {
      counts[stage.key] = filteredLeads.filter((l) => l.zayavka === stage.key).length
    }

    const total = filteredLeads.length || 1

    return STAGES.map((stage) => ({
      ...stage,
      count: counts[stage.key],
      pct: Math.round((counts[stage.key] / total) * 100),
    }))
  }, [filteredLeads])

  const pieData = useMemo(() =>
    funnel.filter((s) => s.count > 0).map((s) => ({
      name: s.key,
      value: s.count,
      fill: s.fill,
    })),
    [funnel]
  )

  const maxCount = Math.max(...funnel.map((s) => s.count), 1)

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Funnel className="h-4 w-4" />
            Воронка лидов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Funnel className="h-4 w-4" />
              Воронка лидов
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View toggle */}
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <button
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'bar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setViewMode('bar')}
                  title="Столбцы"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </button>
                <button
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'pie' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setViewMode('pie')}
                  title="Круговая"
                >
                  <PieChartIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Period filters */}
              <div className="flex items-center gap-1.5">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      period === p.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-accent'
                    )}
                    onClick={() => setPeriod(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Partner filters */}
          {partners.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                className={cn(
                  'text-xs px-2 py-1 rounded-full border transition-colors',
                  !partnerFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-accent'
                )}
                onClick={() => setPartnerFilter('')}
              >
                Все партнёры
              </button>
              {partners.map((p) => (
                <button
                  key={p}
                  className={cn(
                    'text-xs px-2 py-1 rounded-full border transition-colors',
                    partnerFilter === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-accent'
                  )}
                  onClick={() => setPartnerFilter(partnerFilter === p ? '' : p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {viewMode === 'bar' ? (
          <>
            {/* Funnel bars with conversion indicators */}
            {funnel.map((stage, idx) => (
              <div key={stage.key}>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className={cn('text-xs font-medium', stage.color)}>
                      {stage.key}
                    </Badge>
                    <span className="font-semibold tabular-nums">
                      {stage.count}
                      <span className="text-muted-foreground font-normal ml-1">({stage.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', stage.barColor)}
                      style={{ width: `${maxCount ? (stage.count / maxCount) * 100 : 0}%`, minWidth: stage.count > 0 ? '4px' : '0px' }}
                    />
                  </div>
                </div>
                {/* Conversion rate to next stage */}
                {idx < funnel.length - 1 && stage.count > 0 && (
                  <div className="flex items-center justify-center py-1">
                    <span className="text-[11px] text-muted-foreground/70">
                      ↓ {funnel[idx + 1].key}:&nbsp;
                      <span className="font-medium text-muted-foreground">
                        {Math.round((funnel[idx + 1].count / stage.count) * 100)}%
                      </span>
                      <span className="ml-0.5">конверсия</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Pie chart */}
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} шт.`, 'Количество']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <p className="text-[11px] text-muted-foreground/70 pt-1">
          Всего лидов: {filteredLeads.length}
          {partnerFilter && ` · ${partnerFilter}`}
          {period !== 'all' && (
            <>
              {' · '}
              {PERIODS.find((p) => p.key === period)?.label}
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
