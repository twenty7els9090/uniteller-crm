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
  const [globalFilter, setGlobalFilter] = useState('')

  // Multi-select filters (empty array = show all)
  const [partnerFilter, setPartnerFilter] = useState<string[]>([])
  const [zayavkaFilter, setZayavkaFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [managerFilter, setManagerFilter] = useState<string[]>([])

  // Sync global search from store to local filter
  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== globalFilter) {
      setGlobalFilter(globalSearch)
    }
  }, [globalSearch])

  // Use settings from API, fall back to hardcoded constants
  const dynamicPartners = useMemo(() => settings.partner.length > 0 ? settings.partner : [...PARTNERS], [settings.partner])
  const dynamicManagers = useMemo(() => settings.manager.length > 0 ? settings.manager : [...MANAGERS], [settings.manager])
  const dynamicZayavka = useMemo(() => settings.zayavka.length > 0 ? settings.zayavka : [...ZAYAVKA_OPTIONS], [settings.zayavka])
  const dynamicStatus = useMemo(() => settings.status.length > 0 ? settings.status : [...STATUS_OPTIONS], [settings.status])
  const dynamicActivityTypes = useMemo(() => settings.activityType.length > 0 ? settings.activityType : [...ACTIVITY_TYPES], [settings.activityType])

  // Client-side search & filter
  // Always exclude: Отклонена, На паузе (they have their own pages)
  // For uniteller: also exclude Выполнена/Входящий/пошли боевые платежи
  const leads = useMemo(() => {
    let result = allLeads.filter((l) =>
      l.zayavka !== 'Отклонена' && l.zayavka !== 'На паузе' &&
      (isVTB || (l.zayavka !== 'Выполнена' && l.zayavka !== 'Входящий' && l.status !== 'пошли боевые платежи'))
    )
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      result = result.filter((l) =>
        l.organization.toLowerCase().includes(q) ||
        l.contactInfo.toLowerCase().includes(q) ||
        l.comment?.toLowerCase().includes(q) ||
        l.manager.toLowerCase().includes(q) ||
        l.status?.toLowerCase().includes(q)
      )
    }
    if (partnerFilter.length > 0) result = result.filter((l) => partnerFilter.includes(l.partner))
    if (zayavkaFilter.length > 0) result = result.filter((l) => zayavkaFilter.includes(l.zayavka))
    if (statusFilter.length > 0) result = result.filter((l) => l.status && statusFilter.includes(l.status))
    if (managerFilter.length > 0) result = result.filter((l) => managerFilter.includes(l.manager))
    // Sort by date newest first (statusChangedAt takes priority over createdAt)
    result.sort((a, b) => {
      const dateA = new Date(a.statusChangedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.statusChangedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    return result
  }, [allLeads, globalFilter, partnerFilter, zayavkaFilter, statusFilter, managerFilter, isVTB])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        const leads = Array.isArray(data.leads) ? data.leads : Array.isArray(data) ? data : []
        setAllLeads(leads)
      }
    } catch {
      toast.error('Ошибка загрузки лидов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Inline save helper — uses ref to avoid stale closure
  const leadsRef = useRef(allLeads)
  leadsRef.current = allLeads

  const inlineSave = useCallback(async (leadId: string, field: string, value: string) => {
    try {
      const lead = leadsRef.current.find((l) => l.id === leadId)
      if (!lead) return

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          [field]: value,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setAllLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
        toast.success('Сохранено')
      } else {
        toast.error('Ошибка сохранения')
        fetchLeads()
      }
    } catch {
      toast.error('Ошибка соединения')
      fetchLeads()
    }
  }, [fetchLeads])

  // Get unique partners and managers for filters
  const partners = useMemo(() => {
    const set = new Set(leads.map((l) => l.partner))
    return Array.from(set).sort()
  }, [leads])

  const managers = useMemo(() => {
    const set = new Set(leads.map((l) => l.manager))
    return Array.from(set).sort()
  }, [leads])

  const hasActiveFilters = partnerFilter.length > 0 || zayavkaFilter.length > 0 || statusFilter.length > 0 || managerFilter.length > 0

  function clearFilters() {
    setPartnerFilter([])
    setZayavkaFilter([])
    setStatusFilter([])
    setManagerFilter([])
    setGlobalFilter('')
  }

  return {
    // Auth
    user,
    isVTB,
    isAdmin: user?.role === 'uniteller',
    // Data
    allLeads,
    setAllLeads,
    leads,
    loading,
    fetchLeads,
    inlineSave,
    // Table state
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    globalFilter,
    setGlobalFilter,
    // Filter states
    partnerFilter,
    setPartnerFilter,
    zayavkaFilter,
    setZayavkaFilter,
    statusFilter,
    setStatusFilter,
    managerFilter,
    setManagerFilter,
    hasActiveFilters,
    clearFilters,
    // Dynamic options
    dynamicPartners,
    dynamicManagers,
    dynamicZayavka,
    dynamicStatus,
    dynamicActivityTypes,
    // Filter lists
    partners,
    managers,
  }
}
