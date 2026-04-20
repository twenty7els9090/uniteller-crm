'use client'

import { useState } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatePresence, motion } from 'framer-motion'
import { staggerContainer, scaleIn, slideUp } from '@/lib/motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Trash2,
  Building2,
  Users,
  ClipboardCheck,
  FileText,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface CategoryConfig {
  key: string
  label: string
  icon: React.ReactNode
  description: string
}

const categories: CategoryConfig[] = [
  { key: 'partner', label: 'Партнёры', icon: <Building2 className="h-4 w-4" />, description: 'Список партнёров для лидов' },
  { key: 'manager', label: 'Менеджеры', icon: <Users className="h-4 w-4" />, description: 'Список менеджеров' },
  { key: 'zayavka', label: 'Статусы заявки', icon: <ClipboardCheck className="h-4 w-4" />, description: 'Выполнена, В работе, На паузе, Отклонена' },
  { key: 'status', label: 'Детальные статусы', icon: <FileText className="h-4 w-4" />, description: 'Детализация текущего этапа работы' },
  { key: 'activityType', label: 'Виды деятельности', icon: <Briefcase className="h-4 w-4" />, description: 'Автомойка, Паркинг, Вендинг и т.д.' },
]

function SettingsCategory({ config }: { config: CategoryConfig }) {
  const { settings, refreshSettings } = useSettings()
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleteItem, setDeleteItem] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const items = settings[config.key as keyof typeof settings] || []

  async function handleAdd() {
    if (!newItem.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: config.key, value: newItem.trim() }),
      })
      if (res.ok) {
        toast.success(`«${newItem.trim()}» добавлено`)
        setNewItem('')
        refreshSettings()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка добавления')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete() {
    if (!deleteItem) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/settings?category=${encodeURIComponent(config.key)}&value=${encodeURIComponent(deleteItem)}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        toast.success(`«${deleteItem}» удалено`)
        refreshSettings()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setDeleting(false)
      setDeleteItem(null)
    }
  }

  return (
    <motion.div variants={scaleIn}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">{config.icon}</div>
            <CardTitle className="text-base">{config.label}</CardTitle>
            <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add new item */}
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              placeholder="Новое значение..."
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              className="h-8 px-3 shrink-0"
              onClick={handleAdd}
              disabled={adding || !newItem.trim()}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1 hidden sm:inline">Добавить</span>
            </Button>
          </div>

          {/* Items list */}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Список пуст</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge
                      variant="outline"
                      className="text-xs pl-2.5 pr-1 py-1 group cursor-default whitespace-normal break-words"
                    >
                      {item}
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center opacity-60 hover:opacity-100 active:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Delete confirmation */}
          <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить «{deleteItem}»?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это значение будет удалено из списка. Если оно используется в существующих лидах, оно останется в них.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SettingsPage() {
  const { loading, settings } = useSettings()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalItems = Object.values(settings).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <main className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div variants={slideUp} initial="hidden" animate="visible">
          <h1 className="text-xl font-semibold">Настройки</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Управление справочниками: {totalItems} значений в {categories.length} категориях
          </p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4">
          {categories.map((cat) => (
            <SettingsCategory key={cat.key} config={cat} />
          ))}
        </motion.div>
      </div>
    </main>
  )
}
