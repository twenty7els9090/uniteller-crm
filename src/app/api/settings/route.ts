import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/settings — fetch all settings grouped by category
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const settings = await db.setting.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    })

    // Group by category
    const grouped: Record<string, string[]> = {}
    for (const s of settings) {
      if (!grouped[s.category]) grouped[s.category] = []
      grouped[s.category].push(s.value)
    }

    return NextResponse.json(grouped)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки настроек' }, { status: 500 })
  }
}

// POST /api/settings — add a new setting value
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await request.json()
    const { category, value } = body

    if (!category || !value || typeof value !== 'string' || value.trim().length === 0) {
      return NextResponse.json({ error: 'Укажите категорию и значение' }, { status: 400 })
    }

    const trimmedValue = value.trim()

    // Check for duplicate
    const existing = await db.setting.findUnique({
      where: { category_value: { category, value: trimmedValue } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Такое значение уже существует' }, { status: 409 })
    }

    // Get next sort order
    const maxSort = await db.setting.aggregate({
      where: { category },
      _max: { sortOrder: true },
    })

    const setting = await db.setting.create({
      data: {
        category,
        value: trimmedValue,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    })

    return NextResponse.json(setting, { status: 201 })
  } catch (error) {
    console.error('POST /api/settings error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/settings — delete a setting value
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const value = searchParams.get('value')

    if (!category || !value) {
      return NextResponse.json({ error: 'Укажите категорию и значение' }, { status: 400 })
    }

    try {
      await db.setting.delete({
        where: { category_value: { category, value } },
      })
    } catch {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/settings error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
