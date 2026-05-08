import { create } from 'zustand'
import type { AuthUser } from '@/lib/types'

export type { AuthUser }

export type PageType = 'dop' | 'relegal' | 'churn' | 'statistics' | 'settings'

interface AppState {
  user: AuthUser | null
  currentPage: PageType
  isLoading: boolean
  globalSearch: string
  searchVersion: number // Incremented when search cache should be refreshed

  setUser: (user: AuthUser | null) => void
  setCurrentPage: (page: PageType) => void
  setLoading: (loading: boolean) => void
  setGlobalSearch: (search: string) => void
  navigateWithSearch: (search: string, page: PageType) => void
  bumpSearchVersion: () => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  currentPage: 'dop',
  isLoading: true,
  globalSearch: '',
  searchVersion: 0,

  setUser: (user) => set({ user, isLoading: false }),
  setCurrentPage: (page) => set({ currentPage: page, globalSearch: '' }),
  setLoading: (loading) => set({ isLoading: loading }),
  setGlobalSearch: (search) => set({ globalSearch: search }),
  // Atomic: navigate + set search in one update — no race condition
  navigateWithSearch: (search, page) => set({ currentPage: page, globalSearch: search }),
  bumpSearchVersion: () => set((s) => ({ searchVersion: s.searchVersion + 1 })),
  logout: () => {
    fetch('/api/auth/login', { method: 'DELETE' }).catch(() => {})
    set({ user: null, currentPage: 'dop', globalSearch: '', isLoading: false })
  },
}))
