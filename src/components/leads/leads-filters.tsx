'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ZayavkaTab } from './use-leads'

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
            'h-8 text-sm shrink-0 gap-1.5 w-[140px] sm:w-[170px] justify-between font-normal',
            count > 0 && 'border-primary bg-primary/5'
          )}
        >
          <span className="truncate">
            {allSelected ? label : `${label} (${count})`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-1" align="start" side="bottom" sideOffset={4}>
        <div className="space-y-0.5">
          <button
            className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left shrink-0"
            onClick={selectAll}
          >
            <Checkbox checked={allSelected} />
            <span className={cn(!allSelected && 'text-muted-foreground')}>Все</span>
          </button>
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
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

// ─── Tab button: Все / Отклонённые / На паузе ───
function TabButton({
  active,
  onClick,
  children,
  count,
  variant = 'default',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
  variant?: 'default' | 'danger' | 'warning'
}) {
  const colors = {
    default: active
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'bg-muted/60 text-muted-foreground hover:text-foreground',
    danger: active
      ? 'bg-red-600 text-white shadow-sm'
      : 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
    warning: active
      ? 'bg-orange-600 text-white shadow-sm'
      : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap shrink-0',
        colors[variant],
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          'text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full',
          active
            ? variant === 'default' ? 'bg-white/20' : 'bg-white/20'
            : 'bg-muted',
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── LeadsFilters ───
interface LeadsFiltersProps {
  showFilters: boolean
  isVTB: boolean
  globalFilter: string
  onGlobalFilterChange: (v: string) => void
  onAddLead: () => void
  // Tab
  zayavkaTab: ZayavkaTab
  onZayavkaTabChange: (v: ZayavkaTab) => void
  tabCounts: { all: number; rejected: number; paused: number }
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
  zayavkaTab,
  onZayavkaTabChange,
  tabCounts,
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
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="pl-9 h-11 md:h-9"
          />
        </div>
        {!isVTB && (
          <Button onClick={onAddLead} size="default" className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            Новый лид
          </Button>
        )}
      </div>

      {/* Tabs + Filters */}
      {showFilters && (
        <div className="space-y-2.5">
          {/* Zayavka tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <TabButton
              active={zayavkaTab === 'all'}
              onClick={() => onZayavkaTabChange('all')}
              count={tabCounts.all}
            >
              Все
            </TabButton>
            <TabButton
              active={zayavkaTab === 'Отклонена'}
              onClick={() => onZayavkaTabChange('Отклонена')}
              variant="danger"
              count={tabCounts.rejected}
            >
              Отклонённые
            </TabButton>
            <TabButton
              active={zayavkaTab === 'На паузе'}
              onClick={() => onZayavkaTabChange('На паузе')}
              variant="warning"
              count={tabCounts.paused}
            >
              На паузе
            </TabButton>
          </div>

          {/* Filters row */}
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
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
                className="h-8 text-muted-foreground shrink-0"
                onClick={onClearFilters}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Сбросить
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
