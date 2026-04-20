'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadRow {
  id: string
  createdAt: string
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

// Color scale: 0 → transparent, max → strong teal
function getCellColor(count: number, max: number): string {
  if (count === 0) return 'bg-muted/30'
  const intensity = count / max
  if (intensity > 0.75) return 'bg-primary/90 text-primary-foreground'
  if (intensity > 0.5) return 'bg-primary/70 text-primary-foreground'
  if (intensity > 0.25) return 'bg-primary/50'
  if (intensity > 0.1) return 'bg-primary/30'
  return 'bg-primary/15'
}

export function LeadHeatmap() {
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setLeads(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Build heatmap matrix reactively via useMemo
  const heatmap = useMemo(() => {
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    for (const lead of leads) {
      const d = new Date(lead.createdAt)
      // getDay(): 0=Sun, 1=Mon, ..., 6=Sat → convert to Mon=0, Tue=1, ..., Sun=6
      const dayIdx = (d.getDay() + 6) % 7
      const hour = d.getHours()
      matrix[dayIdx][hour]++
    }
    return matrix
  }, [leads])

  const maxCount = Math.max(...heatmap.flat(), 1)

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Активность по времени
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Flame className="h-4 w-4" />
          Активность по времени
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Распределение создания лидов по дням недели и часам
        </p>
      </CardHeader>
      <CardContent>
        {/* Mobile: just show top hours */}
        <div className="md:hidden space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Самые активные часы:</p>
          {(() => {
            const hourTotals = HOURS.map(h => ({
              hour: h,
              total: heatmap.reduce((s, row) => s + row[h], 0)
            })).sort((a, b) => b.total - a.total).slice(0, 5)
            return hourTotals.map(({ hour, total }) => (
              <div key={hour} className="flex items-center justify-between text-sm">
                <span>{hour.toString().padStart(2, '0')}:00</span>
                <span className="font-medium">{total} лидов</span>
              </div>
            ))
          })()}
        </div>

        {/* Desktop: full heatmap */}
        <div className="hidden md:block">
          {/* Hour headers */}
          <div className="flex items-center mb-1 ml-10">
            {HOURS.map(h => (
              <div key={h} className="w-[30px] text-center text-[10px] text-muted-foreground">
                {h % 3 === 0 ? `${h}` : ''}
              </div>
            ))}
          </div>

          {/* Rows: day label + 24 cells */}
          {DAYS.map((day, dIdx) => (
            <div key={day} className="flex items-center">
              <div className="w-10 text-xs text-muted-foreground font-medium text-right pr-2 shrink-0">
                {day}
              </div>
              {HOURS.map(h => {
                const count = heatmap[dIdx][h]
                return (
                  <div
                    key={h}
                    className={cn(
                      'w-[30px] h-[28px] rounded-sm flex items-center justify-center text-[10px] font-medium transition-colors cursor-default',
                      getCellColor(count, maxCount)
                    )}
                    title={`${day} ${h}:00 — ${count} лидов`}
                  >
                    {count > 0 && count}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 ml-10">
            <span className="text-[10px] text-muted-foreground">Меньше</span>
            <div className="w-4 h-3 rounded-sm bg-muted/30" />
            <div className="w-4 h-3 rounded-sm bg-primary/15" />
            <div className="w-4 h-3 rounded-sm bg-primary/30" />
            <div className="w-4 h-3 rounded-sm bg-primary/50" />
            <div className="w-4 h-3 rounded-sm bg-primary/70" />
            <div className="w-4 h-3 rounded-sm bg-primary/90" />
            <span className="text-[10px] text-muted-foreground">Больше</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
