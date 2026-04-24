'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Search, SlidersHorizontal, X, ChevronDown, XCircle, PauseCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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
            'h-8 text-[12.5px] shrink-0 gap-1.5 justify-between font-normal min-w-[120px] sm:min-w-[150px]',
            count > 0 && 'border-primary/40 bg-primary/5 text-primary',
          )}
        >
          <span className="truncate">{allSelected ? label : `${label} (${count})`}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1.5 shadow-popover" align="start" sideOffset={4}>
        <div className="space-y-0.5">
          <button
            className="flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-accent transition-colors"
            onClick={() => onChange([])}
          >
            <Checkbox checked={allSelected} className="h-3.5 w-3.5" />
            <span className={cn('font-medium', !allSelected && 'text-muted-foreground')}>Все</span>
          </button>
          <div className="h-px bg-border/60 my-1" />
          <div className="max-h-[180px] overflow-y-auto scrollbar-thin">
            {options.map((opt) => (
              <button
                key={opt}
                className="flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-[12.5px] hover:bg-accent transition-colors text-left"
                onClick={() => toggle(opt)}
              >
                <Checkbox checked={selected.includes(opt)} className="h-3.5 w-3.5 shrink-0" />
                <span className={cn('truncate', !selected.includes(opt) && 'text-muted-foreground')}>
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
  globalFilter: string
  onGlobalFilterChange: (v: string) => void
  onAddLead: () => void
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
  showFilters, isVTB, globalFilter, onGlobalFilterChange, onAddLead,
  expandedFolder, folderCounts, onToggleFolder,
  partners, managers, dynamicZayavka, dynamicStatus,
  partnerFilter, zayavkaFilter, statusFilter, managerFilter,
  hasActiveFilters,
  onPartnerFilterChange, onZayavkaFilterChange, onStatusFilterChange, onManagerFilterChange,
  onClearFilters,
}: LeadsFiltersProps) {
  return (
    <div className="space-y-2.5 mb-4">
      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Поиск по организации, менеджеру, статусу..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="pl-9 h-11 md:h-9 text-sm"
          />
        </div>
        {!isVTB && (
          <Button onClick={onAddLead} size="default" className="hidden sm:flex gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Новый лид
          </Button>
        )}
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap pb-0.5 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground/70">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-[12px] font-medium whitespace-nowrap hidden sm:inline">Фильтры:</span>
          </div>

          <MultiSelectFilter label="Партнёр"  options={partners}          selected={partnerFilter}  onChange={onPartnerFilterChange} />
          <MultiSelectFilter label="Заявка"   options={[...dynamicZayavka]} selected={zayavkaFilter} onChange={onZayavkaFilterChange} />
          <MultiSelectFilter label="Статус"   options={[...dynamicStatus]} selected={statusFilter}  onChange={onStatusFilterChange} />
          <MultiSelectFilter label="Менеджер" options={managers}           selected={managerFilter} onChange={onManagerFilterChange} />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground shrink-0 text-[12.5px]" onClick={onClearFilters}>
              <X className="h-3 w-3" />
              Сбросить
            </Button>
          )}

          {/* Folder buttons */}
          {!isVTB && (folderCounts.rejected > 0 || folderCounts.paused > 0) && (
            <div className="w-px h-4 bg-border/60 mx-0.5 shrink-0 hidden sm:block" />
          )}

          {!isVTB && folderCounts.rejected > 0 && (
            <button
              onClick={() => onToggleFolder('rejected')}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium shrink-0 border transition-all duration-150',
                expandedFolder === 'rejected'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'text-red-600 border-red-200/80 bg-red-50/60 hover:bg-red-50',
              )}
            >
              <XCircle className="h-3.5 w-3.5" />
              Отклонённые
              <Badge variant="muted" className="text-[10px] font-bold px-1.5 py-0 min-w-[18px] h-[16px]">
                {folderCounts.rejected}
              </Badge>
            </button>
          )}

          {!isVTB && folderCounts.paused > 0 && (
            <button
              onClick={() => onToggleFolder('paused')}
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium shrink-0 border transition-all duration-150',
                expandedFolder === 'paused'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'text-amber-700 border-amber-200/80 bg-amber-50/60 hover:bg-amber-50',
              )}
            >
              <PauseCircle className="h-3.5 w-3.5" />
              На паузе
              <Badge variant="muted" className="text-[10px] font-bold px-1.5 py-0 min-w-[18px] h-[16px]">
                {folderCounts.paused}
              </Badge>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
