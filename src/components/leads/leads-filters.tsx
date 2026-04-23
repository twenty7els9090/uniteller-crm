'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  XCircle,
  PauseCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Multi-select filter popover ───
function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const allSelected = selected.length === 0
  const count = selected.length

  function toggle(val: string) {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  function selectAll() {
    onChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 text-sm shrink-0 gap-1.5 w-[140px] sm:w-[170px] justify-between font-normal rounded-lg',
            count > 0 && 'border-primary/50 bg-primary/[0.06]'
          )}
        >
          <span className="truncate">
            {allSelected ? label : `${label} (${count})`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-1.5 rounded-xl bg-white/90 backdrop-blur-xl border-white/20 shadow-xl shadow-black/[0.06]" align="start" side="bottom" sideOffset={4}>
        <div className="space-y-0.5">
          <button
            className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent/80 transition-colors text-left shrink-0"
            onClick={selectAll}
          >
            <Checkbox checked={allSelected} />
            <span className={cn(!allSelected && 'text-muted-foreground')}>Все</span>
          </button>
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-sm hover:bg-accent/80 transition-colors text-left"
                onClick={() => toggle(opt)}
              >
                <Checkbox checked={selected.includes(opt)} />
                <span className={cn('truncate', !selected.includes(opt) && 'text-muted-foreground')}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── LeadsFilters ───
interface LeadsFiltersProps {
  showFilters: boolean
  isVTB: boolean
  globalFilter: string
  onGlobalFilterChange: (v: string) => void
  onAddLead: () => void
  // folder state
  expandedFolder: 'rejected' | 'paused' | null
  folderCounts: { rejected: number; paused: number }
  onToggleFolder: (folder: 'rejected' | 'paused') => void
  // filter states
  partners: string[]
  managers: string[]
  dynamicZayavka: string[]
  dynamicStatus: string[]
  partnerFilter: string[]
  zayavkaFilter: string[]
  statusFilter: string[]
  managerFilter: string[]
  hasActiveFilters: boolean
  // filter setters
  onPartnerFilterChange: (v: string[]) => void
  onZayavkaFilterChange: (v: string[]) => void
  onStatusFilterChange: (v: string[]) => void
  onManagerFilterChange: (v: string[]) => void
  onClearFilters: () => void
}

export function LeadsFilters({
  showFilters,
  isVTB,
  globalFilter,
  onGlobalFilterChange,
  onAddLead,
  expandedFolder,
  folderCounts,
  onToggleFolder,
  partners,
  managers,
  dynamicZayavka,
  dynamicStatus,
  partnerFilter,
  zayavkaFilter,
  statusFilter,
  managerFilter,
  hasActiveFilters,
  onPartnerFilterChange,
  onZayavkaFilterChange,
  onStatusFilterChange,
  onManagerFilterChange,
  onClearFilters,
}: LeadsFiltersProps) {
  return (
    <div className="space-y-3 mb-4">
      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="Поиск..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="pl-9 h-11 md:h-9 bg-white/80 backdrop-blur-sm border-white/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] focus-visible:ring-primary/20 focus-visible:border-primary/30 focus-visible:bg-white transition-all duration-200"
          />
        </div>
        {!isVTB && (
          <Button onClick={onAddLead} size="default" className="hidden sm:flex shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-shadow duration-200">
            <Plus className="h-4 w-4 mr-2" />
            Новый лид
          </Button>
        )}
      </div>

      {/* Filters row */}
      {showFilters && (
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap pb-1 md:pb-0 pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground/70" />
            <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Фильтры:</span>
          </div>

          <MultiSelectFilter label="Партнёр" options={partners} selected={partnerFilter} onChange={onPartnerFilterChange} />
          <MultiSelectFilter label="Заявка" options={[...dynamicZayavka]} selected={zayavkaFilter} onChange={onZayavkaFilterChange} />
          <MultiSelectFilter label="Статус" options={[...dynamicStatus]} selected={statusFilter} onChange={onStatusFilterChange} />
          <MultiSelectFilter label="Менеджер" options={managers} selected={managerFilter} onChange={onManagerFilterChange} />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground hover:text-foreground shrink-0 transition-colors duration-150"
              onClick={onClearFilters}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Сбросить
            </Button>
          )}

          {/* Folder buttons — only for uniteller, not VTB */}
          {!isVTB && (folderCounts.rejected > 0 || folderCounts.paused > 0) && (
            <div className="w-px h-5 bg-gradient-to-b from-transparent via-border/60 to-transparent mx-1 shrink-0 hidden sm:block" />
          )}

          {!isVTB && folderCounts.rejected > 0 && (
            <Button
              variant={expandedFolder === 'rejected' ? 'destructive' : 'outline'}
              size="sm"
              className={cn(
                'h-8 text-xs gap-1.5 shrink-0 rounded-lg',
                expandedFolder !== 'rejected' && 'text-rose-600 border-rose-200/70 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700',
              )}
              onClick={() => onToggleFolder('rejected')}
            >
              <XCircle className="h-3.5 w-3.5" />
              Отклонённые
              <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 min-w-[20px]">
                {folderCounts.rejected}
              </Badge>
            </Button>
          )}

          {!isVTB && folderCounts.paused > 0 && (
            <Button
              variant={expandedFolder === 'paused' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 text-xs gap-1.5 shrink-0 rounded-lg',
                expandedFolder !== 'paused' && 'text-amber-600 border-amber-200/70 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
                expandedFolder === 'paused' && 'bg-amber-600 hover:bg-amber-700 border-amber-600',
              )}
              onClick={() => onToggleFolder('paused')}
            >
              <PauseCircle className="h-3.5 w-3.5" />
              На паузе
              <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 min-w-[20px]">
                {folderCounts.paused}
              </Badge>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
