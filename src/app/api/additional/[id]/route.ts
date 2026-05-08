import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { additionalSchema } from '@/lib/validations'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = additionalSchema.parse(body)

    const existing = await db.additional.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    const record = await db.additional.update({
      where: { id },
      data: {
        organization: data.organization,
        partner: data.partner || '',
        finInstrument: data.finInstrument || '',
        turnover: data.turnover || '',
        revenue: data.revenue || '',
      },
    })

    return NextResponse.json(record)
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

    const { id } = await params

    const existing = await db.additional.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    await db.additional.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
