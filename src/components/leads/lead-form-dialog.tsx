'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { leadSchema, type LeadFormData } from '@/lib/validations'
import { useAppStore } from '@/lib/store'
import type { Lead } from '@/lib/types'
import { PhoneInput } from '@/components/ui/phone-input'
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
import { Loader2, AlertTriangle } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { PARTNERS, MANAGERS, ZAYAVKA_OPTIONS, STATUS_OPTIONS, ACTIVITY_TYPES } from '@/lib/constants'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead | null
  onSaved?: () => void
}



export function LeadFormDialog({ open, onOpenChange, lead, onSaved }: LeadFormDialogProps) {
  const user = useAppStore((s) => s.user)
  const { settings } = useSettings()
  const [loading, setLoading] = useState(false)
  const [duplicate, setDuplicate] = useState<{ organization: string; partner: string; manager: string; zayavka: string } | null>(null)

  // Use settings from API, fall back to hardcoded constants
  const dynamicPartners = settings.partner.length > 0 ? settings.partner : [...PARTNERS]
  const dynamicManagers = settings.manager.length > 0 ? settings.manager : [...MANAGERS]
  const dynamicZayavka = settings.zayavka.length > 0 ? settings.zayavka : [...ZAYAVKA_OPTIONS]
  const dynamicStatus = settings.status.length > 0 ? settings.status : [...STATUS_OPTIONS]
  const dynamicActivityTypes = settings.activityType.length > 0 ? settings.activityType : [...ACTIVITY_TYPES]

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      organization: '',
      partner: user?.role === 'vtb' ? 'ВТБ' : '',
      zayavka: 'В работе',
      status: '',
      activityType: '',
      comment: '',
      contactInfo: '',
      email: '',
      margin: '',
      manager: '',
    },
  })

  const watchZayavka = watch('zayavka')
  const watchPartner = watch('partner')
  const watchOrg = watch('organization')

  // Duplicate check (only for creation, not editing)
  useEffect(() => {
    if (!open || lead?.id || !watchOrg || watchOrg.length < 7) {
      setDuplicate(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/leads?search=${encodeURIComponent(watchOrg)}`)
        if (res.ok) {
          const data: Lead[] = await res.json()
          const match = data.find((l) => l.organization.toLowerCase() === watchOrg.toLowerCase())
          setDuplicate(match ? { organization: match.organization, partner: match.partner, manager: match.manager, zayavka: match.zayavka } : null)
        }
      } catch { /* ignore */ }
    }, 500)
    return () => clearTimeout(timer)
  }, [watchOrg, open, lead?.id])

  useEffect(() => {
    if (open && lead) {
      reset({
        id: lead.id,
        organization: lead.organization,
        partner: lead.partner,
        zayavka: lead.zayavka as LeadFormData['zayavka'],
        status: lead.status || '',
        activityType: lead.activityType || '',
        comment: lead.comment || '',
        contactInfo: lead.contactInfo || '',
        email: lead.email || '',
        margin: lead.margin || '',
        manager: lead.manager,
      })
    } else if (open) {
      reset({
        id: undefined,
        organization: '',
        partner: user?.role === 'vtb' ? 'ВТБ' : '',
        zayavka: 'В работе',
        status: '',
        activityType: '',
        comment: '',
        contactInfo: '',
        email: '',
        margin: '',
        manager: '',
      })
    }
  }, [open, lead, reset, user])

  async function onSubmit(data: LeadFormData) {
    setLoading(true)
    try {
      const url = data.id ? `/api/leads/${data.id}` : '/api/leads'
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

      toast.success(data.id ? 'Лид обновлён' : 'Лид создан')
      onOpenChange(false)
      onSaved?.()
    } catch {
      toast.error('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  const isVTB = user?.role === 'vtb'
  const isEditing = !!lead?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[100dvh] md:my-4 my-0 rounded-b-none md:rounded-b-lg">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">{isEditing ? 'Редактировать лид' : 'Новый лид'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Измените данные лида и сохраните'
              : 'Заполните информацию о новом лиде'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)() }} className="flex flex-col max-h-[calc(100dvh-120px)]">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="overflow-y-auto px-6 py-5 flex-1"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            {/* Organization — full width */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="organization" className="text-sm">Организация *</Label>
              <Input
                id="organization"
                placeholder="ООО «Название»"
                {...register('organization')}
              />
              {errors.organization && (
                <p className="text-xs text-destructive">{errors.organization.message}</p>
              )}
              {!isEditing && (
                <AnimatePresence>
                  {duplicate && (
                    <motion.div
                      key="duplicate-warning"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="font-medium text-amber-800">Найден дубликат!</p>
                          <p className="text-amber-700 mt-0.5">
                            {duplicate.partner} · {duplicate.manager} · {duplicate.zayavka}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Partner */}
            <div className="space-y-1.5">
              <Label className="text-sm">Партнёр *</Label>
              {isVTB ? (
                <Input value="ВТБ" disabled className="bg-muted" />
              ) : (
                <Select
                  value={watchPartner}
                  onValueChange={(val) => setValue('partner', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите партнёра" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicPartners.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.partner && (
                <p className="text-xs text-destructive">{errors.partner.message}</p>
              )}
            </div>

            {/* Manager */}
            <div className="space-y-1.5">
              <Label className="text-sm">Менеджер *</Label>
              <Select
                value={watch('manager')}
                onValueChange={(val) => setValue('manager', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите менеджера" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicManagers.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.manager && (
                <p className="text-xs text-destructive">{errors.manager.message}</p>
              )}
            </div>

            {/* Zayavka */}
            <div className="space-y-1.5">
              <Label className="text-sm">Заявка *</Label>
              <Select
                value={watchZayavka}
                onValueChange={(val) =>
                  setValue('zayavka', val as LeadFormData['zayavka'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicZayavka.map((z) => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zayavka && (
                <p className="text-xs text-destructive">{errors.zayavka.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-sm">Детальный статус</Label>
              <Select
                value={watch('status') || '__none__'}
                onValueChange={(val) => setValue('status', val === '__none__' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— нет —</SelectItem>
                  {dynamicStatus.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Info — Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="contactInfo" className="text-sm">Телефон</Label>
              <PhoneInput
                value={watch('contactInfo') || ''}
                onChange={(val) => setValue('contactInfo', val)}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Почта</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.ru"
                {...register('email')}
              />
            </div>

            {/* Margin */}
            <div className="space-y-1.5">
              <Label htmlFor="margin" className="text-sm">Маржа (%)</Label>
              <div className="relative">
                <Input
                  id="margin"
                  type="number"
                  step="0.1"
                  placeholder="0.3"
                  {...register('margin')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* Activity Type */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm">Вид деятельности</Label>
              <Select
                value={watch('activityType') || '__none__'}
                onValueChange={(val) => setValue('activityType', val === '__none__' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите вид" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— нет —</SelectItem>
                  {dynamicActivityTypes.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comment — full width */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="comment" className="text-sm">Комментарий</Label>
              <Textarea
                id="comment"
                placeholder="Дополнительная информация"
                rows={2}
                {...register('comment')}
              />
            </div>
          </div>
          </motion.div>

          <DialogFooter className="px-6 py-3 border-t gap-2 sm:gap-0 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
