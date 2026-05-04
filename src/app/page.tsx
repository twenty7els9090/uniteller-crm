'use client'

import { useEffect } from 'react'
import { useAppStore, type PageType } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'
import { LoginForm } from '@/components/auth/login-form'
import { AppHeader } from '@/components/layout/app-header'
import { PageWrapper } from '@/components/layout/page-layout'
import { IncomingLeadsTable } from '@/components/leads/incoming-leads-table'
import { LeadsTable } from '@/components/leads/leads-table'
import { CombatLeadsTable } from '@/components/leads/combat-leads-table'
import { KanbanBoard } from '@/components/leads/kanban-board'
import { AdditionalTable } from '@/components/additional/additional-table'
import { RelegalTable } from '@/components/relegal/relegal-table'
import { ChurnTable } from '@/components/churn/churn-table'
import { StatisticsCharts } from '@/components/statistics/charts'
import { SettingsPage } from '@/components/settings/settings-page'

const PAGE_COMPONENTS: Record<PageType, React.FC> = {
  incoming: IncomingLeadsTable,
  main: LeadsTable,
  kanban: KanbanBoard,
  combat: CombatLeadsTable,
  dop: AdditionalTable,
  relegal: RelegalTable,
  churn: ChurnTable,
  statistics: StatisticsCharts,
  settings: SettingsPage,
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  )
}

export default function Page() {
  const { user, currentPage, isLoading, setUser, setLoading } = useAppStore()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }
    checkAuth()
  }, [setUser, setLoading])

  if (isLoading) return <LoadingScreen />
  if (!user) return <LoginForm />

  const PageComponent = PAGE_COMPONENTS[currentPage]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          <PageWrapper pageKey={currentPage}>
            <div className="pb-24 md:pb-8 pt-[72px] px-4 md:px-8">
              <PageComponent />
            </div>
          </PageWrapper>
        </AnimatePresence>
      </div>
    </div>
  )
}
