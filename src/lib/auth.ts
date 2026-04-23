import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import type { AuthUser } from '@/lib/types'

export type { AuthUser }

const SESSION_COOKIE_NAME = 'leadmanager_session'
const SESSION_EXPIRY_HOURS = 24 * 7 // 7 days

async function cleanExpiredSessions(): Promise<void> {
  try {
    await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
  } catch {
    // Silent cleanup failure — non-critical
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    cleanExpiredSessions()
    return null
  }

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      db.session.delete({ where: { token } }).catch(() => {})
    }
    return null
  }

  return {
    id: session.user.id,
    username: session.user.username,
    fullName: session.user.fullName,
    role: session.user.role as 'uniteller' | 'vtb',
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000)

  await db.session.create({
    data: { token, userId, expiresAt },
  })

  return token
}

export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } })
}

export function setSessionCookie(token: string) {
  const expires = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires,
  }
}

export function deleteSessionCookie() {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}
