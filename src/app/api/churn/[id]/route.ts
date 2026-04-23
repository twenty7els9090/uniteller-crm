import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { churnSchema } from '@/lib/validations'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role === 'vtb') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const data = churnSchema.parse(body)

    const existing = await db.churn.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    const churn = await db.churn.update({
      where: { id },
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

    return NextResponse.json(churn)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role !== 'uniteller') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { id } = await params

    const existing = await db.churn.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    await db.churn.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
