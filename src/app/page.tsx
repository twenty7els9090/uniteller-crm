'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { LoginForm } from '@/components/auth/login-form'
import { AppHeader } from '@/components/layout/app-header'
import { LeadsTable } from '@/components/leads/leads-table'
import { IncomingLeadsTable } from '@/components/leads/incoming-leads-table'
import { KanbanBoard } from '@/components/leads/kanban-board'
import { StatisticsCharts } from '@/components/statistics/charts'
import { LeadsFunnel } from '@/components/statistics/leads-funnel'
import { TopOrganizations } from '@/components/statistics/top-organizations'
import { CombatLeadsTable } from '@/components/leads/combat-leads-table'
import { ChurnTable } from '@/components/churn/churn-table'
import { RelegalTable } from '@/components/relegal/relegal-table'
import { AdditionalTable } from '@/components/additional/additional-table'
import { SettingsPage } from '@/components/settings/settings-page'
import { PageWrapper, PageSection } from '@/components/layout/page-layout'
import { motion } from 'framer-motion'
import { LayoutGrid, Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/error-boundary'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/20 animate-pulse">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h18v18H3z" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <span className="text-xs text-slate-400 font-medium">Загрузка...</span>
      </motion.div>
    </div>
  )
}

/** Main page: leads table or kanban board */
function MainPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  return (
    <PageWrapper pageKey="main">
      <PageSection>
        {/* View toggle */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-[3px] gap-[2px] shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-[7px] text-xs font-medium transition-all duration-200',
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Таблица
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-[7px] text-xs font-medium transition-all duration-200',
                viewMode === 'kanban'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Доска задач
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <LeadsTable showDelete={!isVTB} />
        ) : (
          <KanbanBoard />
        )}
      </PageSection>
    </PageWrapper>
  )
}

function IncomingPage() {
  return (
    <PageWrapper pageKey="incoming">
      <PageSection>
        <IncomingLeadsTable />
      </PageSection>
    </PageWrapper>
  )
}

function CombatPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  return (
    <PageWrapper pageKey="combat">
      <PageSection>
        <CombatLeadsTable readOnly={isVTB} />
      </PageSection>
    </PageWrapper>
  )
}

function AdditionalPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  return (
    <PageWrapper pageKey="dop">
      <PageSection>
        <AdditionalTable readOnly={isVTB} />
      </PageSection>
    </PageWrapper>
  )
}

function RelegalPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  return (
    <PageWrapper pageKey="relegal">
      <PageSection>
        <RelegalTable readOnly={isVTB} />
      </PageSection>
    </PageWrapper>
  )
}

function ChurnPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  return (
    <PageWrapper pageKey="churn">
      <PageSection>
        <ChurnTable readOnly={isVTB} />
      </PageSection>
    </PageWrapper>
  )
}

function StatisticsPage() {
  return (
    <PageWrapper pageKey="statistics">
      <PageSection className="p-4 md:p-6">
        <div className="space-y-6">
          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <LeadsFunnel />
            </div>
            <div className="lg:col-span-2">
              <TopOrganizations />
            </div>
          </div>
          <StatisticsCharts />
        </div>
      </PageSection>
    </PageWrapper>
  )
}

export default function HomePage() {
  const { user, setUser, isLoading, currentPage } = useAppStore()

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
  }, [setUser])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <AppHeader />
      <div className="flex-1 flex flex-col pb-24 md:pb-0">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {currentPage === 'incoming' && <IncomingPage />}
            {currentPage === 'main' && <MainPage />}
            {currentPage === 'combat' && <CombatPage />}
            {currentPage === 'dop' && <AdditionalPage />}
            {currentPage === 'relegal' && <RelegalPage />}
            {currentPage === 'churn' && <ChurnPage />}
            {currentPage === 'statistics' && <StatisticsPage />}
            {currentPage === 'settings' && (
              <PageWrapper pageKey="settings">
                <PageSection>
                  <SettingsPage />
                </PageSection>
              </PageWrapper>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </div>
    </div>
  )
}
