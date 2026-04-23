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
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 max-h-[100dvh] md:my-4 my-0 rounded-b-none md:rounded-b-lg">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5 text-sky-500" />
            Новый входящий лид
          </DialogTitle>
          <DialogDescription>
            Заполните минимум: организация и партнёр. Остальное — по желанию.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100dvh-120px)]">
          <div className="overflow-y-auto px-6 py-5 flex-1 space-y-4">
            {/* Organization */}
            <div className="space-y-1.5">
              <Label htmlFor="inc-org" className="text-sm font-medium">
                Организация <span className="text-destructive">*</span>
              </Label>
              <Input
                id="inc-org"
                placeholder="ООО «Название»"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                autoFocus
              />
            </div>

            {/* Partner */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Партнёр <span className="text-destructive">*</span>
              </Label>
              {isVTB ? (
                <Input value="ВТБ" disabled className="bg-muted" />
              ) : (
                <Select value={partner} onValueChange={setPartner}>
                  <SelectTrigger>
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
                <Label className="text-sm font-medium">Телефон</Label>
                <PhoneInput
                  value={contactInfo}
                  onChange={setContactInfo}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Почта</Label>
                <Input
                  type="email"
                  placeholder="example@mail.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Комментарий</Label>
              <Textarea
                placeholder="Дополнительная информация о заявке..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t border-border/50 gap-2 sm:gap-0 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !canSubmit} className="shadow-sm shadow-primary/10">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать лид
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
