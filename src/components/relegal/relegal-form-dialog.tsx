'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { relegalSchema, type RelegalFormData } from '@/lib/validations'
import type { Relegal } from '@/lib/types'
import { useSettings } from '@/hooks/use-settings'
import { MANAGERS } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'

interface RelegalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  relegal?: Relegal | null
  onSaved?: () => void
}

export function RelegalFormDialog({ open, onOpenChange, relegal, onSaved }: RelegalFormDialogProps) {
  const { settings } = useSettings()
  const [loading, setLoading] = useState(false)

  const dynamicManagers = settings.manager.length > 0 ? settings.manager : [...MANAGERS]

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<RelegalFormData>({
    resolver: zodResolver(relegalSchema),
    defaultValues: {
      fromOrg: '',
      toOrg: '',
      action: '',
      manager: '',
    },
  })

  useEffect(() => {
    if (open && relegal) {
      reset({
        id: relegal.id,
        fromOrg: relegal.fromOrg || '',
        toOrg: relegal.toOrg || '',
        action: relegal.action || '',
        manager: relegal.manager || '',
      })
    } else if (open) {
      reset({
        id: undefined,
        fromOrg: '',
        toOrg: '',
        action: '',
        manager: '',
      })
    }
  }, [open, relegal, reset])

  async function onSubmit(data: RelegalFormData) {
    setLoading(true)
    try {
      const url = data.id ? `/api/relegal/${data.id}` : '/api/relegal'
      const method = data.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Ошибка сохранения')
        return
      }

      toast.success(data.id ? 'Сохранено' : 'Информация внесена')
      onOpenChange(false)
      onSaved?.()
    } catch {
      toast.error('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  const isEditing = !!relegal?.id
  const dialogTitle = isEditing ? 'Редактировать' : 'Внести информацию'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[100dvh] md:my-4 my-0 rounded-2xl border-slate-200 rounded-b-none md:rounded-b-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Измените данные' : 'Заполните информацию о смене юр.лица'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)() }} className="flex flex-col max-h-[calc(100dvh-120px)]">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="overflow-y-auto px-6 py-5 flex-1"
          >
            <div className="grid grid-cols-1 gap-x-5 gap-y-4">
              {/* From Org */}
              <div className="space-y-1.5">
                <Label htmlFor="relegal-from" className="text-sm">С кого переключение?</Label>
                <Input
                  id="relegal-from"
                  placeholder="ООО «Название»"
                  {...register('fromOrg')}
                />
              </div>

              {/* To Org */}
              <div className="space-y-1.5">
                <Label htmlFor="relegal-to" className="text-sm">На кого переключение?</Label>
                <Input
                  id="relegal-to"
                  placeholder="ООО «Название»"
                  {...register('toOrg')}
                />
              </div>

              {/* Action */}
              <div className="space-y-1.5">
                <Label htmlFor="relegal-action" className="text-sm">Что было сделано?</Label>
                <Textarea
                  id="relegal-action"
                  placeholder="Описание действий"
                  rows={2}
                  {...register('action')}
                />
              </div>

              {/* Manager */}
              <div className="space-y-1.5">
                <Label className="text-sm">Менеджер</Label>
                <Select
                  value={watch('manager') || '__none__'}
                  onValueChange={(val) => setValue('manager', val === '__none__' ? '' : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите менеджера" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— нет —</SelectItem>
                    {dynamicManagers.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          <DialogFooter className="px-6 py-3 border-t gap-2 sm:gap-0 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Сохранить' : 'Внести'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
