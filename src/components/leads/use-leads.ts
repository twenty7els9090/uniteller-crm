'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import { useSettings } from '@/hooks/use-settings'
import { PARTNERS, MANAGERS, ZAYAVKA_OPTIONS, STATUS_OPTIONS, ACTIVITY_TYPES } from '@/lib/constants'
import { toast } from 'sonner'

export function useLeads() {
  const user = useAppStore((s) => s.user)
  const globalSearch = useAppStore((s) => s.globalSearch)
  const { settings } = useSettings()
  const isVTB = user?.role === 'vtb'

  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Folder toggle state: which archive folders are expanded
  const [expandedFolder, setExpandedFolder] = useState<'rejected' | 'paused' | null>(null)

  // Multi-select filters
  const [partnerFilter, setPartnerFilter] = useState<string[]>([])
  const [zayavkaFilter, setZayavkaFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [managerFilter, setManagerFilter] = useState<string[]>([])

  // Dynamic options from settings
  const dynamicPartners = useMemo(() => settings.partner.length > 0 ? settings.partner : [...PARTNERS], [settings.partner])
  const dynamicManagers = useMemo(() => settings.manager.length > 0 ? settings.manager : [...MANAGERS], [settings.manager])
  const dynamicZayavka = useMemo(() => {
    const base = settings.zayavka.length > 0 ? settings.zayavka : [...ZAYAVKA_OPTIONS]
    // VTB: hide Входящий (their own section), Выполнена (combat section)
    if (isVTB) return base.filter((z) => z !== 'Входящий' && z !== 'Выполнена')
    return base
  }, [settings.zayavka, isVTB])
  const dynamicStatus = useMemo(() => {
    const base = settings.status.length > 0 ? settings.status : [...STATUS_OPTIONS]
    // VTB: hide combat/internal statuses
    if (isVTB) return base.filter((s) => s !== 'Перезвонить' && s !== 'пошли боевые платежи')
    return base
  }, [settings.status, isVTB])
  const dynamicActivityTypes = useMemo(() => settings.activityType.length > 0 ? settings.activityType : [...ACTIVITY_TYPES], [settings.activityType])

  // ─── Search helper with null safety ─────────────────────────
  const searchFilter = useCallback((l: Lead, q: string): boolean => {
    return (
      l.organization.toLowerCase().includes(q) ||
      (l.contactInfo || '').toLowerCase().includes(q) ||
      (l.comment || '').toLowerCase().includes(q) ||
      (l.manager || '').toLowerCase().includes(q) ||
      (l.status || '').toLowerCase().includes(q) ||
      (l.partner || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q)
    )
  }, [])

  // Main leads: exclude combat-only; when searching, include rejected/paused too
  const isSearching = !!globalSearch

  const leads = useMemo(() => {
    let result = allLeads.filter((l) => {
      // Uniteller: exclude Входящий (incoming section), Выполнена/combat (combat section)
      if (!isVTB && (
        l.zayavka === 'Входящий' ||
        l.zayavka === 'Выполнена' ||
        l.status === 'пошли боевые платежи'
      )) return false

      // VTB: exclude Входящий (incoming section), Выполнена/combat (combat section)
      if (isVTB && (
        l.zayavka === 'Входящий' ||
        l.zayavka === 'Выполнена' ||
        l.status === 'пошли боевые платежи'
      )) return false

      // When NOT searching: hide archive folders (both roles)
      if (!isSearching && (l.zayavka === 'Отклонена' || l.zayavka === 'На паузе')) {
        return false
      }

      return true
    })

    // Apply global search filter
    if (globalSearch) {
      const q = globalSearch.toLowerCase()
      result = result.filter((l) => searchFilter(l, q))
    }

    // Apply multi-select filters
    if (partnerFilter.length > 0) result = result.filter((l) => partnerFilter.includes(l.partner))
    if (zayavkaFilter.length > 0) result = result.filter((l) => zayavkaFilter.includes(l.zayavka))
    if (statusFilter.length > 0) result = result.filter((l) => l.status && statusFilter.includes(l.status))
    if (managerFilter.length > 0) result = result.filter((l) => managerFilter.includes(l.manager))

    // Sort newest first
    result.sort((a, b) => {
      const dateA = new Date(a.statusChangedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.statusChangedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    return result
  }, [allLeads, globalSearch, partnerFilter, zayavkaFilter, statusFilter, managerFilter, isVTB, isSearching, searchFilter])

  // Rejected leads for folder
  const rejectedLeads = useMemo(() => {
    let result = allLeads.filter((l) => l.zayavka === 'Отклонена')
    if (globalSearch) {
      const q = globalSearch.toLowerCase()
      result = result.filter((l) => searchFilter(l, q))
    }
    result.sort((a, b) => {
      const dateA = new Date(a.statusChangedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.statusChangedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    return result
  }, [allLeads, globalSearch, searchFilter])

  // Paused leads for folder
  const pausedLeads = useMemo(() => {
    let result = allLeads.filter((l) => l.zayavka === 'На паузе')
    if (globalSearch) {
      const q = globalSearch.toLowerCase()
      result = result.filter((l) => searchFilter(l, q))
    }
    result.sort((a, b) => {
      const dateA = new Date(a.statusChangedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.statusChangedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    return result
  }, [allLeads, globalSearch, searchFilter])

  // Folder counts
  const folderCounts = useMemo(() => ({
    rejected: allLeads.filter((l) => l.zayavka === 'Отклонена').length,
    paused: allLeads.filter((l) => l.zayavka === 'На паузе').length,
  }), [allLeads])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch ALL leads — client does filtering/sorting
      const res = await fetch('/api/leads?limit=2000&page=1')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data.leads) ? data.leads : Array.isArray(data) ? data : []
        setAllLeads(list)
      }
    } catch {
      toast.error('Ошибка загрузки лидов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const leadsRef = useRef(allLeads)
  leadsRef.current = allLeads

  const inlineSave = useCallback(async (leadId: string, field: string, value: string) => {
    try {
      const lead = leadsRef.current.find((l) => l.id === leadId)
      if (!lead) return

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, [field]: value }),
      })

      if (res.ok) {
        const updated = await res.json()
        setAllLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
        toast.success('Сохранено')
        // Refresh global search cache
        useAppStore.getState().bumpSearchVersion()
      } else {
        toast.error('Ошибка сохранения')
        fetchLeads()
      }
    } catch {
      toast.error('Ошибка соединения')
      fetchLeads()
    }
  }, [fetchLeads])

  const partners = useMemo(() => {
    const set = new Set(leads.map((l) => l.partner).filter(Boolean))
    return Array.from(set).sort()
  }, [leads])

  const managers = useMemo(() => {
    const set = new Set(leads.map((l) => l.manager).filter(Boolean))
    return Array.from(set).sort()
  }, [leads])

  const hasActiveFilters = partnerFilter.length > 0 || zayavkaFilter.length > 0 || statusFilter.length > 0 || managerFilter.length > 0 || !!globalSearch

  function clearFilters() {
    setPartnerFilter([])
    setZayavkaFilter([])
    setStatusFilter([])
    setManagerFilter([])
    // Clear BOTH local filters AND store's globalSearch
    useAppStore.getState().setGlobalSearch('')
  }

  function toggleFolder(folder: 'rejected' | 'paused') {
    setExpandedFolder((prev) => prev === folder ? null : folder)
  }

  return {
    user, isVTB, isAdmin: user?.role === 'uniteller',
    allLeads, setAllLeads, leads, loading, fetchLeads, inlineSave,
    sorting, setSorting, columnFilters, setColumnFilters,
    globalSearch,
    partnerFilter, setPartnerFilter, zayavkaFilter, setZayavkaFilter,
    statusFilter, setStatusFilter, managerFilter, setManagerFilter,
    hasActiveFilters, clearFilters,
    dynamicPartners, dynamicManagers, dynamicZayavka, dynamicStatus, dynamicActivityTypes,
    partners, managers,
    // Folder system
    expandedFolder, toggleFolder,
    rejectedLeads, pausedLeads, folderCounts,
  }
}
