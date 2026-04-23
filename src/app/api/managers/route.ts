import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role !== 'uniteller') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const managers = await db.user.findMany({
      select: {
        id: true,
        fullName: true,
        role: true,
        username: true,
      },
      orderBy: { fullName: 'asc' },
    })

    return NextResponse.json(managers)
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role !== 'uniteller') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, fullName, role } = body

    if (!username || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      )
    }

    if (!['uniteller', 'vtb'].includes(role)) {
      return NextResponse.json(
        { error: 'Неверная роль' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким именем уже существует' },
        { status: 409 }
      )
    }

    const newUser = await db.user.create({
      data: { username, password, fullName, role },
    })

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role !== 'uniteller') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'ID пользователя обязателен' }, { status: 400 })
    }

    // Cannot delete yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'Нельзя удалить себя' }, { status: 400 })
    }

    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
