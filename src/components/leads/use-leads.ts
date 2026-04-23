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

  // Folder toggle state: which archive folders are expanded
  const [expandedFolder, setExpandedFolder] = useState<'rejected' | 'paused' | null>(null)

  // Multi-select filters
  const [partnerFilter, setPartnerFilter] = useState<string[]>([])
  const [zayavkaFilter, setZayavkaFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [managerFilter, setManagerFilter] = useState<string[]>([])

  // Sync global search
  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== globalFilter) {
      setGlobalFilter(globalSearch)
    }
  }, [globalSearch])

  // Dynamic options from settings
  const dynamicPartners = useMemo(() => settings.partner.length > 0 ? settings.partner : [...PARTNERS], [settings.partner])
  const dynamicManagers = useMemo(() => settings.manager.length > 0 ? settings.manager : [...MANAGERS], [settings.manager])
  const dynamicZayavka = useMemo(() => settings.zayavka.length > 0 ? settings.zayavka : [...ZAYAVKA_OPTIONS], [settings.zayavka])
  const dynamicStatus = useMemo(() => settings.status.length > 0 ? settings.status : [...STATUS_OPTIONS], [settings.status])
  const dynamicActivityTypes = useMemo(() => settings.activityType.length > 0 ? settings.activityType : [...ACTIVITY_TYPES], [settings.activityType])

  // Main leads: exclude combat-only, rejected, and paused
  const leads = useMemo(() => {
    let result = allLeads.filter((l) => {
      // For uniteller: exclude Входящий, Выполнена, combat-only
      if (!isVTB && (l.zayavka === 'Выполнена' || l.zayavka === 'Входящий' || l.status === 'пошли боевые платежи')) {
        return false
      }
      // Always exclude archive folders from main table
      if (l.zayavka === 'Отклонена' || l.zayavka === 'На паузе') {
        return false
      }
      return true
    })

    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      result = result.filter((l) =>
        l.organization.toLowerCase().includes(q) ||
        l.contactInfo.toLowerCase().includes(q) ||
        l.comment?.toLowerCase().includes(q) ||
        l.manager?.toLowerCase().includes(q) ||
        l.status?.toLowerCase().includes(q)
      )
    }
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
  }, [allLeads, globalFilter, partnerFilter, zayavkaFilter, statusFilter, managerFilter, isVTB])

  // Rejected leads for folder
  const rejectedLeads = useMemo(() => {
    let result = allLeads.filter((l) => l.zayavka === 'Отклонена')
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      result = result.filter((l) =>
        l.organization.toLowerCase().includes(q) ||
        l.contactInfo.toLowerCase().includes(q) ||
        l.comment?.toLowerCase().includes(q) ||
        l.manager?.toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => {
      const dateA = new Date(a.statusChangedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.statusChangedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    return result
  }, [allLeads, globalFilter])

  // Paused leads for folder
  const pausedLeads = useMemo(() => {
    let result = allLeads.filter((l) => l.zayavka === 'На паузе')
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      result = result.filter((l) =>
        l.organization.toLowerCase().includes(q) ||
        l.contactInfo.toLowerCase().includes(q) ||
        l.comment?.toLowerCase().includes(q) ||
        l.manager?.toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => {
      const dateA = new Date(a.statusChangedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.statusChangedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    return result
  }, [allLeads, globalFilter])

  // Folder counts
  const folderCounts = useMemo(() => ({
    rejected: allLeads.filter((l) => l.zayavka === 'Отклонена').length,
    paused: allLeads.filter((l) => l.zayavka === 'На паузе').length,
  }), [allLeads])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch ALL leads (limit=5000) — client does filtering/sorting
      const res = await fetch('/api/leads?limit=5000&page=1')
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

  const hasActiveFilters = partnerFilter.length > 0 || zayavkaFilter.length > 0 || statusFilter.length > 0 || managerFilter.length > 0

  function clearFilters() {
    setPartnerFilter([])
    setZayavkaFilter([])
    setStatusFilter([])
    setManagerFilter([])
    setGlobalFilter('')
  }

  function toggleFolder(folder: 'rejected' | 'paused') {
    setExpandedFolder((prev) => prev === folder ? null : folder)
  }

  return {
    user, isVTB, isAdmin: user?.role === 'uniteller',
    allLeads, setAllLeads, leads, loading, fetchLeads, inlineSave,
    sorting, setSorting, columnFilters, setColumnFilters, globalFilter, setGlobalFilter,
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
