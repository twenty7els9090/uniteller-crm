'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhoneInput } from '@/components/ui/phone-input'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Inline editable phone cell ───────────────────────────────────────

export function InlinePhoneCell({
  value,
  onSave,
}: {
  value: string
  onSave: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit() {
    if (draft === value) {
      setEditing(false)
      return
    }
    onSave(draft)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        className="inline-flex items-center rounded-lg px-1.5 py-0 cursor-pointer transition-colors hover:bg-slate-100"
        onClick={(e) => {
          e.stopPropagation()
          setEditing(true)
        }}
        title="Нажмите для редактирования"
      >
        <span className={cn(!value && 'text-zinc-600')}>
          {value || '+7 (___) ___-__-__'}
        </span>
      </span>
    )
  }

  return (
    <PhoneInput
      value={draft}
      onChange={setDraft}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        }
      }}
      className="h-6 text-[15px] min-w-[140px] border-primary"
    />
  )
}

// ─── Inline editable text cell ────────────────────────────────────────

interface EditableTextCellProps {
  value: string
  onSave: (val: string) => void
  maxLength?: number
  className?: string
  placeholder?: string
  numericOnly?: boolean
  suffix?: string
  formatter?: (val: string) => string
}

export function EditableTextCell({
  value,
  onSave,
  maxLength = 200,
  className = '',
  placeholder = '—',
  numericOnly = false,
  suffix = '',
  formatter,
}: EditableTextCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    onSave(trimmed)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-lg px-1.5 py-0 cursor-pointer transition-colors hover:bg-slate-100 w-full',
          !value && 'text-zinc-600 italic',
          className,
        )}
        onClick={(e) => {
          e.stopPropagation()
          setEditing(true)
        }}
        title={value || 'Нажмите для редактирования'}
      >
        <span className={cn('truncate block', !value && 'italic')}>
          {value ? (formatter ? formatter(value) : `${value}${suffix}`) : placeholder}
        </span>
      </span>
    )
  }

  return (
    <Input
      ref={inputRef}
      type={numericOnly ? 'number' : 'text'}
      inputMode={numericOnly ? 'decimal' : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        }
        if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      }}
      maxLength={maxLength}
      disabled={saving}
      className={cn('h-6 text-xs min-w-[80px] border-primary bg-slate-50 border-slate-200 text-foreground rounded-lg focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40 placeholder:text-zinc-600', className)}
    />
  )
}

// ─── Inline editable number cell (for combat table) ───────────────────

interface EditableNumberCellProps {
  value: string
  onSave: (val: string) => void
  suffix?: string
  placeholder?: string
  readOnly?: boolean
  formatter?: (val: string) => string
}

export function EditableNumberCell({
  value,
  onSave,
  suffix = '',
  placeholder = '—',
  readOnly = false,
  formatter,
}: EditableNumberCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState((value ?? '').replace('%', ''))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const cleanValue = (value ?? '').replace('%', '')
    if (!editing) setDraft(cleanValue)
  }, [value, editing])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    onSave(trimmed)
    setSaving(false)
    setEditing(false)
  }

  const displayValue = value
    ? formatter
      ? formatter(value)
      : `${value}${suffix}`
    : placeholder

  if (!editing) {
    return (
      <span
        className="inline-block rounded-lg px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-slate-100 text-sm"
        onClick={() => !readOnly && setEditing(true)}
        title={!readOnly ? 'Нажмите для редактирования' : undefined}
      >
        <span className={cn('block', !value && 'text-zinc-600 italic')}>
          {displayValue}
        </span>
      </span>
    )
  }

  return (
    <Input
      ref={inputRef}
      type="number"
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        }
        if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      }}
      disabled={saving}
      className="h-7 text-sm min-w-[100px] border-primary bg-slate-50 border-slate-200 text-foreground rounded-lg focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40 placeholder:text-zinc-600"
    />
  )
}

// ─── Inline editable select cell ──────────────────────────────────────

interface EditableSelectCellProps {
  value: string
  options: { value: string; label: string }[]
  onSave: (val: string) => void
  getBadge?: (val: string) => ReactNode
  disabled?: boolean
}

export function EditableSelectCell({
  value,
  options,
  onSave,
  getBadge,
  disabled = false,
}: EditableSelectCellProps) {
  const [editing, setEditing] = useState(false)

  function handleSave(val: string) {
    if (val === value) {
      setEditing(false)
      return
    }
    onSave(val)
    setEditing(false)
  }

  if (editing && !disabled) {
    return (
      <Select
        value={value}
        onValueChange={handleSave}
        open={editing}
        onOpenChange={setEditing}
      >
        <SelectTrigger className="h-6 text-xs min-w-[80px] border-primary bg-slate-50 border-slate-200 text-foreground rounded-lg focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-slate-100',
        disabled && 'cursor-default',
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) setEditing(true)
      }}
      title={disabled ? undefined : 'Нажмите для редактирования'}
    >
      {getBadge ? getBadge(value) : <Badge variant="outline">{value}</Badge>}
    </span>
  )
}

// ─── Inline editable comment/textarea cell ───────────────────────────

export function EditableCommentCell({
  value,
  onSave,
  maxLength = 500,
  placeholder = '—',
}: {
  value: string
  onSave: (val: string) => void
  maxLength?: number
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed === value) { setEditing(false); return }
    setSaving(true)
    onSave(trimmed)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        className="inline-block rounded-lg px-1.5 py-0.5 min-h-[28px] cursor-pointer transition-colors hover:bg-slate-100 text-sm w-full max-w-[250px]"
        onClick={(e) => {
          e.stopPropagation()
          setEditing(true)
        }}
        title={value || 'Нажмите для редактирования'}
      >
        <span className={cn('truncate block', !value && 'text-zinc-600 italic')}>
          {value || placeholder}
        </span>
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        maxLength={maxLength}
        className="h-auto text-sm min-w-[200px] border-primary bg-slate-50 border-slate-200 text-foreground rounded-xl focus:ring-2 focus:ring-green-600/25 focus:border-green-600/40 placeholder:text-zinc-600 resize-none"
        disabled={saving}
      />
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={commit}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={cancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
