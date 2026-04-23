'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import {
  StatusBadge,
  ZayavkaBadge,
  getSlaDays,
  getSlaColorClass,
  getSlaTitle,
  isNewLead,
  getZayavkaRowClass,
} from '@/lib/status'
import { formatDate } from '@/lib/format'
import {
  InlinePhoneCell,
  EditableTextCell,
  EditableSelectCell,
} from '@/components/ui/editable-cells'
import { Mail, MessageSquare, Trash2 } from 'lucide-react'

export function NewBadge() {
  return (
    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border border-emerald-200/60 text-[10px] px-1.5 py-0 font-semibold">
      новый
    </Badge>
  )
}

// ─── DesktopLeadRow ───
interface DesktopLeadRowProps {
  lead: Lead
  isVTB: boolean
  isAdmin: boolean
  showDelete: boolean
  inlineSave: (id: string, field: string, value: string) => Promise<void>
  openDetails: (lead: Lead) => void
  onDelete: (id: string) => void
  dynamicPartners: string[]
  dynamicManagers: string[]
  dynamicZayavka: string[]
  dynamicStatus: string[]
  dynamicActivityTypes: string[]
}

export function DesktopLeadRow({
  lead,
  isVTB,
  isAdmin,
  showDelete,
  inlineSave,
  onDelete,
  dynamicPartners,
  dynamicManagers,
  dynamicZayavka,
  dynamicStatus,
  dynamicActivityTypes,
}: DesktopLeadRowProps) {
  const slaDays = getSlaDays(lead.updatedAt)

  return (
    <div
      className={cn(
        'group flex flex-col gap-1.5 px-4 py-3 hover:bg-slate-50/60 transition-all duration-150 border-l-[3px]',
        getZayavkaRowClass(lead.zayavka),
      )}
    >
      {/* ── Строка 1: Организация + Партнёр + Менеджер ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Организация */}
        <span className="shrink-0 flex items-center gap-1.5">
          {isVTB ? (
            <span className="font-semibold text-[15px] leading-tight text-foreground" title={lead.organization}>{lead.organization}</span>
          ) : (
            <EditableTextCell
              value={lead.organization}
              onSave={(val) => inlineSave(lead.id, 'organization', val)}
              className="font-semibold text-[15px]"
              placeholder="—"
            />
          )}
          <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap" title={`Создан: ${lead.createdAt ? new Date(lead.createdAt).toLocaleString('ru-RU') : ''}${lead.statusChangedAt ? `\nИзменён: ${new Date(lead.statusChangedAt).toLocaleString('ru-RU')}` : ''}`}>{formatDate(lead.statusChangedAt || lead.createdAt || '')}</span>
          {isNewLead(lead.createdAt) && <NewBadge />}
        </span>

        {/* Партнёр */}
        <span className="shrink-0">
          <EditableSelectCell
            value={lead.partner}
            options={dynamicPartners.map((p) => ({ value: p, label: p }))}
            onSave={(val) => inlineSave(lead.id, 'partner', val)}
            getBadge={(val) => <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium whitespace-nowrap border-border/60 hover:border-primary/30 transition-colors">{val}</Badge>}
            disabled={isVTB}
          />
        </span>

        {/* SLA + Менеджер + Delete — прижаты вправо */}
        <span className="shrink-0 ml-auto flex items-center gap-2">
          {/* Delete button — hover only */}
          {!isVTB && showDelete && isAdmin && (
            <button
              onClick={() => onDelete(lead.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
              title="Удалить лид"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {slaDays > 0 && (
            <span
              className={cn('text-[11px] font-bold shrink-0 tabular-nums', getSlaColorClass(slaDays))}
              title={`Обновлено: ${getSlaTitle(lead.updatedAt)}`}
            >
              {slaDays}
            </span>
          )}
          <EditableSelectCell
            value={lead.manager}
            options={dynamicManagers.map((m) => ({ value: m, label: m }))}
            onSave={(val) => inlineSave(lead.id, 'manager', val)}
            getBadge={(val) => <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium whitespace-nowrap border-border/60 hover:border-primary/30 transition-colors">{val}</Badge>}
            disabled={isVTB}
          />
        </span>

      </div>

      {/* ── Строка 2: Контакты ── */}
      <div className="flex items-center gap-3 flex-wrap pl-1">
        {/* Телефон */}
        <span className="flex items-center gap-1 text-[14px] text-muted-foreground shrink-0">
          <InlinePhoneCell value={lead.contactInfo} onSave={(val) => inlineSave(lead.id, 'contactInfo', val)} />
        </span>

        {/* Почта */}
        <span className="flex items-center gap-1 text-[14px] text-muted-foreground shrink-0">
          <Mail className="h-3 w-3 shrink-0" />
          <EditableTextCell
            value={lead.email || ''}
            onSave={(val) => inlineSave(lead.id, 'email', val)}
            placeholder="example@mail.ru"
            className="text-[14px]"
          />
        </span>
      </div>

      {/* ── Строка 3: Заявка + Статус + Маржа + Комментарий ── */}
      <div className="flex items-center gap-2 flex-wrap pl-1">
        {/* Заявка */}
        <div className="shrink-0">
          {isVTB ? <ZayavkaBadge zayavka={lead.zayavka} compact hover /> : (
            <EditableSelectCell
              value={lead.zayavka}
              options={dynamicZayavka.map((z) => ({ value: z, label: z }))}
              onSave={(val) => inlineSave(lead.id, 'zayavka', val)}
              getBadge={(val) => <ZayavkaBadge zayavka={val} compact hover />}
            />
          )}
        </div>

        {/* Статус */}
        <div className="shrink-0">
          <EditableSelectCell
            value={lead.status || ''}
            options={dynamicStatus.map((s) => ({ value: s, label: s }))}
            onSave={(val) => inlineSave(lead.id, 'status', val)}
            getBadge={(val) => val
              ? <StatusBadge status={val} compact hover />
              : <span className="text-sm text-muted-foreground/50 italic whitespace-nowrap">—</span>
            }
            disabled={isVTB}
          />
        </div>

        {/* Маржа */}
        {!isVTB && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            Маржа:
            <EditableTextCell
              value={lead.margin}
              onSave={(val) => inlineSave(lead.id, 'margin', val)}
              suffix="%" numericOnly placeholder="—"
              className="text-sm"
            />
          </span>
        )}

        {/* Вид деятельности */}
        <div className="shrink-0">
          <EditableSelectCell
            value={lead.activityType || ''}
            options={dynamicActivityTypes.map((a) => ({ value: a, label: a }))}
            onSave={(val) => inlineSave(lead.id, 'activityType', val)}
            getBadge={(val) => val
              ? <span className="text-sm bg-muted/70 px-1.5 py-0 rounded-full whitespace-nowrap">{val}</span>
              : null
            }
          />
        </div>

        {/* Комментарий */}
        {isVTB && lead.comment ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1 min-w-0">
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.comment}</span>
          </span>
        ) : !isVTB ? (
          <span className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
            <EditableTextCell
              value={lead.comment || ''}
              onSave={(val) => inlineSave(lead.id, 'comment', val)}
              placeholder="Добавить комментарий"
              className="text-sm text-muted-foreground"
            />
          </span>
        ) : null}
      </div>
    </div>
  )
}
