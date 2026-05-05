'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SlidersHorizontal, X, ChevronDown, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

function MultiSelectFilter({
  label, options, selected, onChange,
}: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const count = selected.length
  const allSelected = count === 0

  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 text-[12.5px] shrink-0 gap-1.5 justify-between font-normal min-w-[120px] sm:min-w-[150px] border-slate-200/80 bg-slate-50 text-slate-500 hover:text-foreground hover:bg-slate-100 hover:border-slate-200',
            count > 0 && 'border-green-600/30 bg-green-600/[0.06] text-green-400',
          )}
        >
          <span className="truncate">{allSelected ? label : `${label} (${count})`}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1.5 shadow-popover bg-surface-2 border-slate-200/80" align="start" sideOffset={4}>
        <div className="space-y-0.5">
          <button
            className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-[12.5px] hover:bg-slate-100 transition-colors"
            onClick={() => onChange([])}
          >
            <Checkbox checked={allSelected} className="h-3.5 w-3.5" />
            <span className={cn('font-medium', !allSelected && 'text-slate-500')}>Все</span>
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <div className="max-h-[180px] overflow-y-auto scrollbar-thin">
            {options.map((opt) => (
              <button
                key={opt}
                className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-[12.5px] hover:bg-slate-100 transition-colors text-left"
                onClick={() => toggle(opt)}
              >
                <Checkbox checked={selected.includes(opt)} className="h-3.5 w-3.5 shrink-0" />
                <span className={cn('truncate text-foreground', !selected.includes(opt) && 'text-slate-500')}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface LeadsFiltersProps {
  showFilters: boolean
  isVTB: boolean
  expandedFolder: 'rejected' | 'paused' | null
  folderCounts: { rejected: number; paused: number }
  onToggleFolder: (folder: 'rejected' | 'paused') => void
  partners: string[]
  managers: string[]
  dynamicZayavka: string[]
  dynamicStatus: string[]
  partnerFilter: string[]
  zayavkaFilter: string[]
  statusFilter: string[]
  managerFilter: string[]
  hasActiveFilters: boolean
  onPartnerFilterChange: (v: string[]) => void
  onZayavkaFilterChange: (v: string[]) => void
  onStatusFilterChange: (v: string[]) => void
  onManagerFilterChange: (v: string[]) => void
  onClearFilters: () => void
}

export function LeadsFilters({
  showFilters, isVTB,
  expandedFolder, folderCounts, onToggleFolder,
  partners, managers, dynamicZayavka, dynamicStatus,
  partnerFilter, zayavkaFilter, statusFilter, managerFilter,
  hasActiveFilters,
  onPartnerFilterChange, onZayavkaFilterChange, onStatusFilterChange, onManagerFilterChange,
  onClearFilters,
}: LeadsFiltersProps) {
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  return (
    <div className="space-y-2.5 mb-4">
      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap pb-0.5 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0 text-slate-600">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-[12px] font-medium whitespace-nowrap hidden sm:inline">Фильтры:</span>
          </div>

          <MultiSelectFilter label="Партнёр"  options={partners}          selected={partnerFilter}  onChange={onPartnerFilterChange} />
          <MultiSelectFilter label="Заявка"   options={[...dynamicZayavka]} selected={zayavkaFilter} onChange={onZayavkaFilterChange} />
          <MultiSelectFilter label="Статус"   options={[...dynamicStatus]} selected={statusFilter}  onChange={onStatusFilterChange} />
          <MultiSelectFilter label="Менеджер" options={managers}           selected={managerFilter} onChange={onManagerFilterChange} />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-slate-500 shrink-0 text-[12.5px] hover:text-foreground hover:bg-slate-100" onClick={onClearFilters}>
              <X className="h-3 w-3" />
              Сбросить
            </Button>
          )}

          {/* Folder buttons */}
          {!isVTB && (folderCounts.rejected > 0 || folderCounts.paused > 0) && (
            <div className="w-px h-4 bg-slate-100 mx-0.5 shrink-0 hidden sm:block" />
          )}

          {!isVTB && folderCounts.rejected > 0 && (
            <button
              onClick={() => onToggleFolder('rejected')}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold shrink-0 border transition-all duration-150',
                expandedFolder === 'rejected'
                  ? 'bg-red-500 text-white border-red-600 shadow-sm'
                  : 'text-red-600 border-red-300 bg-red-50 hover:bg-red-100',
              )}
            >
              Отклонённые
              <Badge className={cn("text-[10px] font-bold px-1.5 py-0 min-w-[18px] h-[16px]", expandedFolder === 'rejected' ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600')}>{folderCounts.rejected}</Badge>
            </button>
          )}

          {!isVTB && folderCounts.paused > 0 && (
            <button
              onClick={() => onToggleFolder('paused')}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold shrink-0 border transition-all duration-150',
                expandedFolder === 'paused'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100',
              )}
            >
              На паузе
              <Badge className={cn("text-[10px] font-bold px-1.5 py-0 min-w-[18px] h-[16px]", expandedFolder === 'paused' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700')}>{folderCounts.paused}</Badge>
            </button>
          )}

          {/* Kanban toggle */}
          <button
            onClick={() => setCurrentPage('kanban')}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium shrink-0 border border-slate-200/80 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-foreground transition-all duration-150"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Доска
          </button>
        </div>
      )}
    </div>
  )
}
