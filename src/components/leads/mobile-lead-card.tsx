'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import {
  StatusBadge,
  ZayavkaBadge,
  getSlaDays,
  getSlaColorClass,
  isNewLead,
  getZayavkaRowClass,
} from '@/lib/status'
import { formatDate } from '@/lib/format'
import { motion } from 'framer-motion'
import { slideUp } from '@/lib/motion'
import { Building2, User, Calendar, Eye, Trash2 } from 'lucide-react'
import { NewBadge } from './desktop-lead-row'

// ─── MobileLeadCard ───
interface MobileLeadCardProps {
  lead: Lead
  isVTB: boolean
  isAdmin: boolean
  showDelete: boolean
  openDetails: (lead: Lead) => void
  onDelete: (id: string) => void
}

export function MobileLeadCard({
  lead,
  isVTB,
  isAdmin,
  showDelete,
  openDetails,
  onDelete,
}: MobileLeadCardProps) {
  return (
    <motion.div
      variants={slideUp}
      className={cn(
        'rounded-xl border bg-card p-4 space-y-3 transition-all duration-200 card-soft hover:card-soft-hover active:scale-[0.995]',
        getZayavkaRowClass(lead.zayavka),
      )}
    >
      {/* Header: org + date */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm leading-tight">{lead.organization}</span>
          {(() => { const d = getSlaDays(lead.updatedAt); return d > 0 ? <span className={cn('text-[10px] font-semibold shrink-0', getSlaColorClass(d))}>{d}д</span> : null })()}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(lead.createdAt)}</span>
          {isNewLead(lead.createdAt) && <NewBadge />}
        </div>
      </div>

      {/* Badges row: partner + zayavka */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-xs px-2 py-0.5 whitespace-nowrap">{lead.partner}</Badge>
        <ZayavkaBadge zayavka={lead.zayavka} compact hover />
        {lead.activityType && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">{lead.activityType}</Badge>
        )}
      </div>

      {/* Status */}
      {lead.status && <StatusBadge status={lead.status} compact hover />}

      {/* Comment */}
      {lead.comment && (
        <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-2.5 whitespace-pre-wrap break-words leading-relaxed">{lead.comment}</p>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div className="text-muted-foreground">
          <User className="inline h-3.5 w-3.5 mr-1" />
          <span className="text-foreground">{lead.manager}</span>
        </div>
        {lead.margin && !isVTB && (
          <div className="text-muted-foreground">
            Маржа: <span className="text-foreground">{lead.margin}%</span>
          </div>
        )}
        {lead.contactInfo && (
          <div className="text-muted-foreground col-span-2">
            <span className="text-foreground">{lead.contactInfo}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          variant="outline"
          className="h-11 text-sm flex-1 rounded-lg"
          onClick={() => openDetails(lead)}
        >
          <Eye className="h-4 w-4 mr-1.5" />
          Подробнее
        </Button>
        {!isVTB && showDelete && isAdmin && (
          <Button
            variant="outline"
            className="h-11 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
            onClick={() => onDelete(lead.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
