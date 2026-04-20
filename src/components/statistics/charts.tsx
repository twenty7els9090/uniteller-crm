'use client'

import { motion } from 'framer-motion'
import { useStats } from '@/hooks/use-stats'
import { staggerContainer, scaleIn } from '@/lib/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const PARTNER_COLORS: Record<string, string> = {
  'ВТБ': '#0d9488',   // teal-600
  'Vendotek': '#0891b2', // cyan-600
  'Другой': '#6366f1',   // indigo-500
}
const REJECT_COLORS = ['#ef4444', '#dc2626', '#f59e0b', '#f97316', '#6b7280', '#8b5cf6', '#059669']

export function StatisticsCharts() {
  const { stats, loading } = useStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats) return null

  const partnerData = stats.leadsByPartner.map((item) => ({
    name: item.partner,
    count: item._count.id,
    fill: PARTNER_COLORS[item.partner] || '#6b7280',
  }))

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Leads by Partner */}
        <motion.div variants={scaleIn}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Лиды по партнёрам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partnerData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`${value} шт.`, 'Количество']} />
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

        {/* Bar Chart - Rejected leads by reason */}
        <motion.div variants={scaleIn}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Причины отказа лидов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.rejectedByReason} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={220} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [`${value} шт.`, 'Количество']} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                      {stats.rejectedByReason.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={REJECT_COLORS[index % REJECT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
