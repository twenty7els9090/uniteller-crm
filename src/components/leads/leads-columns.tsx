'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { Lead } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowUpDown, Eye, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  StatusBadge,
  ZayavkaBadge,
  getSlaDays,
  getSlaColorClass,
  getSlaTitle,
  getLeadPriority,
} from '@/lib/status'
import {
  InlinePhoneCell,
  EditableTextCell,
  EditableSelectCell,
} from '@/components/ui/editable-cells'

// ─── Skeleton loader rows ───
export function SkeletonRows({ count = 8 }: { count?: number }) {
  const widths = [200, 72, 88, 130, 110, 88, 60]
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="border-l-[3px] border-l-transparent">
          {widths.map((w, j) => (
            <TableCell key={j} className="py-2.5 px-2 first:pl-4">
              <div
                className="h-5 rounded-md bg-muted animate-pulse"
                style={{ width: w, opacity: 1 - i * 0.09 }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ─── Column definitions ───
export function getLeadColumns(params: {
  isVTB: boolean
  isAdmin: boolean
  showDelete: boolean
  inlineSave: (id: string, field: string, value: string) => Promise<void>
  openDetails: (lead: Lead) => void
  setDeleteId: (id: string | null) => void
  dynamicPartners: string[]
  dynamicManagers: string[]
  dynamicZayavka: string[]
  dynamicStatus: string[]
}): ColumnDef<Lead>[] {
  const { isVTB, isAdmin, showDelete, inlineSave, openDetails, setDeleteId, dynamicPartners, dynamicManagers, dynamicZayavka, dynamicStatus } = params

  return [
    {
      accessorKey: 'organization',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Организация
          <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const lead = row.original
        const slaDays = getSlaDays(lead.updatedAt)
        const slaTitle = getSlaTitle(lead.updatedAt)
        return isVTB ? (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate" title={lead.organization}>{lead.organization}</span>
            {slaDays > 0 && (
              <span className={cn('text-[10px] font-semibold shrink-0', getSlaColorClass(slaDays))} title={slaTitle ? `Обновлено: ${slaTitle}` : undefined}>
                {slaDays}д
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <EditableTextCell
              value={lead.organization}
              onSave={(val) => inlineSave(lead.id, 'organization', val)}
              maxLength={200}
              className="font-medium"
              placeholder="—"
            />
            {slaDays > 0 && (
              <span className={cn('text-[10px] font-semibold shrink-0', getSlaColorClass(slaDays))} title={slaTitle ? `Обновлено: ${slaTitle}` : undefined}>
                {slaDays}д
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'partner',
      header: 'Партнёр',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <EditableSelectCell
            value={lead.partner}
            options={dynamicPartners.map((p) => ({ value: p, label: p }))}
            onSave={(val) => inlineSave(lead.id, 'partner', val)}
            getBadge={(val) => <Badge variant="outline" className="text-xs justify-start">{val}</Badge>}
            disabled={isVTB}
          />
        )
      },
    },
    {
      accessorKey: 'zayavka',
      header: 'Заявка',
      sortingFn: (rowA, rowB) => {
        return getLeadPriority(rowA.original) - getLeadPriority(rowB.original)
      },
      cell: ({ row }) => {
        const lead = row.original
        return isVTB ? (
          <ZayavkaBadge zayavka={lead.zayavka} hover />
        ) : (
          <EditableSelectCell
            value={lead.zayavka}
            options={dynamicZayavka.map((z) => ({ value: z, label: z }))}
            onSave={(val) => inlineSave(lead.id, 'zayavka', val)}
            getBadge={(val) => <ZayavkaBadge zayavka={val} hover />}
          />
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <EditableSelectCell
            value={lead.status || ''}
            options={dynamicStatus.map((s) => ({ value: s, label: s }))}
            onSave={(val) => inlineSave(lead.id, 'status', val)}
            getBadge={(val) => val ? <StatusBadge status={val} hover /> : <span className="text-xs text-muted-foreground">—</span>}
            disabled={isVTB}
          />
        )
      },
    },
    {
      accessorKey: 'contactInfo',
      header: 'Контакты',
      cell: ({ row }) => {
        const lead = row.original
        return isVTB ? (
          <span className="text-sm">{lead.contactInfo || '—'}</span>
        ) : (
          <InlinePhoneCell value={lead.contactInfo} onSave={(val) => inlineSave(lead.id, 'contactInfo', val)} />
        )
      },
    },

    {
      accessorKey: 'manager',
      header: 'Менеджер',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <EditableSelectCell
            value={lead.manager}
            options={dynamicManagers.map((m) => ({ value: m, label: m }))}
            onSave={(val) => inlineSave(lead.id, 'manager', val)}
            getBadge={(val) => <Badge variant="outline" className="text-xs justify-start">{val}</Badge>}
            disabled={isVTB}
          />
        )
      },
    },
    {
      accessorKey: 'comment',
      header: 'Комментарий',
      cell: ({ row }) => {
        const lead = row.original
        if (!lead.comment) return <span className="text-sm text-muted-foreground italic">—</span>
        return (
          <div className="max-w-[400px] min-w-[200px]">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{lead.comment}</p>
          </div>
        )
      },
    },
    {
      id: 'details',
      maxSize: 100,
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => openDetails(lead)}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Подробнее
            </Button>
            {showDelete && isAdmin && !isVTB && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setDeleteId(lead.id)}
                title="Удалить"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
