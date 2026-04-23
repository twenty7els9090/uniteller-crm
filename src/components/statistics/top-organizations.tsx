'use client'

import { motion } from 'framer-motion'
import { useStats } from '@/hooks/use-stats'
import { Loader2, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { scaleIn } from '@/lib/motion'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const MEDAL_STYLES = [
  'bg-amber-100/80 text-amber-700 ring-1 ring-amber-200/50',
  'bg-slate-100/80 text-slate-600 ring-1 ring-slate-200/50',
  'bg-orange-100/80 text-orange-700 ring-1 ring-orange-200/50',
]

const STATUS_DOT_COLORS: Record<string, string> = {
  'Выполнена': 'bg-emerald-500',
  'В работе': 'bg-yellow-500',
  'Отклонена': 'bg-red-500',
  'На паузе': 'bg-orange-500',
}

const STATUS_TEXT_COLORS: Record<string, string> = {
  'Выполнена': 'text-emerald-700',
  'В работе': 'text-yellow-700',
  'Отклонена': 'text-red-700',
  'На паузе': 'text-orange-700',
}

function StatusBadge({ status }: { status: string }) {
  const dotColor = STATUS_DOT_COLORS[status] || 'bg-muted-foreground'
  const textColor = STATUS_TEXT_COLORS[status] || 'text-muted-foreground'

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', textColor)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      {status}
    </span>
  )
}

export function TopOrganizations() {
  const { stats, loading } = useStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground opacity-20" />
      </div>
    )
  }

  if (!stats || stats.topOrgs.length === 0) return null

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
    >
    <Card className="card-elevated border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <span className="bg-amber-100/60 rounded-lg p-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
          </span>
          <CardTitle className="text-base font-semibold">Топ организаций по обороту</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground/70">
          Боевые лиды, отсортированные по обороту ТСП
        </p>
      </CardHeader>
      <CardContent>
        {/* Mobile card view */}
        <div className="md:hidden space-y-0">
          {stats.topOrgs.map((org, i) => (
            <div key={org.organization + i} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
              <span className={cn(
                'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                i < 3 ? MEDAL_STYLES[i] : 'bg-muted text-muted-foreground'
              )}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{org.organization}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{formatCurrency(org.turnover)}</span>
                  <span>Выручка: {formatCurrency(org.revenue)}</span>
                </div>
              </div>
              <StatusBadge status={org.zayavka} />
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-xs font-medium text-slate-400 w-8">#</th>
                <th className="text-left py-2 pr-3 text-xs font-medium text-slate-400">Организация</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Оборот ТСП</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">Выручка</th>
                <th className="text-center py-2 pl-3 text-xs font-medium text-slate-400 w-20">Статус</th>
              </tr>
            </thead>
            <tbody>
              {stats.topOrgs.map((org, i) => (
                <tr
                  key={org.organization + i}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-2.5 pr-3">
                    <span className={cn(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                      i < 3 ? MEDAL_STYLES[i] : 'bg-muted text-muted-foreground'
                    )}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-foreground max-w-[200px] truncate">{org.organization}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-teal-600">{formatCurrency(org.turnover)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-foreground">{formatCurrency(org.revenue)}</td>
                  <td className="py-2.5 pl-3 text-center">
                    <StatusBadge status={org.zayavka} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  )
}
