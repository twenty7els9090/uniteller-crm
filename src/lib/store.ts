import { create } from 'zustand'
import type { AuthUser } from '@/lib/types'

export type { AuthUser }

export type PageType = 'main' | 'combat' | 'dop' | 'relegal' | 'churn' | 'statistics' | 'settings'

interface AppState {
  user: AuthUser | null
  currentPage: PageType
  isLoading: boolean

  setUser: (user: AuthUser | null) => void
  setCurrentPage: (page: PageType) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  currentPage: 'main',
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    fetch('/api/auth/login', { method: 'DELETE' }).catch(() => {})
    set({ user: null, currentPage: 'main' })
  },
}))
