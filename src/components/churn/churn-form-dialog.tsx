'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { churnSchema, type ChurnFormData } from '@/lib/validations'
import type { Churn } from '@/lib/types'
import { useSettings } from '@/hooks/use-settings'
import { MANAGERS, CHURN_STATUS_OPTIONS } from '@/lib/constants'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'

const inputClass = 'bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40 placeholder:text-zinc-600'
const selectTriggerClass = 'bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40'
const labelClass = 'text-zinc-400 text-sm font-medium'

interface ChurnFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  churn?: Churn | null
  onSaved?: () => void
}

export function ChurnFormDialog({ open, onOpenChange, churn, onSaved }: ChurnFormDialogProps) {
  const { settings } = useSettings()
  const [loading, setLoading] = useState(false)
  const dynamicManagers = settings.manager.length > 0 ? settings.manager : [...MANAGERS]

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ChurnFormData>({
    resolver: zodResolver(churnSchema),
    defaultValues: { organization: '', turnoverTsp: '', revenue: '', status: '', comment: '', manager: '', reported: false },
  })

  useEffect(() => {
    if (open && churn) {
      reset({ id: churn.id, organization: churn.organization, turnoverTsp: churn.turnoverTsp || '', revenue: churn.revenue || '', status: churn.status || '', comment: churn.comment || '', manager: churn.manager || '', reported: churn.reported })
    } else if (open) {
      reset({ id: undefined, organization: '', turnoverTsp: '', revenue: '', status: '', comment: '', manager: '', reported: false })
    }
  }, [open, churn, reset])

  async function onSubmit(data: ChurnFormData) {
    setLoading(true)
    try {
      const url = data.id ? `/api/churn/${data.id}` : '/api/churn'
      const method = data.id ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error || 'Ошибка сохранения'); return }
      toast.success(data.id ? 'Сохранено' : 'Информация внесена')
      onOpenChange(false); onSaved?.()
    } catch { toast.error('Ошибка соединения с сервером') }
    finally { setLoading(false) }
  }

  const isEditing = !!churn?.id
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[100dvh] md:my-4 my-0 rounded-b-none md:rounded-2xl bg-surface-2 border-slate-200/80 shadow-popover">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg text-foreground">{isEditing ? 'Редактировать' : 'Внести информацию'}</DialogTitle>
          <DialogDescription className="text-zinc-500">{isEditing ? 'Измените данные' : 'Заполните информацию об оттоке'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)() }} className="flex flex-col max-h-[calc(100dvh-120px)]">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="overflow-y-auto px-6 py-5 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="churn-org" className={labelClass}>Организация *</Label>
                <Input id="churn-org" placeholder="ООО «Название»" className={inputClass} {...register('organization')} />
                {errors.organization && <p className="text-xs text-red-400">{errors.organization.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="churn-turnover" className={labelClass}>Оборот ТСП</Label>
                <Input id="churn-turnover" type="number" inputMode="decimal" placeholder="1500000" className={inputClass} {...register('turnoverTsp')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="churn-revenue" className={labelClass}>Выручка</Label>
                <Input id="churn-revenue" type="number" inputMode="decimal" placeholder="4500" className={inputClass} {...register('revenue')} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Статус</Label>
                <Select value={watch('status') || '__none__'} onValueChange={(val) => setValue('status', val === '__none__' ? '' : val)}>
                  <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Выберите статус" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">— нет —</SelectItem>{CHURN_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Менеджер</Label>
                <Select value={watch('manager') || '__none__'} onValueChange={(val) => setValue('manager', val === '__none__' ? '' : val)}>
                  <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Выберите менеджера" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">— нет —</SelectItem>{dynamicManagers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="churn-comment" className={labelClass}>Комментарий</Label>
                <Textarea id="churn-comment" placeholder="Дополнительная информация" rows={2} className={`resize-none ${inputClass}`} {...register('comment')} />
              </div>
            </div>
          </motion.div>
          <DialogFooter className="px-6 py-3 border-t border-slate-100 gap-2 sm:gap-0 shrink-0">
            <Button type="button" variant="ghost" className="text-zinc-400 hover:text-foreground hover:bg-slate-100" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={loading} className="btn-primary">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEditing ? 'Сохранить' : 'Создать'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
