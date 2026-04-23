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
import type { Churn } from '@/lib/types'
import { useSettings } from '@/hooks/use-settings'
import { MANAGERS, CHURN_STATUS_OPTIONS } from '@/lib/constants'
import { ChurnFormDialog } from './churn-form-dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Trash2,
  TrendingDown,
  MoreHorizontal,
  Loader2,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import { EditableTextCell, EditableSelectCell, EditableCommentCell } from '@/components/ui/editable-cells'
import { formatCurrency } from '@/lib/format'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

// Status badge colors
function getChurnStatusBadge(status: string) {
  const colors: Record<string, string> = {
    'демпинг': 'bg-red-100 text-red-800 hover:bg-red-100',
    'смена технического партнера': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    'ликвидация юл': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  }
  const color = colors[status] || 'bg-gray-100 text-gray-700 hover:bg-gray-100'
  return <Badge variant="default" className={cn(color, 'text-xs justify-start')}>{status}</Badge>
}

interface ChurnTableProps {
  readOnly?: boolean
}

export function ChurnTable({ readOnly = false }: ChurnTableProps) {
  const user = useAppStore((s) => s.user)
  const { settings } = useSettings()
  const [allChurns, setAllChurns] = useState<Churn[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editChurn, setEditChurn] = useState<Churn | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const dynamicManagers = useMemo(() => settings.manager.length > 0 ? settings.manager : [...MANAGERS], [settings.manager])

  const filteredChurns = useMemo(() => {
    if (!globalFilter) return allChurns
    const q = globalFilter.toLowerCase()
    return allChurns.filter((c) =>
      c.organization.toLowerCase().includes(q) ||
      c.comment?.toLowerCase().includes(q) ||
      c.manager.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q)
    )
  }, [allChurns, globalFilter])

  const fetchChurns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/churn')
      if (res.ok) {
        const data = await res.json()
        setAllChurns(data)
      }
    } catch {
      toast.error('Ошибка загрузки оттоков')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChurns() }, [fetchChurns])

  const churnsRef = useRef(allChurns)
  churnsRef.current = allChurns

  const inlineSave = useCallback(async (churnId: string, field: string, value: string | boolean) => {
    try {
      const churn = churnsRef.current.find((c) => c.id === churnId)
      if (!churn) return

      const res = await fetch(`/api/churn/${churnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...churn, [field]: value }),
      })

      if (res.ok) {
        const updated = await res.json()
        setAllChurns((prev) => prev.map((c) => (c.id === churnId ? updated : c)))
        toast.success('Сохранено')
      } else {
        toast.error('Ошибка сохранения')
        fetchChurns()
      }
    } catch {
      toast.error('Ошибка соединения')
      fetchChurns()
    }
  }, [fetchChurns])

  const isVTB = user?.role === 'vtb'
  const isAdmin = user?.role === 'uniteller'

  const columns: ColumnDef<Churn>[] = useMemo(() => [
    {
      accessorKey: 'organization',
      header: 'Организация',
      cell: ({ row }) => {
        const churn = row.original
        return (
          <EditableTextCell
            value={churn.organization}
            onSave={(val) => inlineSave(churn.id, 'organization', val)}
            maxLength={200}
            className="font-medium"
            placeholder="—"
          />
        )
      },
    },
    {
      accessorKey: 'turnoverTsp',
      header: 'Оборот ТСП',
      cell: ({ row }) => {
        const churn = row.original
        return (
          <EditableTextCell
            value={churn.turnoverTsp}
            onSave={(val) => inlineSave(churn.id, 'turnoverTsp', val)}
            numericOnly
            formatter={formatCurrency}
            placeholder="—"
          />
        )
      },
    },
    {
      accessorKey: 'revenue',
      header: 'Выручка',
      cell: ({ row }) => {
        const churn = row.original
        return (
          <EditableTextCell
            value={churn.revenue}
            onSave={(val) => inlineSave(churn.id, 'revenue', val)}
            numericOnly
            formatter={formatCurrency}
            placeholder="—"
          />
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => {
        const churn = row.original
        return (
          <EditableSelectCell
            value={churn.status}
            options={CHURN_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            onSave={(val) => inlineSave(churn.id, 'status', val)}
            getBadge={(val) => val ? getChurnStatusBadge(val) : <span className="text-xs text-muted-foreground">—</span>}
            disabled={isVTB}
          />
        )
      },
    },
    {
      accessorKey: 'comment',
      header: 'Комментарий',
      cell: ({ row }) => {
        const churn = row.original
        return (
          <EditableCommentCell
            value={churn.comment || ''}
            onSave={(val) => inlineSave(churn.id, 'comment', val)}
          />
        )
      },
    },
    {
      accessorKey: 'reported',
      header: 'Внесено в отчет?',
      cell: ({ row }) => {
        const churn = row.original
        return (
          <div className="flex justify-center">
            <Checkbox
              checked={churn.reported}
              disabled={readOnly}
              onCheckedChange={(checked) => {
                inlineSave(churn.id, 'reported', !!checked)
              }}
            />
          </div>
        )
      },
    },
    {
      accessorKey: 'manager',
      header: 'Менеджер',
      cell: ({ row }) => {
        const churn = row.original
        return (
          <EditableSelectCell
            value={churn.manager}
            options={dynamicManagers.map((m) => ({ value: m, label: m }))}
            onSave={(val) => inlineSave(churn.id, 'manager', val)}
            getBadge={(val) => <Badge variant="outline" className="text-xs justify-start">{val}</Badge>}
            disabled={isVTB}
          />
        )
      },
    },
    {
      id: 'actions',
      maxSize: 50,
      cell: ({ row }) => {
        if (readOnly) return null
        const churn = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditChurn(churn)}>
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteId(churn.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [readOnly, isVTB, isAdmin, inlineSave, dynamicManagers])

  const table = useReactTable({
    data: filteredChurns,
    columns,
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
      const res = await fetch(`/api/churn/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Отток удалён')
        fetchChurns()
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
      <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
        <Loader2 className="h-6 w-6 animate-pulse text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Загрузка...</span>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-xl p-2"><TrendingDown className="h-4 w-4 text-primary" /></div>
            <h2 className="text-lg font-semibold">Оттоки</h2>
            <Badge variant="secondary" className="text-xs">{filteredChurns.length} записей</Badge>
          </div>
          {!readOnly && (
            <Button onClick={() => setFormOpen(true)} size="sm" className="shadow-md shadow-primary/15">
              <Plus className="h-4 w-4 mr-2" />
              Внести информацию
            </Button>
          )}
        </div>
      </motion.div>

      {!readOnly && (
        <p className="mb-3 text-xs text-muted-foreground hidden md:block">
          Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
        </p>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по организации, комментарию, менеджеру..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-11 md:h-9 bg-white/80 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* ─── Desktop Table ─── */}
      <div className="hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden card-soft">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/30 hover:bg-muted/30 border-b">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-2 first:pl-3 last:pr-3"
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
                    <TrendingDown className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground text-sm">Оттоков пока нет</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <DataTablePagination table={table} totalRows={filteredChurns.length} variant="desktop" />
      </div>

      {/* ─── Mobile Card View ─── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="md:hidden space-y-3">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const churn = row.original
            return (
              <motion.div key={row.id} variants={slideUp}>
              <div className="rounded-xl border border-border/60 bg-card p-4 card-soft hover:card-soft-hover active:scale-[0.997] transition-all duration-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm leading-tight">{churn.organization}</span>
                  {churn.status && getChurnStatusBadge(churn.status)}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">{churn.manager || '—'}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {churn.turnoverTsp && (
                    <div className="text-muted-foreground">
                      Оборот: <span className="text-foreground font-medium">{formatCurrency(churn.turnoverTsp)}</span>
                    </div>
                  )}
                  {churn.revenue && (
                    <div className="text-muted-foreground">
                      Выручка: <span className="text-foreground font-medium">{formatCurrency(churn.revenue)}</span>
                    </div>
                  )}
                </div>

                {churn.comment && (
                  <p className="text-xs text-muted-foreground">{churn.comment}</p>
                )}

                <div className="flex items-center gap-2 pt-1 border-t">
                  <div className="flex items-center gap-2 min-h-[44px]">
                    <Checkbox checked={churn.reported} disabled={readOnly}
                      onCheckedChange={(checked) => inlineSave(churn.id, 'reported', !!checked)} />
                    <span className="text-xs text-muted-foreground">В отчёте</span>
                  </div>
                  {!readOnly && (
                    <div className="ml-auto flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-11 text-sm rounded-lg"
                        onClick={() => setEditChurn(churn)}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Изменить
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="sm"
                          className="h-11 text-sm rounded-lg text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(churn.id)}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Удалить
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              </motion.div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingDown className="h-8 w-8 mb-2 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground text-sm">Оттоков пока нет</p>
          </div>
        )}

        {/* Mobile pagination */}
        <DataTablePagination table={table} totalRows={filteredChurns.length} variant="mobile" />
      </motion.div>

      {/* Create / Edit Dialog */}
      <ChurnFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={fetchChurns}
      />
      <ChurnFormDialog
        open={!!editChurn}
        onOpenChange={(open) => { if (!open) setEditChurn(null) }}
        churn={editChurn}
        onSaved={fetchChurns}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отток?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Запись будет удалена навсегда.
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
