'use client'

import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import { StatusBadge, ZayavkaBadge, getSlaDays, getSlaBadgeClass, isNewLead, getZayavkaRowClass } from '@/lib/status'
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
  const slaDays = getSlaDays(lead.updatedAt)

  return (
    <motion.div
      variants={listItem}
      className={cn(
        'rounded-xl border bg-card px-4 py-3.5 space-y-2.5 shadow-card active:scale-[0.99] transition-all duration-150 border-l-[2.5px]',
        getZayavkaRowClass(lead.zayavka),
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-semibold text-[14.5px] leading-tight truncate">{lead.organization}</span>
          {slaDays >= 3 && (
            <span className={cn('inline-flex items-center rounded-md border text-[10px] font-bold tabular-nums px-1.5 py-0 shrink-0', getSlaBadgeClass(slaDays))}>
              {slaDays}д
            </span>
          )}
          {isNewLead(lead.createdAt) && <NewBadge />}
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[11px] text-muted-foreground/60">
          <Calendar className="h-3 w-3" />
          {formatDate(lead.createdAt)}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-md border border-border/70 bg-muted/60 text-foreground/70 text-[11px] px-2 py-0.5 font-medium">
          {lead.partner}
        </span>
        <ZayavkaBadge zayavka={lead.zayavka} compact />
        {lead.activityType && (
          <span className="inline-flex items-center rounded-full bg-muted/60 text-muted-foreground text-[11px] px-2 py-0.5">
            {lead.activityType}
          </span>
        )}
      </div>

      {/* Status */}
      {lead.status && <StatusBadge status={lead.status} compact />}

      {/* Comment */}
      {lead.comment && (
        <div className="flex items-start gap-1.5 text-[12.5px] text-muted-foreground bg-muted/40 rounded-lg p-2.5">
          <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
          <p className="leading-relaxed break-words">{lead.comment}</p>
        </div>
      )}

      {/* Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="text-foreground">{lead.manager}</span>
        </div>
        {lead.contactInfo && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span className="text-foreground">{lead.contactInfo}</span>
          </div>
        )}
        {!isVTB && lead.margin && (
          <span className="text-muted-foreground">
            Маржа: <span className="text-foreground">{lead.margin}%</span>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-border/60">
        <Button variant="outline" className="h-10 text-sm flex-1 rounded-lg" onClick={() => openDetails(lead)}>
          <Eye className="h-3.5 w-3.5" />
          Подробнее
        </Button>
        {!isVTB && showDelete && isAdmin && (
          <Button
            variant="outline"
            className="h-10 text-sm text-destructive hover:text-destructive hover:bg-destructive/8 rounded-lg"
            onClick={() => onDelete(lead.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
