'use client'

import { motion } from 'framer-motion'
import {
  TrendingDown,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStats } from '@/hooks/use-stats'
import { scaleIn, slideUp, staggerContainer } from '@/lib/motion'
import { formatCurrency } from '@/lib/format'

// ─── KPI Card ────────────────────────────────────────────────────
interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
  accentColor: string
}

function KpiCard({ label, value, icon, iconBg, accentColor }: KpiCardProps) {
  return (
    <motion.div variants={scaleIn} className="group">
      <Card className="hover:shadow-md transition-shadow duration-200 border border-slate-200/80 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <span className="text-[13px] font-medium text-slate-500 tracking-wide uppercase">
              {label}
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} transition-transform duration-200 group-hover:scale-110`}
            >
              {icon}
            </div>
          </div>
          <span
            className="text-3xl font-bold tracking-tight text-slate-900"
            style={{ fontFeatureSettings: '"tnum"', color: accentColor === '#EEEFF4' ? undefined : accentColor }}
          >
            {value}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Skeletons ───────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <Card className="border border-slate-200/80 bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="h-3.5 w-24 bg-slate-100 rounded-md animate-pulse" />
          <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-slate-100 rounded-lg animate-pulse" />
      </CardContent>
    </Card>
  )
}

// ─── Main Statistics Page ────────────────────────────────────────
export function StatisticsCharts() {
  const { stats, loading } = useStats()

  const totalChurns = stats?.totalChurns ?? 0
  const churnsTurnover = stats?.churnsTurnover ?? 0
  const churnsRevenue = stats?.churnsRevenue ?? 0

  return (
    <div className="space-y-6">
      {/* ─── Header ───────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Статистика</h1>
        <p className="text-sm text-slate-500 mt-1">Обзор ключевых показателей и аналитика</p>
      </div>

      {/* ─── KPI Cards ────────────────────────────────────── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
        ) : (
          <>
            <KpiCard
              label="Оттоки"
              value={totalChurns}
              icon={<TrendingDown className="w-5 h-5 text-red-500" />}
              iconBg="bg-red-50"
              accentColor="#EF4444"
            />
            <KpiCard
              label="Оборот (оттоки)"
              value={formatCurrency(churnsTurnover)}
              icon={<ArrowDownRight className="w-5 h-5 text-amber-500" />}
              iconBg="bg-amber-50"
              accentColor="#F59E0B"
            />
            <KpiCard
              label="Потерянная выручка"
              value={formatCurrency(churnsRevenue)}
              icon={<ArrowDownRight className="w-5 h-5 text-slate-500" />}
              iconBg="bg-slate-100"
              accentColor="#64748B"
            />
          </>
        )}
      </motion.div>

      {/* ─── Empty State ──────────────────────────────────── */}
      {!loading && totalChurns === 0 && (
        <motion.div variants={slideUp} initial="hidden" animate="visible">
          <Card className="border border-slate-200/80 bg-white">
            <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin opacity-30" />
              <p className="text-sm">Данных пока нет</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
