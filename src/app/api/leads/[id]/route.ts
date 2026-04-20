import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { leadSchema } from '@/lib/validations'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    const lead = await db.lead.findUnique({ where: { id } })

    if (!lead) {
      return NextResponse.json({ error: 'Лид не найден' }, { status: 404 })
    }

    // VTB users can only see VTB leads
    if (user.role === 'vtb' && lead.partner !== 'ВТБ') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

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

    // Clean null values from nullable optional fields before validation
    const nullableFields = ['status', 'comment', 'contactInfo', 'email', 'margin', 'activityType', 'turnoverTsp', 'ourRate', 'revenue']
    const cleanBody = { ...body }
    for (const field of nullableFields) {
      if (cleanBody[field] == null) cleanBody[field] = ''
    }
    const data = leadSchema.parse(cleanBody)

    const existingLead = await db.lead.findUnique({ where: { id } })

    if (!existingLead) {
      return NextResponse.json({ error: 'Лид не найден' }, { status: 404 })
    }

    // VTB users can only edit VTB leads
    if (user.role === 'vtb' && existingLead.partner !== 'ВТБ') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    // VTB users cannot change partner
    if (user.role === 'vtb') {
      data.partner = 'ВТБ'
    }

    // Auto-calculate revenue: turnoverTsp * margin / 100 (server always owns this calc)
    const turnover = parseFloat(data.turnoverTsp) || 0
    const marginVal = parseFloat(data.margin) || 0
    const autoRevenue = turnover && marginVal ? (turnover * marginVal / 100).toFixed(2) : ''

    // If status changed, record the timestamp
    const statusChangedAt = (data.status && data.status !== existingLead.status)
      ? new Date()
      : (data.status === existingLead.status ? existingLead.statusChangedAt : undefined)

    const lead = await db.lead.update({
      where: { id },
      data: {
        organization: data.organization,
        partner: data.partner,
        zayavka: data.zayavka,
        status: data.status || '',
        activityType: data.activityType || '',
        comment: data.comment || '',
        contactInfo: data.contactInfo || '',
        email: data.email || '',
        margin: data.margin || '',
        manager: data.manager,
        turnoverTsp: data.turnoverTsp || '',
        ourRate: data.ourRate || '',
        revenue: autoRevenue,
        reported: data.reported ?? false,
        ...(statusChangedAt !== undefined && { statusChangedAt }),
      },
    })

    return NextResponse.json(lead)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: (error as { issues: unknown }).issues },
        { status: 400 }
      )
    }
    console.error('PUT /api/leads/[id] error:', error)
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

    // Only uniteller can delete leads
    if (user.role !== 'uniteller') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { id } = await params

    const lead = await db.lead.findUnique({ where: { id } })
    if (!lead) {
      return NextResponse.json({ error: 'Лид не найден' }, { status: 404 })
    }

    await db.lead.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
