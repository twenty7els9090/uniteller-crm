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
import { RejectedLeadsTable } from '@/components/leads/rejected-leads-table'
import { ChurnTable } from '@/components/churn/churn-table'
import { RelegalTable } from '@/components/relegal/relegal-table'
import { AdditionalTable } from '@/components/additional/additional-table'
import { SettingsPage } from '@/components/settings/settings-page'
import { PageWrapper, PageSection } from '@/components/layout/page-layout'
import { Loader2, LayoutGrid, Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <div className="flex justify-end mb-3">
          <div className="inline-flex items-center rounded-lg border bg-muted/60 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150',
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
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
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

function RejectedPage() {
  const isVTB = useAppStore((s) => s.user?.role === 'vtb')
  return (
    <PageWrapper pageKey="rejected">
      <PageSection>
        <RejectedLeadsTable />
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
          {/* Bento Grid: funnel large, top orgs side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <LeadsFunnel />
            </div>
            <div className="lg:col-span-2">
              <TopOrganizations />
            </div>
          </div>
          {/* Charts row */}
          <StatisticsCharts />
        </div>
      </PageSection>
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
      <div className="flex-1 flex flex-col pb-24 md:pb-0">
        <AnimatePresence mode="wait">
          {currentPage === 'incoming' && <IncomingPage />}
          {currentPage === 'main' && <MainPage />}
          {currentPage === 'rejected' && <RejectedPage />}
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
      </div>
    </div>
  )
}
