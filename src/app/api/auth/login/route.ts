import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, setSessionCookie, deleteSession, deleteSessionCookie } from '@/lib/auth'
import { cookies } from 'next/headers'

const UNITELLER_PASSWORD = 'cat16'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password || UNITELLER_PASSWORD !== password) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
    }

    // Find or create the uniteller user
    let user = await db.user.findFirst({ where: { role: 'uniteller' } })

    if (!user) {
      user = await db.user.create({
        data: {
          username: 'uniteller',
          password: UNITELLER_PASSWORD,
          fullName: 'Uniteller',
          role: 'uniteller',
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
    const token = cookieStore.get('crm_session')?.value

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
