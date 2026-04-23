'use client'

import { motion } from 'framer-motion'
import { useStats } from '@/hooks/use-stats'
import { Loader2, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { scaleIn } from '@/lib/motion'

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace(/,/g, '.')
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + ' Р'
}

export function TopOrganizations() {
  const { stats, loading } = useStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
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
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                i === 0
                  ? 'bg-amber-100 text-amber-700'
                  : i === 1
                    ? 'bg-slate-100 text-slate-600'
                    : i === 2
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{org.organization}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{formatCurrency(org.turnover)}</span>
                  <span>Выручка: {formatCurrency(org.revenue)}</span>
                </div>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                org.zayavka === 'Выполнена'
                  ? 'bg-emerald-100 text-emerald-700'
                  : org.zayavka === 'В работе'
                    ? 'bg-yellow-100 text-yellow-700'
                    : org.zayavka === 'Отклонена'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-muted text-muted-foreground'
              }`}>
                {org.zayavka}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-xs font-medium text-muted-foreground w-8">#</th>
                <th className="text-left py-2 pr-3 text-xs font-medium text-muted-foreground">Организация</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Оборот ТСП</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Выручка</th>
                <th className="text-center py-2 pl-3 text-xs font-medium text-muted-foreground w-20">Статус</th>
              </tr>
            </thead>
            <tbody>
              {stats.topOrgs.map((org, i) => (
                <tr
                  key={org.organization + i}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2.5 pr-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      i === 0
                        ? 'bg-amber-100 text-amber-700'
                        : i === 1
                          ? 'bg-slate-100 text-slate-600'
                          : i === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-foreground max-w-[200px] truncate">{org.organization}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{formatCurrency(org.turnover)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-foreground">{formatCurrency(org.revenue)}</td>
                  <td className="py-2.5 pl-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      org.zayavka === 'Выполнена'
                        ? 'bg-emerald-100 text-emerald-700'
                        : org.zayavka === 'В работе'
                          ? 'bg-yellow-100 text-yellow-700'
                          : org.zayavka === 'Отклонена'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-muted text-muted-foreground'
                    }`}>
                      {org.zayavka}
                    </span>
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
