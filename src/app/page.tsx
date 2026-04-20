'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { LoginForm } from '@/components/auth/login-form'
import { AppHeader } from '@/components/layout/app-header'
import { LeadsTable } from '@/components/leads/leads-table'
import { KanbanBoard } from '@/components/leads/kanban-board'
import { StatisticsCharts } from '@/components/statistics/charts'
import { LeadsFunnel } from '@/components/statistics/leads-funnel'
import { TopOrganizations } from '@/components/statistics/top-organizations'

import { CombatLeadsTable } from '@/components/leads/combat-leads-table'
import { ChurnTable } from '@/components/churn/churn-table'
import { RelegalTable } from '@/components/relegal/relegal-table'
import { AdditionalTable } from '@/components/additional/additional-table'
import { SettingsPage } from '@/components/settings/settings-page'
import { Loader2, LayoutGrid, Columns3 } from 'lucide-react'
import { fadeIn, slideUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

/** Wrap a page component with a smooth entrance animation */
function PageWrapper({ children, pageKey }: { children: React.ReactNode; pageKey: string }) {
  return (
    <motion.div
      key={pageKey}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1"
    >
      {children}
    </motion.div>
  )
}

/** Main page: leads table or kanban board */
function MainPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  return (
    <PageWrapper pageKey="main">
      <motion.main
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 md:p-6"
      >
        {/* View toggle */}
        <div className="flex justify-end mb-3">
          <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Таблица
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Канбан
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <LeadsTable showDelete={!isVTB} />
        ) : (
          <KanbanBoard />
        )}
      </motion.main>
    </PageWrapper>
  )
}

function CombatPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')

  return (
    <PageWrapper pageKey="combat">
      <motion.main
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 md:p-6"
      >
        <CombatLeadsTable readOnly={isVTB} />
      </motion.main>
    </PageWrapper>
  )
}

function AdditionalPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  return (
    <PageWrapper pageKey="dop">
      <motion.main
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 md:p-6"
      >
        <AdditionalTable readOnly={isVTB} />
      </motion.main>
    </PageWrapper>
  )
}

function RelegalPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')

  return (
    <PageWrapper pageKey="relegal">
      <motion.main
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 md:p-6"
      >
        <RelegalTable readOnly={isVTB} />
      </motion.main>
    </PageWrapper>
  )
}

function ChurnPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')

  return (
    <PageWrapper pageKey="churn">
      <motion.main
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 md:p-6"
      >
        <ChurnTable readOnly={isVTB} />
      </motion.main>
    </PageWrapper>
  )
}

function StatisticsPage() {
  return (
    <PageWrapper pageKey="statistics">
      <motion.main
        variants={slideUp}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 md:p-6 space-y-6"
      >
        <LeadsFunnel />
        <TopOrganizations />
        <StatisticsCharts />
      </motion.main>
    </PageWrapper>
  )
}

export default function HomePage() {
  const { user, setUser, setLoading, isLoading, currentPage } = useAppStore()

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (r.ok) return r.json()
        throw new Error('Not authenticated')
      })
      .then((userData) => {
        setUser(userData)
      })
      .catch(() => {
        setUser(null)
      })
  }, [setUser, setLoading])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex-1 flex flex-col pb-20 md:pb-0">
      <AnimatePresence mode="wait">
        {currentPage === 'main' && <MainPage />}
        {currentPage === 'combat' && <CombatPage />}
        {currentPage === 'dop' && <AdditionalPage />}
        {currentPage === 'relegal' && <RelegalPage />}
        {currentPage === 'churn' && <ChurnPage />}
        {currentPage === 'statistics' && <StatisticsPage />}
        {currentPage === 'settings' && (
          <PageWrapper pageKey="settings">
            <motion.main
              variants={slideUp}
              initial="hidden"
              animate="visible"
              className="flex-1 p-4 md:p-6"
            >
              <SettingsPage />
            </motion.main>
          </PageWrapper>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
