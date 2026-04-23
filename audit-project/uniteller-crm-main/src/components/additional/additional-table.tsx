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
import type { Additional } from '@/lib/types'
import { useSettings } from '@/hooks/use-settings'
import { PARTNERS } from '@/lib/constants'
import { AdditionalFormDialog } from './additional-form-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Plug, MoreHorizontal, Loader2, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'

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

// ─── Inline editable text cell ───
function EditableTextCell({
  value, onSave, className = '', placeholder = '—', numericOnly = false, formatter,
}: {
  value: string
  onSave: (val: string) => void
  className?: string
  placeholder?: string
  numericOnly?: boolean
  formatter?: (val: string) => string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed === value) { setEditing(false); return }
    setSaving(true); onSave(trimmed); setSaving(false); setEditing(false)
  }
  function cancel() { setDraft(value); setEditing(false) }

  const displayValue = value
    ? (formatter ? formatter(value) : value)
    : placeholder

  if (!editing) {
    return (
      <span
        className={cn('inline-block rounded px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-accent text-sm w-full', !value && 'text-muted-foreground italic', className)}
        onClick={() => setEditing(true)}
        title={value || 'Нажмите для редактирования'}
      >
        <span className="truncate block">{displayValue}</span>
      </span>
    )
  }

  return (
    <Input ref={inputRef} type={numericOnly ? 'number' : 'text'} inputMode={numericOnly ? 'decimal' : undefined}
      value={draft} onChange={(e) => setDraft(e.target.value)}
      onBlur={commit} disabled={saving}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() }; if (e.key === 'Escape') cancel() }}
      className="h-7 text-sm min-w-[100px] border-primary" />
  )
}

