'use client'

import { useState, useEffect } from 'react'
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
import { PhoneInput } from '@/components/ui/phone-input'
import { Loader2, PhoneIncoming } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useSettings } from '@/hooks/use-settings'
import { PARTNERS } from '@/lib/constants'
import { toast } from 'sonner'

interface IncomingLeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

const inputClass = 'bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40 placeholder:text-slate-400'
const selectTriggerClass = 'bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40'
const labelClass = 'text-slate-500 text-sm font-medium'

export function IncomingLeadFormDialog({ open, onOpenChange, onSaved }: IncomingLeadFormDialogProps) {
  const user = useAppStore((s) => s.user)
  const { settings } = useSettings()
  const isVTB = user?.role === 'vtb'

  const [loading, setLoading] = useState(false)
  const [organization, setOrganization] = useState('')
  const [partner, setPartner] = useState(isVTB ? 'ВТБ' : '')
  const [contactInfo, setContactInfo] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')

  const dynamicPartners = settings.partner.length > 0 ? settings.partner : [...PARTNERS]

  useEffect(() => {
    if (open) {
      setOrganization('')
      setPartner(isVTB ? 'ВТБ' : '')
      setContactInfo('')
      setEmail('')
      setComment('')
    }
  }, [open, isVTB])

  const canSubmit = organization.trim() && partner

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: organization.trim(),
          partner,
          zayavka: 'Входящий',
          manager: '',
          contactInfo,
          email,
          comment,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Ошибка создания')
        return
      }

      toast.success(`Входящий лид «${organization.trim()}» создан`)
      onOpenChange(false)
      onSaved?.()
    } catch {
      toast.error('Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 max-h-[100dvh] md:my-4 my-0 rounded-b-none md:rounded-2xl bg-surface-2 border-slate-200/80 shadow-popover">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg text-foreground flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5 text-cyan-400" />
            Новый входящий лид
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Заполните минимум: организация и партнёр. Остальное — по желанию.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100dvh-120px)]">
          <div className="overflow-y-auto px-6 py-5 flex-1 space-y-4">
            {/* Organization */}
            <div className="space-y-1.5">
              <Label htmlFor="inc-org" className={labelClass}>
                Организация <span className="text-red-400">*</span>
              </Label>
              <Input
                id="inc-org"
                placeholder="ООО «Название»"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                autoFocus
                className={inputClass}
              />
            </div>

            {/* Partner */}
            <div className="space-y-1.5">
              <Label className={labelClass}>
                Партнёр <span className="text-red-400">*</span>
              </Label>
              {isVTB ? (
                <Input value="ВТБ" disabled className={`${inputClass} bg-slate-50 opacity-60`} />
              ) : (
                <Select value={partner} onValueChange={setPartner}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Выберите партнёра" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicPartners.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={labelClass}>Телефон</Label>
                <PhoneInput
                  value={contactInfo}
                  onChange={setContactInfo}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Почта</Label>
                <Input
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <Label className={labelClass}>Комментарий</Label>
              <Textarea
                placeholder="Дополнительная информация о заявке..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className={`resize-none ${inputClass}`}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t border-slate-100 gap-2 sm:gap-0 shrink-0">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-500 hover:text-foreground hover:bg-slate-100"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !canSubmit} className="btn-primary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать лид
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
