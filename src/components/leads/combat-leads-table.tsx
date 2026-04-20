'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Swords, MoreHorizontal, Trash2, ArrowLeft, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Format number as currency: 1500000 → "1.500.000 Р"
function formatCurrency(value: string | number | undefined | null): string {
  if (!value && value !== 0) return '—'
  const num = typeof value === 'string'
    ? parseFloat(value.replace(/\s/g, '').replace(',', '.'))
    : value
  if (isNaN(num)) return '—'

  const fixed = Math.abs(num).toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const decimals = decPart === '00' ? '' : `,${decPart.replace(/0+$/, '')}`
  const prefix = num < 0 ? '-' : ''
  return `${prefix}${formattedInt}${decimals} Р`
}

interface CombatLeadsTableProps {
  readOnly?: boolean
}

// ─── Inline editable text cell (numeric) ───
function EditableNumberCell({
  value,
  onSave,
  suffix = '',
  placeholder = '—',
  readOnly = false,
  formatter,
}: {
  value: string
  onSave: (val: string) => void
  suffix?: string
  placeholder?: string
  readOnly?: boolean
  formatter?: (val: string) => string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState((value ?? '').replace('%', ''))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync draft when value changes externally (only when not editing)
  useEffect(() => {
    const cleanValue = (value ?? '').replace('%', '')
    if (!editing) setDraft(cleanValue)
  }, [value, editing])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed === value) { setEditing(false); return }
    setSaving(true)
    onSave(trimmed)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  const displayValue = value
    ? (formatter ? formatter(value) : `${value}${suffix}`)
    : placeholder

  if (!editing) {
    return (
      <span
        className="inline-block rounded px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-accent text-sm"
        onClick={() => !readOnly && setEditing(true)}
        title={!readOnly ? 'Нажмите для редактирования' : undefined}
      >
        <span className={cn('block', !value && 'text-muted-foreground italic')}>
          {displayValue}
        </span>
      </span>
    )
  }

  return (
    <Input
      ref={inputRef}
      type="number"
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit() }
        if (e.key === 'Escape') cancel()
      }}
      disabled={saving}
      className="h-7 text-sm min-w-[100px] border-primary"
    />
  )
}

