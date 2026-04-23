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
  Plus,
  Loader2,
  Mail,
  Trash2,
  ChevronRight,
  XCircle,
  PauseCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/motion'
import { formatCurrency } from '@/lib/format'
import {
  StatusBadge,
} from '@/lib/status'
import { LeadFormDialog } from './lead-form-dialog'
import { useLeads } from './use-leads'
import { useLeadActions } from './use-lead-actions'
import { getLeadColumns, SkeletonRows } from './leads-columns'
import { LeadsFilters } from './leads-filters'
import { DesktopLeadRow } from './desktop-lead-row'
import { MobileLeadCard } from './mobile-lead-card'
import { cn } from '@/lib/utils'
interface LeadsTableProps {
  showFilters?: boolean
  showDelete?: boolean
}

// ─── Archive Folder Row (desktop) ───
function ArchiveFolderRow({
  icon: Icon,
  label,
  count,
  expanded,
  onClick,
  colorClass,
}: {
  icon: React.ElementType
  label: string
  count: number
  expanded: boolean
  onClick: () => void
  colorClass: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 border-l-[3px] hover:bg-accent/40',
        colorClass,
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0 opacity-60" />
      <span className="font-semibold text-sm">{label}</span>
      <Badge variant="secondary" className="text-[10px] tabular-nums font-bold">{count}</Badge>
      <div className="flex-1" />
      <ChevronRight className={cn(
        'h-4 w-4 text-muted-foreground transition-transform duration-200',
        expanded && 'rotate-90',
      )} />
    </button>
  )
}


