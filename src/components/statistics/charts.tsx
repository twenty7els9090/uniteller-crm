'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Zap,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  LayoutList,
  Building2,
  UserCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStats } from '@/hooks/use-stats'
import { useAppStore } from '@/lib/store'
import { formatCurrency, formatDate } from '@/lib/format'
import { scaleIn, slideUp, staggerContainer } from '@/lib/motion'
import type { Lead } from '@/lib/types'
import { TopOrganizations } from './top-organizations'
import { LeadsFunnel } from './leads-funnel'

// ─── Color maps ──────────────────────────────────────────────────
const ZAYAVKA_COLORS: Record<string, string> = {
  'Входящий': '#15803D',
  'В работе': '#06B6D4',
  'Выполнена': '#10B981',
  'На паузе': '#F59E0B',
  'Отклонена': '#EF4444',
}

const ZAYAVKA_BG: Record<string, string> = {
  'Входящий': 'bg-green-50 text-green-700 border-green-200',
  'В работе': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Выполнена': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'На паузе': 'bg-amber-50 text-amber-700 border-amber-200',
  'Отклонена': 'bg-red-50 text-red-700 border-red-200',
}

const ZAYAVKA_BORDER: Record<string, string> = {
  'Входящий': 'border-l-green-600',
  'В работе': 'border-l-cyan-500',
  'Выполнена': 'border-l-emerald-500',
  'На паузе': 'border-l-amber-500',
  'Отклонена': 'border-l-red-500',
}

const PARTNER_COLORS: Record<string, string> = {
  'ВТБ': '#06B6D4',
  'Vendotek': '#15803D',
  'Другой': '#F59E0B',
}
const REJECT_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#15803D', '#64748B', '#06B6D4', '#10B981']

// ─── KPI Card ────────────────────────────────────────────────────
interface KpiCardProps {
  label: string
  value: string | number
  trend?: { value: number; positive: boolean }
  icon: React.ReactNode
  iconBg: string
  accentColor: string
}

function KpiCard({ label, value, trend, icon, iconBg, accentColor }: KpiCardProps) {
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
          <div className="flex items-end gap-3">
            <span
              className="text-3xl font-bold tracking-tight text-slate-900"
              style={{ fontFeatureSettings: '"tnum"', color: accentColor === '#EEEFF4' ? undefined : accentColor }}
            >
              {value}
            </span>
            {trend && (
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold mb-1 ${
                  trend.positive ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {trend.positive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Chart Tooltips ──────────────────────────────────────────────
function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { zayavka?: string; name?: string } }> }) {
  if (!active || !payload?.length) return null
  const name = payload[0].payload.zayavka || payload[0].payload.name || ''
  return (
    <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-lg border border-slate-200">
      <p className="text-xs text-slate-500 mb-1">{name}</p>
      <p className="text-sm font-bold text-slate-900" style={{ fontFeatureSettings: '"tnum"' }}>
        {payload[0].value}
      </p>
    </div>
  )
}

// ─── Skeletons ───────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <Card className="border border-slate-200/80 bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg mb-2" />
      </CardContent>
    </Card>
  )
}


