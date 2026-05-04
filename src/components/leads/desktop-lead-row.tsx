'use client'

import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import {
  StatusBadge, ZayavkaBadge,
  isNewLead, getZayavkaRowClass,
} from '@/lib/status'
import { formatDate } from '@/lib/format'
import { InlinePhoneCell, EditableTextCell, EditableSelectCell } from '@/components/ui/editable-cells'
import { Mail, MessageSquare, Trash2 } from 'lucide-react'

export function NewBadge() {
  return (
    <span className="inline-flex items-center rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] px-1.5 py-0 h-[17px] font-semibold leading-none border border-emerald-500/20">
      новый
    </span>
  )
}

interface DesktopLeadRowProps {
  lead: Lead
  isVTB: boolean
  isAdmin: boolean
  showDelete: boolean
  inlineSave: (id: string, field: string, value: string) => Promise<void>
  onDelete: (id: string) => void
  dynamicPartners: string[]
  dynamicManagers: string[]
  dynamicZayavka: string[]
  dynamicStatus: string[]
  dynamicActivityTypes: string[]
}

export function DesktopLeadRow({
  lead, isVTB, isAdmin, showDelete,
  inlineSave, onDelete,
  dynamicPartners, dynamicManagers, dynamicZayavka, dynamicStatus, dynamicActivityTypes,
}: DesktopLeadRowProps) {
  return (
    <div className={cn(
      'group flex flex-col gap-1 px-4 py-3 transition-all duration-150 border-l-[2.5px] row-hover',
      getZayavkaRowClass(lead.zayavka),
    )}>

      {/* ── Row 1: org + partner + manager ── */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Org name */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isVTB ? (
            <span className="font-semibold text-[15px] leading-tight text-foreground truncate">{lead.organization}</span>
          ) : (
            <EditableTextCell
              value={lead.organization}
              onSave={(val) => inlineSave(lead.id, 'organization', val)}
              className="font-semibold text-[15px]"
              placeholder="—"
            />
          )}
          <span
            className="text-[11px] text-slate-600 whitespace-nowrap shrink-0"
            title={`Создан: ${lead.createdAt ? new Date(lead.createdAt).toLocaleString('ru-RU') : ''}${lead.statusChangedAt ? `\nИзменён: ${new Date(lead.statusChangedAt).toLocaleString('ru-RU')}` : ''}`}
          >
            {formatDate(lead.statusChangedAt || lead.createdAt || '')}
          </span>
          {isNewLead(lead.createdAt) && <NewBadge />}
        </div>

        {/* Partner */}
        <div className="shrink-0">
          <EditableSelectCell
            value={lead.partner}
            options={dynamicPartners.map((p) => ({ value: p, label: p }))}
            onSave={(val) => inlineSave(lead.id, 'partner', val)}
            getBadge={(val) => (
              <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100 text-slate-500 text-[11.5px] px-2 py-0.5 font-medium whitespace-nowrap">
                {val}
              </span>
            )}
            disabled={isVTB}
          />
        </div>

        {/* Manager + Delete — right-aligned */}
        <div className="shrink-0 ml-auto flex items-center gap-1.5">
          <EditableSelectCell
            value={lead.manager}
            options={dynamicManagers.map((m) => ({ value: m, label: m }))}
            onSave={(val) => inlineSave(lead.id, 'manager', val)}
            getBadge={(val) => (
              <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100 text-slate-500 text-[11.5px] px-2 py-0.5 font-medium whitespace-nowrap">
                {val}
              </span>
            )}
            disabled={isVTB}
          />
          {!isVTB && showDelete && isAdmin && (
            <button
              onClick={() => onDelete(lead.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Row 2: zayavka + status + margin + activity ── */}
      <div className="flex items-center gap-2 flex-wrap pl-0.5">
        <div className="shrink-0">
          {isVTB
            ? <ZayavkaBadge zayavka={lead.zayavka} compact />
            : (
              <EditableSelectCell
                value={lead.zayavka}
                options={dynamicZayavka.map((z) => ({ value: z, label: z }))}
                onSave={(val) => inlineSave(lead.id, 'zayavka', val)}
                getBadge={(val) => <ZayavkaBadge zayavka={val} compact hover />}
              />
            )
          }
        </div>

        {lead.status && <span className="text-slate-600 text-xs shrink-0">→</span>}

        <div className="shrink-0">
          <EditableSelectCell
            value={lead.status || ''}
            options={dynamicStatus.map((s) => ({ value: s, label: s }))}
            onSave={(val) => inlineSave(lead.id, 'status', val)}
            getBadge={(val) => val
              ? <StatusBadge status={val} compact />
              : <span className="text-[11px] text-slate-600 italic">статус</span>
            }
            disabled={isVTB}
          />
        </div>

        {!isVTB && (
          <div className="flex items-center gap-1 text-[12px] text-slate-600 shrink-0">
            <span>%</span>
            <EditableTextCell
              value={lead.margin}
              onSave={(val) => inlineSave(lead.id, 'margin', val)}
              suffix="%" numericOnly placeholder="маржа"
              className="text-[12px]"
            />
          </div>
        )}

        <div className="shrink-0">
          <EditableSelectCell
            value={lead.activityType || ''}
            options={dynamicActivityTypes.map((a) => ({ value: a, label: a }))}
            onSave={(val) => inlineSave(lead.id, 'activityType', val)}
            getBadge={(val) => val
              ? <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 text-[11px] px-2 py-0.5 border border-slate-100 whitespace-nowrap">{val}</span>
              : null
            }
          />
        </div>
      </div>

      {/* ── Row 3: phone + email + comment ── */}
      <div className="flex items-center gap-3 flex-wrap pl-0.5">
        <span className="text-[13px] text-slate-500 shrink-0">
          <InlinePhoneCell value={lead.contactInfo} onSave={(val) => inlineSave(lead.id, 'contactInfo', val)} />
        </span>

        <span className="flex items-center gap-1 text-[13px] text-slate-500 shrink-0">
          <Mail className="h-3 w-3 shrink-0 opacity-50" />
          <EditableTextCell
            value={lead.email || ''}
            onSave={(val) => inlineSave(lead.id, 'email', val)}
            placeholder="email"
            className="text-[13px]"
          />
        </span>

        {isVTB && lead.comment ? (
          <span className="flex items-center gap-1.5 text-[13px] text-slate-500 flex-1 min-w-0">
            <MessageSquare className="h-3 w-3 shrink-0 opacity-50" />
            <span className="truncate">{lead.comment}</span>
          </span>
        ) : !isVTB ? (
          <span className="flex items-center gap-1.5 flex-1 min-w-0">
            <MessageSquare className="h-3 w-3 shrink-0 text-slate-600" />
            <EditableTextCell
              value={lead.comment || ''}
              onSave={(val) => inlineSave(lead.id, 'comment', val)}
              placeholder="комментарий..."
              className="text-[13px] text-slate-500"
            />
          </span>
        ) : null}
      </div>
    </div>
  )
}
