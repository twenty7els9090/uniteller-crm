'use client'

import type { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalRows: number
  variant?: 'desktop' | 'mobile'
}

export function DataTablePagination<TData>({ table, totalRows, variant = 'desktop' }: DataTablePaginationProps<TData>) {
  const isMobile = variant === 'mobile'
  const btnSize = isMobile ? 'h-10 w-10' : 'h-8 w-8 rounded-lg'
  const textSize = isMobile ? 'text-xs' : 'text-sm'
  const iconSize = 'h-4 w-4'
  const pageText = isMobile
    ? `${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`
    : `${table.getState().pagination.pageIndex + 1} из ${table.getPageCount()}`
  const countText = isMobile
    ? <><span className="font-medium text-foreground">{totalRows}</span> записей</>
    : <>Всего: <span className="font-medium text-foreground">{totalRows}</span> записей</>

  return (
    <div className={`flex items-center justify-between gap-3 ${isMobile ? 'pt-2' : 'border-t border-slate-100 px-4 py-3'}`}>
      <p className={`${textSize} text-zinc-500`}>{countText}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className={cn(btnSize, 'border-slate-200/80 bg-slate-50 text-zinc-400 hover:text-foreground hover:bg-slate-100 hover:border-slate-200')}
          onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
          <ChevronsLeft className={iconSize} />
        </Button>
        <Button variant="outline" size="icon" className={cn(btnSize, 'border-slate-200/80 bg-slate-50 text-zinc-400 hover:text-foreground hover:bg-slate-100 hover:border-slate-200')}
          onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          <ChevronLeft className={iconSize} />
        </Button>
        <span className={cn(textSize, isMobile ? 'px-2' : 'px-3', 'text-foreground font-medium tabular-nums')}>{pageText}</span>
        <Button variant="outline" size="icon" className={cn(btnSize, 'border-slate-200/80 bg-slate-50 text-zinc-400 hover:text-foreground hover:bg-slate-100 hover:border-slate-200')}
          onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          <ChevronRight className={iconSize} />
        </Button>
        <Button variant="outline" size="icon" className={cn(btnSize, 'border-slate-200/80 bg-slate-50 text-zinc-400 hover:text-foreground hover:bg-slate-100 hover:border-slate-200')}
          onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
          <ChevronsRight className={iconSize} />
        </Button>
      </div>
    </div>
  )
}
