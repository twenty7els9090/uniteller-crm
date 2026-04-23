'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Formats raw input to +7 (XXX) XXX-XX-XX
 * Handles: 8921..., 921..., +7921..., +7(921)..., 89969261566...
 */
function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')

  // 8921... (11 digits, starts with 8) → replace with 7
  if (digits.length >= 11 && digits[0] === '8') {
    digits = '7' + digits.slice(1)
  }
  // 921... (10 digits, starts with 9) → prepend 7
  if (digits.length === 10 && digits[0] === '9') {
    digits = '7' + digits
  }

  // Take only last 10 digits after country code
  if (digits.startsWith('7') && digits.length > 11) {
    digits = '7' + digits.slice(-10)
  }

  if (digits.length === 0) return ''
  if (!digits.startsWith('7')) return digits

  const d = digits.slice(1) // remove leading 7

  let result = '+7'
  if (d.length > 0) result += ' (' + d.slice(0, 3)
  if (d.length >= 3) result += ') ' + d.slice(3, 6)
  if (d.length >= 6) result += '-' + d.slice(6, 8)
  if (d.length >= 8) result += '-' + d.slice(8, 10)
  return result
}

function stripPhone(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  disabled?: boolean
  className?: string
}

export function PhoneInput({ value, onChange, onBlur, onKeyDown, disabled, className }: PhoneInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatPhone(e.target.value))
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onBlur?.()
    }
    onKeyDown?.(e)
  }, [onBlur, onKeyDown])

  return (
    <Input
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder="+7 (___) ___-__-__"
      maxLength={18}
      className={cn('tracking-wide', className)}
    />
  )
}

export { formatPhone, stripPhone }