export function CombatLeadsTable({ readOnly = false }: CombatLeadsTableProps) {
  const user = useAppStore((s) => s.user)
  const isVTB = user?.role === 'vtb'
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)

  // Фильтруем только боевые лиды
  const combatLeads = useMemo(() => {
    return allLeads.filter((l) =>
      l.zayavka === 'Выполнена' || l.status === 'пошли боевые платежи'
    )
  }, [allLeads])

  const filteredLeads = useMemo(() => {
    let result = globalFilter
      ? combatLeads.filter((l) =>
          l.organization.toLowerCase().includes(globalFilter.toLowerCase()) ||
          l.partner.toLowerCase().includes(globalFilter.toLowerCase())
        )
      : combatLeads
    // Не внесённые в отчёт (reported = false) — сверху
    result = [...result].sort((a, b) => {
      if (a.reported === b.reported) return 0
      return a.reported ? 1 : -1
    })
    return result
  }, [combatLeads, globalFilter])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        setAllLeads(data)
      }
    } catch {
      toast.error('Ошибка загрузки боевых лидов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const leadsRef = useRef(allLeads)
  leadsRef.current = allLeads

  const inlineSave = useCallback(async (leadId: string, field: string, value: string | boolean) => {
    try {
      const lead = leadsRef.current.find((l) => l.id === leadId)
      if (!lead) return

      const body: Record<string, unknown> = { ...lead, [field]: value }

      // Auto-calculate revenue when turnover or margin changes
      if (field === 'turnoverTsp' || field === 'margin') {
        const t = parseFloat(String(field === 'turnoverTsp' ? value : lead.turnoverTsp)) || 0
        const m = parseFloat(String(field === 'margin' ? value : lead.margin)) || 0
        if (t && m) {
          body.revenue = (t * m / 100).toFixed(2)
        } else {
          body.revenue = ''
        }
      }

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const columnVisibility = useMemo(() => ({
    margin: !showComments,
    comment: showComments,
  }), [showComments])

  const columns: ColumnDef<Lead>[] = useMemo(() => [
    {
      accessorKey: 'partner',
      header: 'Партнёр',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs min-w-[80px] justify-start">
          {row.original.partner}
        </Badge>
      ),
    },
    {
      accessorKey: 'organization',
      header: 'Организация (наименование в ЛК)',
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.organization}</span>
      ),
    },
    {
      accessorKey: 'turnoverTsp',
      header: 'Оборот ТСП',
      cell: ({ row }) => {
        const lead = row.original
        return readOnly ? (
          <span className="text-sm font-medium whitespace-nowrap">{formatCurrency(lead.turnoverTsp)}</span>
        ) : (
          <EditableNumberCell
            value={lead.turnoverTsp}
            onSave={(val) => inlineSave(lead.id, 'turnoverTsp', val)}
            placeholder="—"
            formatter={formatCurrency}
          />
        )
      },
    },
    {
      accessorKey: 'margin',
      header: 'Маржа',
      cell: ({ row }) => {
        const lead = row.original
        return readOnly ? (
          <span className="text-sm text-muted-foreground">{lead.margin ? `${lead.margin}%` : '—'}</span>
        ) : (
          <EditableNumberCell
            value={lead.margin}
            onSave={(val) => inlineSave(lead.id, 'margin', val)}
            suffix="%"
            placeholder="—"
          />
        )
      },
    },
    {
      accessorKey: 'revenue',
      header: 'Выручка',
      cell: ({ row }) => {
        const lead = row.original
        const turnover = parseFloat(lead.turnoverTsp) || 0
        const margin = parseFloat(lead.margin) || 0
        const calc = turnover && margin ? (turnover * margin / 100).toFixed(2) : ''
        const display = lead.revenue || calc
        return (
          <span className="text-sm font-medium whitespace-nowrap">{formatCurrency(display)}</span>
        )
      },
    },
    {
      accessorKey: 'reported',
      header: 'Внесено в отчёт?',
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div className="flex justify-center">
            <Checkbox
              checked={lead.reported}
              disabled={readOnly}
              onCheckedChange={(checked) => {
                inlineSave(lead.id, 'reported', !!checked)
              }}
            />
          </div>
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
          <div className="max-w-[300px] min-w-[150px]">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{lead.comment}</p>
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        if (readOnly) return null
        const lead = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleReturnToLeads(lead.id)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуть в лиды
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(lead.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [readOnly, inlineSave])

  const visibleColumns = useMemo(() => {
    if (!isVTB) return columns
    return columns.filter((col) =>
      col.accessorKey !== 'margin' && col.accessorKey !== 'revenue' && col.accessorKey !== 'reported'
    )
  }, [columns, isVTB])

  const table = useReactTable({
    data: filteredLeads,
    columns: visibleColumns,
    state: { columnFilters, globalFilter, columnVisibility },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  })

  async function handleReturnToLeads(leadId: string) {
    try {
      const lead = leadsRef.current.find((l) => l.id === leadId)
      if (!lead) return
      const body = { ...lead, zayavka: 'В работе', status: '' }
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        setAllLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
        toast.success('Лид возвращён в работу')
      } else {
        toast.error('Ошибка')
      }
    } catch {
      toast.error('Ошибка соединения')
    }
  }

  async function handleDelete() {
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-4">
          <Swords className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Боевые лиды</h2>
          <Badge variant="secondary" className="text-xs">{filteredLeads.length} записей</Badge>
        </div>
      </motion.div>

      {!readOnly && (
        <p className="mb-3 text-xs text-muted-foreground hidden md:block">
          Лиды со статусом заявки «Выполнена» или статусом «пошли боевые платежи». Нажмите на ячейку для редактирования.
        </p>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по организации или партнёру..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-11 md:h-9"
          />
        </div>
        <Button
          variant={showComments ? 'default' : 'outline'}
          size="sm"
          className={cn('h-9 md:h-9 text-sm shrink-0 gap-1.5', showComments && 'bg-primary hover:bg-primary/90 text-primary-foreground')}
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Комментарий
        </Button>
      </div>

      {/* ─── Desktop Table ─── */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap text-xs uppercase text-muted-foreground font-semibold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <p className="text-muted-foreground">Боевых лидов пока нет</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Всего: <span className="font-medium text-foreground">{filteredLeads.length}</span> записей
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3">
              {table.getState().pagination.pageIndex + 1} из {table.getPageCount()}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Mobile Card View ─── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="md:hidden space-y-3">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const lead = row.original
            return (
              <motion.div key={row.id} variants={slideUp}>
              <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm leading-tight">{lead.organization}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{lead.partner}</Badge>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Оборот ТСП</p>
                    {readOnly ? (
                      <span className="font-medium whitespace-nowrap">{formatCurrency(lead.turnoverTsp)}</span>
                    ) : (
                      <EditableNumberCell
                        value={lead.turnoverTsp}
                        onSave={(val) => inlineSave(lead.id, 'turnoverTsp', val)}
                        placeholder="—"
                        formatter={formatCurrency}
                      />
                    )}
                  </div>
                  {!isVTB && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Маржа</p>
                    {readOnly ? (
                      <span className="font-medium">{lead.margin ? `${lead.margin}%` : '—'}</span>
                    ) : (
                      <EditableNumberCell
                        value={lead.margin}
                        onSave={(val) => inlineSave(lead.id, 'margin', val)}
                        suffix="%"
                        placeholder="—"
                      />
                    )}
                  </div>
                  )}
                  {!isVTB && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Выручка</p>
                    <span className="font-medium whitespace-nowrap">
                      {formatCurrency(
                        lead.revenue || (() => {
                          const t = parseFloat(lead.turnoverTsp) || 0
                          const m = parseFloat(lead.margin) || 0
                          return t && m ? (t * m / 100).toFixed(2) : ''
                        })()
                      )}
                    </span>
                  </div>
                  )}
                  {!isVTB && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={lead.reported}
                      disabled={readOnly}
                      onCheckedChange={(checked) => inlineSave(lead.id, 'reported', !!checked)}
                    />
                    <span className="text-muted-foreground">В отчёте</span>
                  </div>
                  )}
                </div>

                {/* Action buttons — mobile */}
                {!readOnly && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 text-sm rounded-lg flex-1"
                      onClick={() => handleReturnToLeads(lead.id)}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      Вернуть
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 text-sm rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(lead.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Удалить
                    </Button>
                  </div>
                )}
              </div>
              </motion.div>
            )
          })
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">Боевых лидов пока нет</p>
          </div>
        )}

        {/* Mobile pagination */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{filteredLeads.length}</span> записей
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-10 w-10"
              onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10"
              onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">
              {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
            </span>
            <Button variant="outline" size="icon" className="h-10 w-10"
              onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить боевой лид?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Лид будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
