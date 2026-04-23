'use client'

import { useState, useCallback } from 'react'
import type { Lead } from '@/lib/types'
import { toast } from 'sonner'

interface UseLeadActionsParams {
  allLeads: Lead[]
  setAllLeads: React.Dispatch<React.SetStateAction<Lead[]>>
  fetchLeads: () => Promise<void>
}

export function useLeadActions({ allLeads, setAllLeads, fetchLeads }: UseLeadActionsParams) {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [marginDraft, setMarginDraft] = useState('')
  const [activityDraft, setActivityDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/leads/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Лид удалён')
        fetchLeads()
      } else {
        toast.error('Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setDeleteId(null)
    }
  }, [deleteId, fetchLeads])

  function openDetails(lead: Lead) {
    setViewLead(lead)
    setCommentDraft(lead.comment || '')
    setMarginDraft(lead.margin || '')
    setActivityDraft(lead.activityType || '')
    setEditing(false)
  }

  const saveDetails = useCallback(async () => {
    if (!viewLead) return
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${viewLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...viewLead,
          comment: commentDraft,
          margin: marginDraft,
          activityType: activityDraft,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAllLeads((prev) => prev.map((l) => (l.id === viewLead.id ? updated : l)))
        setViewLead(updated)
        setEditing(false)
        toast.success('Сохранено')
      } else {
        toast.error('Ошибка сохранения')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setSaving(false)
    }
  }, [viewLead, commentDraft, marginDraft, activityDraft, setAllLeads])

  return {
    // Form dialog
    formOpen,
    setFormOpen,
    // Delete
    deleteId,
    setDeleteId,
    handleDelete,
    // View dialog
    viewLead,
    setViewLead,
    openDetails,
    // Drafts
    commentDraft,
    setCommentDraft,
    marginDraft,
    setMarginDraft,
    activityDraft,
    setActivityDraft,
    // Editing state
    editing,
    setEditing,
    saving,
    saveDetails,
  }
}
