'use client'

import { motion } from 'framer-motion'
import { Loader2, Users, Swords, TrendingDown, Briefcase, Pause, XCircle } from 'lucide-react'
import { useStats } from '@/hooks/use-stats'
import { staggerContainer, scaleIn } from '@/lib/motion'

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' млрд'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' млн'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + ' тыс'
  return String(n)
}

interface KPICardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  bg: string
  iconBg: string
  iconColor: string
  accent?: string
}

function KPICard({ label, value, sub, icon, bg, iconBg, iconColor, accent }: KPICardProps) {
  return (
    <motion.div
      variants={scaleIn}
      className={`relative rounded-2xl ${bg} border border-black/[0.04] p-4 md:p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div className="space-y-0.5">
        <div className={`text-3xl font-bold tracking-tight ${accent || 'text-foreground'}`}>{value}</div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  )
}

export function StatsCards() {
  const { stats, loading } = useStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats) return null

  const combatPct = stats.totalLeads > 0
    ? Math.round((stats.totalCombatLeads / stats.totalLeads) * 100)
    : 0

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Main KPI Row */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Всего лидов"
          value={stats.totalLeads}
          sub={`${stats.inProgressLeads} в работе · ${stats.rejectedLeads} отклонено`}
          icon={<Users className="w-5 h-5" />}
          bg="bg-slate-50"
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <KPICard
          label="Боевые лиды"
          value={stats.totalCombatLeads}
          sub={`${combatPct}% от всех лидов`}
          icon={<Swords className="w-5 h-5" />}
          bg="bg-emerald-50"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          label="Оттоки"
          value={stats.totalChurns}
          sub={`Оборот ${formatNum(stats.churnsTurnover)} Р`}
          icon={<TrendingDown className="w-5 h-5" />}
          bg="bg-red-50"
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </motion.div>

      {/* Secondary status row */}
      <motion.div variants={staggerContainer} className="grid grid-cols-3 gap-4">
        <KPICard
          label="В работе"
          value={stats.inProgressLeads}
          icon={<Briefcase className="w-4 h-4" />}
          bg="bg-amber-50/60"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          label="На паузе"
          value={stats.onHoldLeads}
          icon={<Pause className="w-4 h-4" />}
          bg="bg-orange-50/60"
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
        <KPICard
          label="Отклонено"
          value={stats.rejectedLeads}
          icon={<XCircle className="w-4 h-4" />}
          bg="bg-red-50/60"
          iconBg="bg-red-100"
          iconColor="text-red-500"
        />
      </motion.div>
    </motion.div>
  )
}
