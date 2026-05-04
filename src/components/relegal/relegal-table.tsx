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
import type { Relegal } from '@/lib/types'
import { useSettings } from '@/hooks/use-settings'
import { MANAGERS } from '@/lib/constants'
import { RelegalFormDialog } from './relegal-form-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Trash2,
  Building2, MoreHorizontal, Loader2, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import { EditableTextCell, EditableSelectCell, EditableCommentCell } from '@/components/ui/editable-cells'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

interface RelegalTableProps {
  readOnly?: boolean
}

export function RelegalTable({ readOnly = false }: RelegalTableProps) {
  const user = useAppStore((s) => s.user)
  const storeGlobalSearch = useAppStore((s) => s.globalSearch)
  const { settings } = useSettings()
  const [allRecords, setAllRecords] = useState<Relegal[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<Relegal | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const dynamicManagers = useMemo(() => settings.manager.length > 0 ? settings.manager : [...MANAGERS], [settings.manager])

  const filtered = useMemo(() => {
    if (!globalFilter) return allRecords
    const q = globalFilter.toLowerCase()
    return allRecords.filter((r) =>
      (r.fromOrg || '').toLowerCase().includes(q) ||
      (r.toOrg || '').toLowerCase().includes(q) ||
      (r.action || '').toLowerCase().includes(q) ||
      (r.manager || '').toLowerCase().includes(q)
    )
  }, [allRecords, globalFilter])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/relegal')
      if (res.ok) setAllRecords(await res.json())
    } catch { toast.error('Ошибка загрузки') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])
  useEffect(() => { setGlobalFilter(storeGlobalSearch ?? '') }, [storeGlobalSearch])

  const ref = useRef(allRecords)
  ref.current = allRecords

  const inlineSave = useCallback(async (id: string, field: string, value: string) => {
    try {
      const rec = ref.current.find((r) => r.id === id)
      if (!rec) return
      const res = await fetch(`/api/relegal/${id}`, {
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

  const columns: ColumnDef<Relegal>[] = useMemo(() => [
    {
      accessorKey: 'fromOrg',
      header: 'С кого переключение?',
      cell: ({ row }) => (
        <EditableTextCell value={row.original.fromOrg} onSave={(val) => inlineSave(row.original.id, 'fromOrg', val)} className="font-medium" placeholder="—" />
      ),
    },
    {
      accessorKey: 'toOrg',
      header: 'На кого переключение?',
      cell: ({ row }) => (
        <EditableTextCell value={row.original.toOrg} onSave={(val) => inlineSave(row.original.id, 'toOrg', val)} className="font-medium" placeholder="—" />
      ),
    },
    {
      accessorKey: 'action',
      header: 'Что было сделано?',
      cell: ({ row }) => (
        <EditableCommentCell value={row.original.action || ''} onSave={(val) => inlineSave(row.original.id, 'action', val)} />
      ),
    },
    {
      accessorKey: 'manager',
      header: 'Менеджер',
      cell: ({ row }) => (
        <EditableSelectCell
          value={row.original.manager}
          options={dynamicManagers.map((m) => ({ value: m, label: m }))}
          onSave={(val) => inlineSave(row.original.id, 'manager', val)}
          getBadge={(val) => <Badge variant="outline" className="text-xs justify-start border-slate-200/80 bg-slate-100 text-zinc-400">{val}</Badge>}
          disabled={isVTB}
        />
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
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-foreground hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-surface-2 border-slate-200/80">
              <DropdownMenuItem onClick={() => setEditRecord(rec)} className="text-slate-600 focus:bg-slate-100 focus:text-foreground">
                <Pencil className="h-4 w-4 mr-2" />Редактировать
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/10" onClick={() => setDeleteId(rec.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [readOnly, isVTB, isAdmin, inlineSave, dynamicManagers])

  const table = useReactTable({
    data: filtered, columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  })

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/relegal/${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Запись удалена'); fetchRecords() }
      else toast.error('Ошибка удаления')
    } catch { toast.error('Ошибка соединения') }
    finally { setDeleteId(null) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-zinc-600" /></div>
  }

  return (
    <>
      {/* Header */}
      <motion.div variants={slideUp} initial="hidden" animate="visible" className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Смена юр.лиц</h2>
          <Badge variant="secondary" className="text-xs bg-slate-100 text-zinc-400 border border-slate-200/80">{filtered.length} записей</Badge>
        </div>
        {!readOnly && (
          <Button onClick={() => setFormOpen(true)} size="sm" className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />Внести информацию
          </Button>
        )}
      </motion.div>

      {!readOnly && (
        <p className="mb-3 text-xs text-zinc-600 hidden md:block">
          Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
        </p>
      )}

      {/* ─── Desktop Table ─── */}
      <div className="hidden md:block glass-card shadow-card rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-surface-2 hover:bg-surface-2 border-b border-slate-200/80">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap text-[11px] uppercase tracking-wider text-zinc-500 font-semibold px-2 first:pl-3 last:pr-3">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="group row-hover border-b border-slate-50">
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
                    <p className="text-zinc-600">Записей пока нет</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <DataTablePagination table={table} totalRows={filtered.length} variant="desktop" />
      </div>

      {/* ─── Mobile Card View ─── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="md:hidden space-y-3">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const rec = row.original
            return (
              <motion.div key={row.id} variants={slideUp}>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 glass-card shadow-card space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 shrink-0">С кого:</span>
                  <span className="text-sm font-medium truncate text-foreground">{rec.fromOrg || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 shrink-0">На кого:</span>
                  <span className="text-sm font-medium truncate text-foreground">{rec.toOrg || '—'}</span>
                </div>
                {rec.action && (
                  <p className="text-xs text-zinc-500">
                    <span className="font-medium text-foreground">Что сделано: </span>{rec.action}
                  </p>
                )}
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs border-slate-200/80 bg-slate-100 text-zinc-400">{rec.manager || '—'}</Badge>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Button variant="outline" size="sm" className="h-11 text-sm rounded-xl flex-1 border-slate-200/80 bg-slate-50 text-zinc-400 hover:text-foreground hover:bg-slate-100" onClick={() => setEditRecord(rec)}>
                      <Pencil className="h-3 w-3 mr-1" />Изменить
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" className="h-11 text-sm rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border-slate-200/80 bg-slate-50" onClick={() => setDeleteId(rec.id)}>
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
            <p className="text-zinc-600 text-sm">Записей пока нет</p>
          </div>
        )}

        {/* Mobile pagination */}
        <DataTablePagination table={table} totalRows={filtered.length} variant="mobile" />
      </motion.div>

      {/* Create / Edit Dialog */}
      <RelegalFormDialog open={formOpen} onOpenChange={setFormOpen} onSaved={fetchRecords} />
      <RelegalFormDialog open={!!editRecord} onOpenChange={(open) => { if (!open) setEditRecord(null) }} relegal={editRecord} onSaved={fetchRecords} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-surface-2 border-slate-200/80 rounded-2xl shadow-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-zinc-400 hover:text-foreground">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