// ─── Main Statistics Page ────────────────────────────────────────
export function StatisticsCharts() {
  const { stats, loading } = useStats()
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leads?limit=5')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.leads) setRecentLeads(data.leads)
      })
      .catch(() => {})
      .finally(() => setLeadsLoading(false))
  }, [])

  // ─── Computed KPI values ─────────────────────────────
  const totalLeads = stats?.totalLeads ?? 0
  const activeDeals = stats?.inProgressLeads ?? 0
  const revenue = stats?.combatLeadsRevenue ?? 0
  const conversion = totalLeads > 0 ? Math.round(((stats?.completedLeads ?? 0) / totalLeads) * 100) : 0

  const statusData = stats?.leadsByZayavka?.map((item) => ({
    zayavka: item.zayavka,
    count: item._count.id,
  })) ?? []

  const leadsByPartner = stats?.leadsByPartner || []
  const rejectedByReason = stats?.rejectedByReason || []

  const partnerData = leadsByPartner.map((item) => ({
    name: item.partner,
    count: item._count.id,
    fill: PARTNER_COLORS[item.partner] || '#64748B',
  }))

  return (
    <div className="space-y-6">
      {/* ─── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Статистика</h1>
          <p className="text-sm text-slate-500 mt-1">Обзор ключевых показателей и аналитика</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCurrentPage('incoming')} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            Новая заявка
          </Button>
          <Button onClick={() => setCurrentPage('main')} variant="ghost" className="btn-ghost gap-2">
            <LayoutList className="w-4 h-4" />
            Все лиды
          </Button>
        </div>
      </div>

      {/* ─── KPI Cards ────────────────────────────────────── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              label="Всего лидов"
              value={totalLeads}
              icon={<Users className="w-5 h-5 text-green-600" />}
              iconBg="bg-green-50"
              accentColor="#334155"
            />
            <KpiCard
              label="Активные сделки"
              value={activeDeals}
              icon={<Zap className="w-5 h-5 text-cyan-500" />}
              iconBg="bg-cyan-50"
              accentColor="#06B6D4"
            />
            <KpiCard
              label="Доход (боевые)"
              value={formatCurrency(revenue)}
              icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
              iconBg="bg-emerald-50"
              accentColor="#10B981"
            />
            <KpiCard
              label="Конверсия"
              value={`${conversion}%`}
              icon={<Target className="w-5 h-5 text-amber-500" />}
              iconBg="bg-amber-50"
              accentColor="#F59E0B"
            />
          </>
        )}
      </motion.div>

      {/* ─── Chart: Status ──────────────────────────────────── */}
      <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <Card className="border border-slate-200/80 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Лиды по статусу</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="zayavka" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<BarTooltip />} cursor={false} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                      {statusData.map((entry, idx) => (
                        <Cell key={entry.zayavka} fill={ZAYAVKA_COLORS[entry.zayavka] ?? `hsl(${idx * 45}, 70%, 55%)`} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      {/* ─── Charts Row 2: By Partner + Rejected ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <Card className="border border-slate-200/80 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Лиды по партнёрам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partnerData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.04)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={36}>
                      {partnerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <Card className="border border-slate-200/80 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Причины отказа лидов</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rejectedByReason} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={220} tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarTooltip />} cursor={false} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                      {rejectedByReason.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={REJECT_COLORS[index % REJECT_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Recent Leads Table ────────────────────────────── */}
      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <Card className="border border-slate-200/80 bg-white overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Последние лиды</CardTitle>
              <Button variant="ghost" onClick={() => setCurrentPage('main')} className="btn-ghost text-xs h-8 px-3">
                Показать все
                <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Организация</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Партнёр</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Статус</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Менеджер</th>
                    <th className="text-right px-6 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-6 py-3"><Skeleton className="h-4 w-40 rounded-md" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24 rounded-md" /></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-28 rounded-md" /></td>
                        <td className="px-6 py-3 text-right"><Skeleton className="h-4 w-16 rounded-md ml-auto" /></td>
                      </tr>
                    ))
                  ) : recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Нет данных</td>
                    </tr>
                  ) : (
                    recentLeads.map((lead) => (
                      <tr key={lead.id} className={`row-hover border-b border-slate-50 border-l-2 ${ZAYAVKA_BORDER[lead.zayavka] ?? 'border-l-slate-300'}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="font-medium text-slate-900 truncate max-w-[180px]">{lead.organization}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{lead.partner}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ZAYAVKA_BG[lead.zayavka] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ZAYAVKA_COLORS[lead.zayavka] ?? '#64748B' }} />
                            {lead.zayavka}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                          {lead.manager && lead.manager !== '—' ? (
                            <div className="flex items-center gap-1.5">
                              <UserCircle className="w-3.5 h-3.5" />
                              {lead.manager}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center gap-1 justify-end text-slate-500">
                            <Clock className="w-3 h-3" />
                            {formatDate(lead.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Funnel + Top Orgs ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <LeadsFunnel />
        </motion.div>
        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <TopOrganizations />
        </motion.div>
      </div>
    </div>
  )
}
