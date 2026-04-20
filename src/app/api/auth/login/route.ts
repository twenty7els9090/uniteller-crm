import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, setSessionCookie, deleteSession, deleteSessionCookie } from '@/lib/auth'
import { cookies } from 'next/headers'

const PASSWORDS: Record<string, string> = {
  uniteller: 'cat16',
  vtb: 'vtbx',
}

const ROLE_DISPLAY: Record<string, string> = {
  uniteller: 'Uniteller',
  vtb: 'ВТБ',
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, password } = body

    if (!role || !password) {
      return NextResponse.json({ error: 'Укажите роль и пароль' }, { status: 400 })
    }

    if (!['uniteller', 'vtb'].includes(role)) {
      return NextResponse.json({ error: 'Неверная роль' }, { status: 400 })
    }

    if (PASSWORDS[role] !== password) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
    }

    // Find or create a session user for this role
    let user = await db.user.findFirst({ where: { role } })

    if (!user) {
      user = await db.user.create({
        data: {
          username: role,
          password: PASSWORDS[role],
          fullName: ROLE_DISPLAY[role],
          role,
        },
      })
    }

    const token = await createSession(user.id)
    const cookie = setSessionCookie(token)

    return NextResponse.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    }, {
      headers: {
        'Set-Cookie': `${cookie.name}=${cookie.value}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Expires=${cookie.expires?.toUTCString()}`,
      },
    })
  } catch (error) {
    console.error('POST /api/auth/login error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('leadmanager_session')?.value

    if (token) {
      await deleteSession(token)
    }

    const cookie = deleteSessionCookie()

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Set-Cookie': `${cookie.name}=${cookie.value}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=0`,
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
