import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/** DRY auth check — returns user or 401 response */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) }
  }
  return { user, response: null }
}

/** Handle Zod validation errors uniformly */
export function handleValidationError(error: unknown) {
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      { error: 'Ошибка валидации', details: (error as { issues: unknown }).issues },
      { status: 400 }
    )
  }
  return null
}

/** Generic error handler for catch blocks */
export function handleApiError(error: unknown, context?: string) {
  console.error(context ? `${context}:` : 'API error:', error)
  return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
}

/** Clean nullable fields — convert null/undefined to empty string */
export function cleanNullableFields(
  body: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const clean = { ...body }
  for (const field of fields) {
    if (clean[field] == null) clean[field] = ''
  }
  return clean
}
