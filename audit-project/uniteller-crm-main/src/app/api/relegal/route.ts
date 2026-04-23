import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { relegalSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role === 'vtb') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { fromOrg: { contains: search } },
        { toOrg: { contains: search } },
        { action: { contains: search } },
        { manager: { contains: search } },
      ]
    }

    const relegal = await db.relegal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(relegal)
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

    if (user.role === 'vtb') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await request.json()
    const data = relegalSchema.parse(body)

    const relegal = await db.relegal.create({
      data: {
        fromOrg: data.fromOrg || '',
        toOrg: data.toOrg || '',
        action: data.action || '',
        manager: data.manager,
      },
    })

    return NextResponse.json(relegal, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: (error as { issues: unknown }).issues },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
