import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { churnSchema } from '@/lib/validations'

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
        { organization: { contains: search } },
        { comment: { contains: search } },
        { manager: { contains: search } },
        { status: { contains: search } },
      ]
    }

    const churns = await db.churn.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(churns)
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
    const data = churnSchema.parse(body)

    const churn = await db.churn.create({
      data: {
        organization: data.organization,
        turnoverTsp: data.turnoverTsp || '',
        revenue: data.revenue || '',
        status: data.status || '',
        comment: data.comment || '',
        manager: data.manager,
        reported: data.reported ?? false,
      },
    })

    return NextResponse.json(churn, { status: 201 })
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