export function LeadsTable({ showFilters = true, showDelete = true }: LeadsTableProps) {
  const data = useLeads()
  const actions = useLeadActions({
    allLeads: data.allLeads,
    setAllLeads: data.setAllLeads,
    fetchLeads: data.fetchLeads,
  })

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
    data: data.leads,
    columns,
    state: { sorting: data.sorting, columnFilters: data.columnFilters, globalFilter: data.globalFilter },
    onSortingChange: data.setSorting,
    onColumnFiltersChange: data.setColumnFilters,
    onGlobalFilterChange: data.setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 }, sorting: [{ id: 'zayavka', desc: false }] },
  })

  const currentRows = table.getRowModel().rows

  // ─── Loading state ───
  if (data.loading && data.leads.length === 0) {
    return (
      <>
        {!data.isVTB && (
          <p className="mb-3 text-xs text-muted-foreground hidden md:block">
            Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
          </p>
        )}
        <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2">
                {['Организация', 'Партнёр', 'Заявка', 'Статус', 'Контакты', 'Менеджер', ''].map((h) => (
                  <TableHead key={h} className="text-xs font-semibold text-muted-foreground px-2 first:pl-4 py-3">
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

  // Handle archive folder delete
  async function handleArchiveDelete(id: string) {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const { toast } = await import('sonner')
        toast.success('Запись удалена')
        data.setAllLeads((prev) => prev.filter((l) => l.id !== id))
      }
    } catch { /* silent */ }
  }

  return (
    <>
      {/* Hint — hidden on mobile */}
      {!data.isVTB && (
        <motion.div variants={slideUp} initial="hidden" animate="visible">
          <p className="mb-3 text-xs text-muted-foreground hidden md:block">
            Нажмите на ячейку для редактирования прямо в таблице. Изменения сохраняются автоматически.
          </p>
        </motion.div>
      )}

      {/* Toolbar */}
      <LeadsFilters
        showFilters={showFilters}
        isVTB={data.isVTB}
        globalFilter={data.globalFilter}
        onGlobalFilterChange={data.setGlobalFilter}
        onAddLead={() => actions.setFormOpen(true)}
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
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden card-soft">
        {/* Main leads rows */}
        <div className="divide-y">
          {currentRows.length ? currentRows.map((row) => (
            <DesktopLeadRow
              key={row.id}
              lead={row.original}
              isVTB={data.isVTB}
              isAdmin={data.isAdmin}
              showDelete={showDelete}
              inlineSave={data.inlineSave}
              openDetails={actions.openDetails}
              onDelete={actions.setDeleteId}
              dynamicPartners={data.dynamicPartners}
              dynamicManagers={data.dynamicManagers}
              dynamicZayavka={data.dynamicZayavka}
              dynamicStatus={data.dynamicStatus}
              dynamicActivityTypes={data.dynamicActivityTypes}
            />
          )) : (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <svg className="h-9 w-9 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">Лиды не найдены</p>
              {data.hasActiveFilters && (
                <button onClick={data.clearFilters} className="text-xs text-primary hover:underline mt-0.5">
                  Сбросить фильтры
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <DataTablePagination table={table} totalRows={data.leads.length} />

        {/* ─── Archive Folders ─── */}
        {(data.folderCounts.rejected > 0 || data.folderCounts.paused > 0) && (
          <div className="border-t-2 border-dashed">
            {/* Rejected folder */}
            {data.folderCounts.rejected > 0 && (
              <>
                <ArchiveFolderRow
                  icon={XCircle}
                  label="Отклонённые"
                  count={data.folderCounts.rejected}
                  expanded={data.expandedFolder === 'rejected'}
                  onClick={() => data.toggleFolder('rejected')}
                  colorClass="border-l-red-300"
                />
                <AnimatePresence>
                  {data.expandedFolder === 'rejected' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y max-h-[600px] overflow-y-auto">
                        {data.rejectedLeads.length ? data.rejectedLeads.map((lead) => (
                          <DesktopLeadRow
                            key={lead.id}
                            lead={lead}
                            isVTB={data.isVTB}
                            isAdmin={data.isAdmin}
                            showDelete={showDelete}
                            inlineSave={data.inlineSave}
                            openDetails={actions.openDetails}
                            onDelete={actions.setDeleteId}
                            dynamicPartners={data.dynamicPartners}
                            dynamicManagers={data.dynamicManagers}
                            dynamicZayavka={data.dynamicZayavka}
                            dynamicStatus={data.dynamicStatus}
                            dynamicActivityTypes={data.dynamicActivityTypes}
                          />
                        )) : (
                          <div className="py-6 text-center text-xs text-muted-foreground">Ничего не найдено</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Paused folder */}
            {data.folderCounts.paused > 0 && (
              <>
                <ArchiveFolderRow
                  icon={PauseCircle}
                  label="На паузе"
                  count={data.folderCounts.paused}
                  expanded={data.expandedFolder === 'paused'}
                  onClick={() => data.toggleFolder('paused')}
                  colorClass="border-l-orange-300"
                />
                <AnimatePresence>
                  {data.expandedFolder === 'paused' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y max-h-[600px] overflow-y-auto">
                        {data.pausedLeads.length ? data.pausedLeads.map((lead) => (
                          <DesktopLeadRow
                            key={lead.id}
                            lead={lead}
                            isVTB={data.isVTB}
                            isAdmin={data.isAdmin}
                            showDelete={showDelete}
                            inlineSave={data.inlineSave}
                            openDetails={actions.openDetails}
                            onDelete={actions.setDeleteId}
                            dynamicPartners={data.dynamicPartners}
                            dynamicManagers={data.dynamicManagers}
                            dynamicZayavka={data.dynamicZayavka}
                            dynamicStatus={data.dynamicStatus}
                            dynamicActivityTypes={data.dynamicActivityTypes}
                          />
                        )) : (
                          <div className="py-6 text-center text-xs text-muted-foreground">Ничего не найдено</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <motion.div className="md:hidden space-y-3 pb-24" variants={staggerContainer} initial="hidden" animate="visible">
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
            <p className="text-muted-foreground text-sm">Лиды не найдены</p>
          </div>
        )}

        {/* Mobile pagination */}
        <DataTablePagination table={table} totalRows={data.leads.length} variant="mobile" />

        {/* Mobile archive folders */}
        {(data.folderCounts.rejected > 0 || data.folderCounts.paused > 0) && (
          <div className="space-y-2 pt-2">
            {data.folderCounts.rejected > 0 && (
              <motion.div variants={slideUp}>
                <button
                  onClick={() => data.toggleFolder('rejected')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50/30 transition-all"
                >
                  <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                  <span className="font-semibold text-sm">Отклонённые</span>
                  <Badge variant="secondary" className="text-[10px] tabular-nums">{data.folderCounts.rejected}</Badge>
                  <div className="flex-1" />
                  <ChevronRight className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    data.expandedFolder === 'rejected' && 'rotate-90',
                  )} />
                </button>
                <AnimatePresence>
                  {data.expandedFolder === 'rejected' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 mt-2 max-h-[600px] overflow-y-auto">
                        {data.rejectedLeads.map((lead) => (
                          <MobileLeadCard
                            key={lead.id}
                            lead={lead}
                            isVTB={data.isVTB}
                            isAdmin={data.isAdmin}
                            showDelete={showDelete}
                            openDetails={actions.openDetails}
                            onDelete={actions.setDeleteId}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {data.folderCounts.paused > 0 && (
              <motion.div variants={slideUp}>
                <button
                  onClick={() => data.toggleFolder('paused')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50/30 transition-all"
                >
                  <PauseCircle className="h-4.5 w-4.5 text-orange-500 shrink-0" />
                  <span className="font-semibold text-sm">На паузе</span>
                  <Badge variant="secondary" className="text-[10px] tabular-nums">{data.folderCounts.paused}</Badge>
                  <div className="flex-1" />
                  <ChevronRight className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    data.expandedFolder === 'paused' && 'rotate-90',
                  )} />
                </button>
                <AnimatePresence>
                  {data.expandedFolder === 'paused' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 mt-2 max-h-[600px] overflow-y-auto">
                        {data.pausedLeads.map((lead) => (
                          <MobileLeadCard
                            key={lead.id}
                            lead={lead}
                            isVTB={data.isVTB}
                            isAdmin={data.isAdmin}
                            showDelete={showDelete}
                            openDetails={actions.openDetails}
                            onDelete={actions.setDeleteId}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {!data.isVTB && (
        <button
          onClick={() => actions.setFormOpen(true)}
          className="sm:hidden fixed right-4 bottom-28 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Новый лид"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* New Lead Dialog (only for creation) */}
      <LeadFormDialog
        open={actions.formOpen}
        onOpenChange={actions.setFormOpen}
        lead={null}
        onSaved={data.fetchLeads}
      />

      {/* Delete Confirmation — full height on mobile */}
      <AlertDialog open={!!actions.deleteId} onOpenChange={() => actions.setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить лид?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Лид будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={actions.handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Lead Detail Dialog ─── */}
      <Dialog open={!!actions.viewLead} onOpenChange={(open) => { if (!open) actions.setViewLead(null) }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold leading-tight pr-8">{actions.viewLead?.organization || 'Детали лида'}</DialogTitle>
            <DialogDescription>
              {actions.viewLead && (
                <span className="flex items-center gap-3 flex-wrap text-sm">
                  {actions.viewLead.partner && <Badge variant="outline">{actions.viewLead.partner}</Badge>}
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
                  <p className="text-muted-foreground mb-0.5">Менеджер</p>
                  <p className="font-medium">{actions.viewLead.manager || '—'}</p>
                </div>
                {actions.viewLead.turnoverTsp && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Оборот ТСП</p>
                    <p className="font-medium">{formatCurrency(actions.viewLead.turnoverTsp)}</p>
                  </div>
                )}
                {actions.viewLead.margin && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Маржа</p>
                    <p className="font-medium">{actions.viewLead.margin}%</p>
                  </div>
                )}
                {actions.viewLead.revenue && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Выручка</p>
                    <p className="font-medium">{formatCurrency(actions.viewLead.revenue)}</p>
                  </div>
                )}
                {actions.viewLead.activityType && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Вид деятельности</p>
                    <p className="font-medium">{actions.viewLead.activityType}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-0.5">Создан</p>
                  <p className="font-medium">{actions.viewLead.createdAt ? new Date(actions.viewLead.createdAt).toLocaleDateString('ru-RU') : '—'}</p>
                </div>
              </div>

              {/* Editable fields */}
              {!data.isVTB && (
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Маржа (%)</label>
                    <Input
                      type="number"
                      value={actions.marginDraft}
                      onChange={(e) => { actions.setEditing(true); actions.setMarginDraft(e.target.value) }}
                      placeholder="—"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Вид деятельности</label>
                    <Select value={actions.activityDraft} onValueChange={(val) => { actions.setEditing(true); actions.setActivityDraft(val) }}>
                      <SelectTrigger className="h-9">
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
                    <label className="text-sm font-medium mb-1.5 block">Комментарий</label>
                    <Textarea
                      value={actions.commentDraft}
                      onChange={(e) => { actions.setEditing(true); actions.setCommentDraft(e.target.value) }}
                      placeholder="Добавить комментарий..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}

              {data.isVTB && actions.viewLead.comment && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-1.5">Комментарий</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{actions.viewLead.comment}</p>
                </div>
              )}

              {/* Actions */}
              {!data.isVTB && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actions.setViewLead(null)}
                    >
                      Закрыть
                    </Button>
                    {actions.editing && (
                      <Button
                        size="sm"
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
                      className="text-destructive hover:text-destructive"
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