// ─── Inline editable select cell ───
function EditableSelectCell({
  value, options, onSave, getBadge, disabled = false,
}: {
  value: string
  options: { value: string; label: string }[]
  onSave: (val: string) => void
  getBadge?: (val: string) => React.ReactNode
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)

  function handleSave(val: string) {
    if (val === value) { setEditing(false); return }
    onSave(val); setEditing(false)
  }

  if (editing && !disabled) {
    return (
      <Select value={value} onValueChange={handleSave} open={editing} onOpenChange={setEditing}>
        <SelectTrigger className="h-7 text-sm min-w-[120px] border-primary"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <span
      className={cn('inline-flex items-center rounded px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-accent', disabled && 'cursor-default')}
      onClick={() => !disabled && setEditing(true)}
      title={disabled ? undefined : 'Нажмите для редактирования'}
    >
      {getBadge ? getBadge(value) : <Badge variant="outline" className="text-xs justify-start">{value}</Badge>}
    </span>
  )
}

interface AdditionalTableProps {
  readOnly?: boolean
}

export function AdditionalTable({ readOnly = false }: AdditionalTableProps) {
  const user = useAppStore((s) => s.user)
  const { settings } = useSettings()
  const [allRecords, setAllRecords] = useState<Additional[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<Additional | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const dynamicPartners = settings.partner.length > 0 ? settings.partner : [...PARTNERS]

  const filtered = useMemo(() => {
    if (!globalFilter) return allRecords
    const q = globalFilter.toLowerCase()
    return allRecords.filter((r) =>
      r.organization.toLowerCase().includes(q) ||
      r.partner.toLowerCase().includes(q) ||
      r.finInstrument.toLowerCase().includes(q)
    )
  }, [allRecords, globalFilter])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/additional')
      if (res.ok) setAllRecords(await res.json())
    } catch { toast.error('Ошибка загрузки') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const ref = useRef(allRecords)
  ref.current = allRecords

  const inlineSave = useCallback(async (id: string, field: string, value: string) => {
    try {
      const rec = ref.current.find((r) => r.id === id)
      if (!rec) return
      const res = await fetch(`/api/additional/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rec, [field]: value }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAllRecords((prev) => prev.map((r) => (r.id === id ? updated : r)))
        toast.success('Сохранено')
      } else { toast.error('Ошибка сохранения'); fetchRecords() }
    } catch { toast.error('Ошибка соединения'); fetchRecords() }
  }, [fetchRecords])

  const isVTB = user?.role === 'vtb'
  const isAdmin = user?.role === 'uniteller'

  const columns: ColumnDef<Additional>[] = useMemo(() => [
    {
      accessorKey: 'organization',
      header: 'Организация',
      cell: ({ row }) => (
        <EditableTextCell value={row.original.organization} onSave={(val) => inlineSave(row.original.id, 'organization', val)} className="font-medium" placeholder="—" />
      ),
    },
    {
      accessorKey: 'partner',
      header: 'Партнёр',
      cell: ({ row }) => (
        <EditableSelectCell
          value={row.original.partner}
          options={dynamicPartners.map((p) => ({ value: p, label: p }))}
          onSave={(val) => inlineSave(row.original.id, 'partner', val)}
          getBadge={(val) => <Badge variant="outline" className="text-xs justify-start">{val}</Badge>}
          disabled={isVTB}
        />
      ),
    },
    {
      accessorKey: 'finInstrument',
      header: 'Фин. инструмент',
      cell: ({ row }) => (
        <EditableTextCell value={row.original.finInstrument} onSave={(val) => inlineSave(row.original.id, 'finInstrument', val)} placeholder="—" />
      ),
    },
    {
      accessorKey: 'turnover',
      header: 'Оборот',
      cell: ({ row }) => (
        <EditableTextCell value={row.original.turnover} onSave={(val) => inlineSave(row.original.id, 'turnover', val)} numericOnly formatter={formatCurrency} placeholder="—" />
      ),
    },
    {
      accessorKey: 'revenue',
      header: 'Выручка',
      cell: ({ row }) => (
        <EditableTextCell value={row.original.revenue} onSave={(val) => inlineSave(row.original.id, 'revenue', val)} numericOnly formatter={formatCurrency} placeholder="—" />
      ),
    },
    {
      id: 'actions',
      maxSize: 50,
      cell: ({ row }) => {
        if (readOnly) return null
        const rec = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditRecord(rec)}>
                <Pencil className="h-4 w-4 mr-2" />Редактировать
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(rec.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [readOnly, isVTB, isAdmin, inlineSave, dynamicPartners])

  const table = useReactTable({
    data: filtered, columns,
    state: { columnFilters, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  })

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/additional/${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Запись удалена'); fetchRecords() }
      else toast.error('Ошибка удаления')
    } catch { toast.error('Ошибка соединения') }
    finally { setDeleteId(null) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <>
      {/* Header */}
      <motion.div variants={slideUp} initial="hidden" animate="visible" className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Доп. подключение</h2>
          <Badge variant="secondary" className="text-xs">{filtered.length} записей</Badge>
        </div>
        {!readOnly && (
          <Button onClick={() => setFormOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />Внести информацию
          </Button>
        )}
      </motion.div>

      {!readOnly && (
        <p className="mb-3 text-xs text-muted-foreground hidden md:block">
          Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
        </p>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9 h-11 md:h-9" />
        </div>
      </div>

      {/* ─── Desktop Table ─── */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap text-xs uppercase text-muted-foreground font-semibold px-2 first:pl-3 last:pr-3">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="group">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-2 first:pl-3 last:pr-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <p className="text-muted-foreground">Записей пока нет</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Всего: <span className="font-medium text-foreground">{filtered.length}</span> записей
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm px-3">{table.getState().pagination.pageIndex + 1} из {table.getPageCount()}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* ─── Mobile Card View ─── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="md:hidden space-y-3">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const rec = row.original
            return (
              <motion.div key={row.id} variants={slideUp}>
              <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm leading-tight">{rec.organization}</span>
                  {rec.partner && <Badge variant="outline" className="text-xs shrink-0">{rec.partner}</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {rec.finInstrument && (
                    <div className="text-muted-foreground col-span-2">
                      Фин. инструмент: <span className="text-foreground">{rec.finInstrument}</span>
                    </div>
                  )}
                  {rec.turnover && (
                    <div className="text-muted-foreground">
                      Оборот: <span className="text-foreground font-medium">{formatCurrency(rec.turnover)}</span>
                    </div>
                  )}
                  {rec.revenue && (
                    <div className="text-muted-foreground">
                      Выручка: <span className="text-foreground font-medium">{formatCurrency(rec.revenue)}</span>
                    </div>
                  )}
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button variant="outline" size="sm" className="h-11 text-sm rounded-lg flex-1" onClick={() => setEditRecord(rec)}>
                      <Pencil className="h-3 w-3 mr-1" />Изменить
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" className="h-11 text-sm rounded-lg text-destructive" onClick={() => setDeleteId(rec.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />Удалить
                      </Button>
                    )}
                  </div>
                )}
              </div>
              </motion.div>
            )
          })
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">Записей пока нет</p>
          </div>
        )}

        {/* Mobile pagination */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{filtered.length}</span> записей</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-xs px-2">{table.getState().pagination.pageIndex + 1}/{table.getPageCount()}</span>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </motion.div>

      {/* Dialogs */}
      <AdditionalFormDialog open={formOpen} onOpenChange={setFormOpen} onSaved={fetchRecords} />
      <AdditionalFormDialog open={!!editRecord} onOpenChange={(open) => { if (!open) setEditRecord(null) }} record={editRecord} onSaved={fetchRecords} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
