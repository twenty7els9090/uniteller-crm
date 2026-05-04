'use client'

import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import { StatusBadge, ZayavkaBadge, isNewLead, getZayavkaRowClass } from '@/lib/status'
import { formatDate } from '@/lib/format'
import { motion } from 'framer-motion'
import { listItem } from '@/lib/motion'
import { User, Calendar, Eye, Trash2, Phone, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewBadge } from './desktop-lead-row'

interface MobileLeadCardProps {
  lead: Lead
  isVTB: boolean
  isAdmin: boolean
  showDelete: boolean
  openDetails: (lead: Lead) => void
  onDelete: (id: string) => void
}

export function MobileLeadCard({ lead, isVTB, isAdmin, showDelete, openDetails, onDelete }: MobileLeadCardProps) {
  return (
    <motion.div
      variants={listItem}
      className={cn(
        'rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 space-y-2.5 glass-card shadow-card active:scale-[0.99] transition-all duration-150 border-l-[2.5px]',
        getZayavkaRowClass(lead.zayavka),
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-semibold text-[14.5px] leading-tight truncate text-foreground">{lead.organization}</span>
          {isNewLead(lead.createdAt) && <NewBadge />}
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[11px] text-slate-600">
          <Calendar className="h-3 w-3" />
          {formatDate(lead.createdAt)}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100 text-slate-500 text-[11px] px-2 py-0.5 font-medium">
          {lead.partner}
        </span>
        <ZayavkaBadge zayavka={lead.zayavka} compact />
        {lead.activityType && (
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 text-[11px] px-2 py-0.5 border border-slate-100">
            {lead.activityType}
          </span>
        )}
      </div>

      {/* Status */}
      {lead.status && <StatusBadge status={lead.status} compact />}

      {/* Comment */}
      {lead.comment && (
        <div className="flex items-start gap-1.5 text-[12.5px] text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
          <p className="leading-relaxed break-words">{lead.comment}</p>
        </div>
      )}

      {/* Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
        <div className="flex items-center gap-1 text-slate-500">
          <User className="h-3 w-3" />
          <span className="text-foreground">{lead.manager}</span>
        </div>
        {lead.contactInfo && (
          <div className="flex items-center gap-1 text-slate-500">
            <Phone className="h-3 w-3" />
            <span className="text-foreground">{lead.contactInfo}</span>
          </div>
        )}
        {!isVTB && lead.margin && (
          <span className="text-slate-500">
            Маржа: <span className="text-foreground">{lead.margin}%</span>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-slate-100">
        <Button variant="outline" className="h-10 text-sm flex-1 rounded-xl border-slate-200/80 bg-slate-50 text-slate-500 hover:text-foreground hover:bg-slate-100" onClick={() => openDetails(lead)}>
          <Eye className="h-3.5 w-3.5" />
          Подробнее
        </Button>
        {!isVTB && showDelete && isAdmin && (
          <Button
            variant="outline"
            className="h-10 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border-slate-200/80 bg-slate-50 rounded-xl"
            onClick={() => onDelete(lead.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
