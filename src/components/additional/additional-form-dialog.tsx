'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { additionalSchema, type AdditionalFormData } from '@/lib/validations'
import { useSettings } from '@/hooks/use-settings'
import { PARTNERS } from '@/lib/constants'
import type { Additional } from '@/lib/types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'

const inputClass = 'bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40 placeholder:text-zinc-600'
const selectTriggerClass = 'bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40'
const labelClass = 'text-zinc-400 text-sm font-medium'

interface AdditionalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: Additional | null
  onSaved?: () => void
}

export function AdditionalFormDialog({ open, onOpenChange, record, onSaved }: AdditionalFormDialogProps) {
  const { settings } = useSettings()
  const [loading, setLoading] = useState(false)
  const dynamicPartners = settings.partner.length > 0 ? settings.partner : [...PARTNERS]

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AdditionalFormData>({
    resolver: zodResolver(additionalSchema),
    defaultValues: { organization: '', partner: '', finInstrument: '', turnover: '', revenue: '' },
  })

  useEffect(() => {
    if (open && record) {
      reset({ id: record.id, organization: record.organization, partner: record.partner || '', finInstrument: record.finInstrument || '', turnover: record.turnover || '', revenue: record.revenue || '' })
    } else if (open) {
      reset({ id: undefined, organization: '', partner: '', finInstrument: '', turnover: '', revenue: '' })
    }
  }, [open, record, reset])

  async function onSubmit(data: AdditionalFormData) {
    setLoading(true)
    try {
      const url = data.id ? `/api/additional/${data.id}` : '/api/additional'
      const method = data.id ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error || 'Ошибка сохранения'); return }
      toast.success(data.id ? 'Сохранено' : 'Информация внесена')
      onOpenChange(false); onSaved?.()
    } catch { toast.error('Ошибка соединения с сервером') }
    finally { setLoading(false) }
  }

  const isEditing = !!record?.id
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[100dvh] md:my-4 my-0 rounded-b-none md:rounded-2xl bg-surface-2 border-slate-200/80 shadow-popover">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg text-foreground">{isEditing ? 'Редактировать' : 'Внести информацию'}</DialogTitle>
          <DialogDescription className="text-zinc-500">{isEditing ? 'Измените данные' : 'Заполните информацию о доп. подключении'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)() }} className="flex flex-col max-h-[calc(100dvh-120px)]">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="overflow-y-auto px-6 py-5 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-org" className={labelClass}>Организация *</Label>
                <Input id="add-org" placeholder="ООО «Название»" className={inputClass} {...register('organization')} />
                {errors.organization && <p className="text-xs text-red-400">{errors.organization.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Партнёр</Label>
                <Select value={watch('partner') || '__none__'} onValueChange={(val) => setValue('partner', val === '__none__' ? '' : val)}>
                  <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Выберите партнёра" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">— нет —</SelectItem>{dynamicPartners.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-fin" className={labelClass}>Фин. инструмент</Label>
                <Input id="add-fin" placeholder="Эквайринг, СБП..." className={inputClass} {...register('finInstrument')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-turnover" className={labelClass}>Оборот</Label>
                <Input id="add-turnover" type="number" inputMode="decimal" placeholder="1500000" className={inputClass} {...register('turnover')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-revenue" className={labelClass}>Выручка</Label>
                <Input id="add-revenue" type="number" inputMode="decimal" placeholder="4500" className={inputClass} {...register('revenue')} />
              </div>
            </div>
          </motion.div>
          <DialogFooter className="px-6 py-3 border-t border-slate-100 gap-2 sm:gap-0 shrink-0">
            <Button type="button" variant="ghost" className="text-zinc-400 hover:text-foreground hover:bg-slate-100" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={loading} className="btn-primary">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEditing ? 'Сохранить' : 'Внести'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
