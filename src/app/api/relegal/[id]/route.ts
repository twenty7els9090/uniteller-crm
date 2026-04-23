import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { relegalSchema } from '@/lib/validations'

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
    const data = relegalSchema.parse(body)

    const existing = await db.relegal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    const relegal = await db.relegal.update({
      where: { id },
      data: {
        fromOrg: data.fromOrg || '',
        toOrg: data.toOrg || '',
        action: data.action || '',
        manager: data.manager,
      },
    })

    return NextResponse.json(relegal)
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

    const existing = await db.relegal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    await db.relegal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
