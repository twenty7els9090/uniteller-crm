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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingDown,
  MoreHorizontal,
  Loader2,
  Pencil,
  Check,
  X,
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

// ─── Inline editable text cell ───
function EditableTextCell({
  value,
  onSave,
  maxLength = 200,
  className = '',
  placeholder = '—',
  numericOnly = false,
  formatter,
}: {
  value: string
  onSave: (val: string) => void
  maxLength?: number
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
    ? (formatter ? formatter(value) : value)
    : placeholder

  if (!editing) {
    return (
      <span
        className={cn(
          'inline-block rounded px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-accent text-sm w-full',
          !value && 'text-muted-foreground italic',
          className
        )}
        onClick={() => setEditing(true)}
        title={value || 'Нажмите для редактирования'}
      >
        <span className="truncate block">{displayValue}</span>
      </span>
    )
  }

  return (
    <Input
      ref={inputRef}
      type={numericOnly ? 'number' : 'text'}
      inputMode={numericOnly ? 'decimal' : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit() }
        if (e.key === 'Escape') cancel()
      }}
      maxLength={maxLength}
      disabled={saving}
      className="h-7 text-sm min-w-[100px] border-primary"
    />
  )
}

// ─── Inline editable select cell ───
function EditableSelectCell({
  value,
  options,
  onSave,
  getBadge,
  disabled = false,
}: {
  value: string
  options: { value: string; label: string }[]
  onSave: (val: string) => void
  getBadge?: (val: string) => React.ReactNode
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleSave(val: string) {
    if (val === value) { setEditing(false); return }
    setSaving(true)
    onSave(val)
    setSaving(false)
    setEditing(false)
  }

  if (editing && !disabled) {
    return (
      <Select value={value} onValueChange={handleSave} open={editing} onOpenChange={setEditing}>
        <SelectTrigger className="h-7 text-sm min-w-[160px] border-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-accent',
        disabled && 'cursor-default'
      )}
      onClick={() => !disabled && setEditing(true)}
      title={disabled ? undefined : 'Нажмите для редактирования'}
    >
      {getBadge ? getBadge(value) : <Badge variant="outline" className="text-xs justify-start">{value}</Badge>}
    </span>
  )
}

// ─── Inline editable comment cell ───
function EditableCommentCell({ value, onSave }: { value: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
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

  if (!editing) {
    return (
      <span
        className="inline-block rounded px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-accent text-sm w-full max-w-[250px]"
        onClick={() => setEditing(true)}
        title={value || 'Нажмите для редактирования'}
      >
        <span className={cn('truncate block', !value && 'text-muted-foreground italic')}>
          {value || '—'}
        </span>
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        className="h-auto text-sm min-w-[200px] border-primary resize-none"
        disabled={saving}
      />
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={commit}>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancel}>
          <X className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  )
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

  const dynamicManagers = settings.manager.length > 0 ? settings.manager : [...MANAGERS]

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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <motion.div variants={slideUp} initial="hidden" animate="visible">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">Оттоки</h2>
            <Badge variant="secondary" className="text-xs">{filteredChurns.length} записей</Badge>
          </div>
          {!readOnly && (
            <Button onClick={() => setFormOpen(true)} size="sm">
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
            className="pl-9 h-11 md:h-9"
          />
        </div>
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
                      className="whitespace-nowrap text-xs uppercase text-muted-foreground font-semibold px-2 first:pl-3 last:pr-3"
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
                    <p className="text-muted-foreground">Оттоков пока нет</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Всего: <span className="font-medium text-foreground">{filteredChurns.length}</span> записей
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
            const churn = row.original
            return (
              <motion.div key={row.id} variants={slideUp}>
              <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
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
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">Оттоков пока нет</p>
          </div>
        )}

        {/* Mobile pagination */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{filteredChurns.length}</span> записей
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
