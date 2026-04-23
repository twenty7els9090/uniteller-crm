import { create } from 'zustand'
import type { AuthUser } from '@/lib/types'

export type { AuthUser }

export type PageType = 'incoming' | 'main' | 'combat' | 'rejected' | 'dop' | 'relegal' | 'churn' | 'statistics' | 'settings'

export const PAGE_LABELS: Record<PageType, string> = {
  incoming: 'Входящие',
  main: 'Лиды',
  combat: 'Боевые лиды',
  rejected: 'Отказы',
  dop: 'Доп. сервисы',
  relegal: 'Юр.лица',
  churn: 'Оттоки',
  statistics: 'Статистика',
  settings: 'Настройки',
}

interface AppState {
  user: AuthUser | null
  currentPage: PageType
  isLoading: boolean
  globalSearch: string

  setUser: (user: AuthUser | null) => void
  setCurrentPage: (page: PageType) => void
  setLoading: (loading: boolean) => void
  setGlobalSearch: (search: string) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  currentPage: 'incoming',
  isLoading: true,
  globalSearch: '',

  setUser: (user) => set({ user, isLoading: false }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setLoading: (loading) => set({ isLoading: loading }),
  setGlobalSearch: (search) => set({ globalSearch: search }),
  logout: () => {
    fetch('/api/auth/login', { method: 'DELETE' }).catch(() => {})
    set({ user: null, currentPage: 'incoming', globalSearch: '' })
  },
}))
