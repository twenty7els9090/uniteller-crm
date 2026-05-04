'use client'

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  Mail,
  Trash2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import { formatCurrency } from '@/lib/format'
import { StatusBadge } from '@/lib/status'
import { useLeads } from './use-leads'
import { useLeadActions } from './use-lead-actions'
import { getLeadColumns, SkeletonRows } from './leads-columns'
import { LeadsFilters } from './leads-filters'
import { DesktopLeadRow } from './desktop-lead-row'
import { MobileLeadCard } from './mobile-lead-card'

interface LeadsTableProps {
  showFilters?: boolean
  showDelete?: boolean
}

export function LeadsTable({ showFilters = true, showDelete = true }: LeadsTableProps) {
  const data = useLeads()
  const actions = useLeadActions({
    setAllLeads: data.setAllLeads,
    fetchLeads: data.fetchLeads,
  })

  // Which leads to show in the table
  const displayLeads = data.expandedFolder === 'rejected'
    ? data.rejectedLeads
    : data.expandedFolder === 'paused'
      ? data.pausedLeads
      : data.leads

  const columns = getLeadColumns({
    isVTB: data.isVTB,
    isAdmin: data.isAdmin,
    showDelete,
    inlineSave: data.inlineSave,
    openDetails: actions.openDetails,
    setDeleteId: actions.setDeleteId,
    dynamicPartners: data.dynamicPartners,
    dynamicManagers: data.dynamicManagers,
    dynamicZayavka: data.dynamicZayavka,
    dynamicStatus: data.dynamicStatus,
  })

  const table = useReactTable({
    data: displayLeads,
    columns,
    state: { sorting: data.sorting, columnFilters: data.columnFilters },
    onSortingChange: data.setSorting,
    onColumnFiltersChange: data.setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 }, sorting: [{ id: 'zayavka', desc: false }] },
  })

  const currentRows = table.getRowModel().rows

  // Folder label for empty state
  const folderLabel = data.expandedFolder === 'rejected' ? 'Отклонённых' : data.expandedFolder === 'paused' ? 'На паузе' : null

  // ─── Loading state ───
  if (data.loading && data.leads.length === 0) {
    return (
      <>
        {!data.isVTB && (
          <p className="mb-3 text-xs text-slate-600 hidden md:block">
            Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
          </p>
        )}
        <div className="hidden md:block glass-card shadow-card rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-2 hover:bg-surface-2 border-b-2 border-slate-200/80">
                {['Организация', 'Партнёр', 'Заявка', 'Статус', 'Контакты', 'Менеджер', ''].map((h) => (
                  <TableHead key={h} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 first:pl-4 py-3">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <SkeletonRows count={10} />
            </TableBody>
          </Table>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Hint — hidden on mobile */}
      {!data.isVTB && (
        <motion.div variants={slideUp} initial="hidden" animate="visible">
          <p className="mb-3 text-xs text-slate-600 hidden md:block">
            Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
          </p>
        </motion.div>
      )}

      {/* Toolbar with folder buttons */}
      <LeadsFilters
        showFilters={showFilters}
        isVTB={data.isVTB}
        expandedFolder={data.expandedFolder}
        folderCounts={data.folderCounts}
        onToggleFolder={data.toggleFolder}
        partners={data.partners}
        managers={data.managers}
        dynamicZayavka={data.dynamicZayavka}
        dynamicStatus={data.dynamicStatus}
        partnerFilter={data.partnerFilter}
        zayavkaFilter={data.zayavkaFilter}
        statusFilter={data.statusFilter}
        managerFilter={data.managerFilter}
        hasActiveFilters={data.hasActiveFilters}
        onPartnerFilterChange={data.setPartnerFilter}
        onZayavkaFilterChange={data.setZayavkaFilter}
        onStatusFilterChange={data.setStatusFilter}
        onManagerFilterChange={data.setManagerFilter}
        onClearFilters={data.clearFilters}
      />

      {/* ─── Desktop Card-Table ─── */}
      <div className="hidden md:block glass-card shadow-card rounded-2xl border border-slate-100 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={data.expandedFolder || 'main'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="divide-y divide-slate-100"
          >
            {currentRows.length ? currentRows.map((row) => (
              <DesktopLeadRow
                key={row.id}
                lead={row.original}
                isVTB={data.isVTB}
                isAdmin={data.isAdmin}
                showDelete={showDelete}
                inlineSave={data.inlineSave}
                onDelete={actions.setDeleteId}
                dynamicPartners={data.dynamicPartners}
                dynamicManagers={data.dynamicManagers}
                dynamicZayavka={data.dynamicZayavka}
                dynamicStatus={data.dynamicStatus}
                dynamicActivityTypes={data.dynamicActivityTypes}
              />
            )) : (
              <div className="flex flex-col items-center gap-2 py-16 text-slate-600">
                <svg className="h-9 w-9 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">{folderLabel ? `${folderLabel} нет` : 'Лиды не найдены'}</p>
                {data.hasActiveFilters && (
                  <button onClick={data.clearFilters} className="text-xs text-primary hover:underline mt-0.5">
                    Сбросить фильтры
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        <DataTablePagination table={table} totalRows={displayLeads.length} />
      </div>

      {/* Mobile Card View */}
      <motion.div className="md:hidden space-y-3 pb-24" variants={staggerContainer} initial="hidden" animate="visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={data.expandedFolder || 'main'}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {currentRows.length ? (
              currentRows.map((row) => (
                <MobileLeadCard
                  key={row.id}
                  lead={row.original}
                  isVTB={data.isVTB}
                  isAdmin={data.isAdmin}
                  showDelete={showDelete}
                  openDetails={actions.openDetails}
                  onDelete={actions.setDeleteId}
                />
              ))
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600 text-sm">
                  {folderLabel ? `${folderLabel} нет` : 'Лиды не найдены'}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Mobile pagination */}
        <DataTablePagination table={table} totalRows={displayLeads.length} variant="mobile" />
      </motion.div>

      {/* Delete Confirmation — full height on mobile */}
      <AlertDialog open={!!actions.deleteId} onOpenChange={() => actions.setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg bg-surface-2 border-slate-200/80 rounded-2xl shadow-popover">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Удалить лид?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Это действие нельзя отменить. Лид будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-500 hover:text-foreground">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={actions.handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Lead Detail Dialog ─── */}
      <Dialog open={!!actions.viewLead} onOpenChange={(open) => { if (!open) actions.setViewLead(null) }}>
        <DialogContent className="sm:max-w-[560px] bg-surface-2 border-slate-200/80 rounded-2xl shadow-popover">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold leading-tight pr-8 text-foreground">{actions.viewLead?.organization || 'Детали лида'}</DialogTitle>
            <DialogDescription>
              {actions.viewLead && (
                <span className="flex items-center gap-3 flex-wrap text-sm text-slate-500">
                  {actions.viewLead.partner && <Badge variant="outline" className="border-slate-200/80 bg-slate-100 text-slate-500">{actions.viewLead.partner}</Badge>}
                  {actions.viewLead.contactInfo && <span>{actions.viewLead.contactInfo}</span>}
                  {actions.viewLead.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {actions.viewLead.email}
                    </span>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {actions.viewLead && (
            <div className="space-y-4">
              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {actions.viewLead.zayavka && <StatusBadge status={actions.viewLead.zayavka} hover />}
                {actions.viewLead.status && <StatusBadge status={actions.viewLead.status} hover />}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 mb-0.5">Менеджер</p>
                  <p className="font-medium text-foreground">{actions.viewLead.manager || '—'}</p>
                </div>
                {actions.viewLead.turnoverTsp && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Оборот ТСП</p>
                    <p className="font-medium text-foreground">{formatCurrency(actions.viewLead.turnoverTsp)}</p>
                  </div>
                )}
                {actions.viewLead.margin && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Маржа</p>
                    <p className="font-medium text-foreground">{actions.viewLead.margin}%</p>
                  </div>
                )}
                {actions.viewLead.revenue && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Выручка</p>
                    <p className="font-medium text-foreground">{formatCurrency(actions.viewLead.revenue)}</p>
                  </div>
                )}
                {actions.viewLead.activityType && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Вид деятельности</p>
                    <p className="font-medium text-foreground">{actions.viewLead.activityType}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 mb-0.5">Создан</p>
                  <p className="font-medium text-foreground">{actions.viewLead.createdAt ? new Date(actions.viewLead.createdAt).toLocaleDateString('ru-RU') : '—'}</p>
                </div>
              </div>

              {/* Editable fields */}
              {!data.isVTB && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div>
                    <label className="text-slate-500 text-sm font-medium mb-1.5 block">Маржа (%)</label>
                    <Input
                      type="number"
                      value={actions.marginDraft}
                      onChange={(e) => { actions.setEditing(true); actions.setMarginDraft(e.target.value) }}
                      placeholder="—"
                      className="h-9 bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm font-medium mb-1.5 block">Вид деятельности</label>
                    <Select value={actions.activityDraft} onValueChange={(val) => { actions.setEditing(true); actions.setActivityDraft(val) }}>
                      <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40">
                        <SelectValue placeholder="Выбрать..." />
                      </SelectTrigger>
                      <SelectContent>
                        {data.dynamicActivityTypes.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-slate-500 text-sm font-medium mb-1.5 block">Комментарий</label>
                    <Textarea
                      value={actions.commentDraft}
                      onChange={(e) => { actions.setEditing(true); actions.setCommentDraft(e.target.value) }}
                      placeholder="Добавить комментарий..."
                      rows={3}
                      className="resize-none bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {data.isVTB && actions.viewLead.comment && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-sm font-medium mb-1.5 text-slate-500">Комментарий</p>
                  <p className="text-sm text-slate-500 whitespace-pre-wrap">{actions.viewLead.comment}</p>
                </div>
              )}

              {/* Actions */}
              {!data.isVTB && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200/80 bg-slate-50 text-slate-500 hover:text-foreground hover:bg-slate-100"
                      onClick={() => actions.setViewLead(null)}
                    >
                      Закрыть
                    </Button>
                    {actions.editing && (
                      <Button
                        size="sm"
                        className="btn-primary"
                        onClick={actions.saveDetails}
                        disabled={actions.saving}
                      >
                        {actions.saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                        Сохранить
                      </Button>
                    )}
                  </div>
                  {showDelete && data.isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => { actions.setViewLead(null); actions.setDeleteId(actions.viewLead!.id) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Удалить
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
