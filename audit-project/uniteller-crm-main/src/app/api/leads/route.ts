import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { leadSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const partner = searchParams.get('partner') || ''
    const zayavka = searchParams.get('zayavka') || ''
    const manager = searchParams.get('manager') || ''

    const where: Record<string, unknown> = {}

    // VTB users can only see VTB leads
    if (user.role === 'vtb') {
      where.partner = 'ВТБ'
    }

    if (search) {
      where.OR = [
        { organization: { contains: search } },
        { contactInfo: { contains: search } },
        { comment: { contains: search } },
        { manager: { contains: search } },
        { status: { contains: search } },
      ]
    }

    if (partner) {
      where.partner = partner
    }

    if (zayavka) {
      where.zayavka = zayavka
    }

    if (manager) {
      where.manager = manager
    }

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500, // Safety limit — client filters locally
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('GET /api/leads error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    // For incoming leads, set manager placeholder before validation (manager not required)
    if (body.zayavka === 'Входящий' && !body.manager) {
      body.manager = '—'
    }

    // Clean null values from nullable optional fields
    const nullableFields = ['status', 'comment', 'contactInfo', 'email', 'margin', 'activityType', 'turnoverTsp', 'ourRate', 'revenue']
    const cleanBody = { ...body }
    for (const field of nullableFields) {
      if (cleanBody[field] == null) cleanBody[field] = ''
    }
    const data = leadSchema.parse(cleanBody)

    // VTB users can only create VTB leads
    if (user.role === 'vtb') {
      data.partner = 'ВТБ'
    }

    // Auto-calculate revenue: turnoverTsp * margin / 100
    const turnover = parseFloat(data.turnoverTsp) || 0
    const marginVal = parseFloat(data.margin) || 0
    const autoRevenue = turnover && marginVal ? (turnover * marginVal / 100).toFixed(2) : ''

    // Incoming leads don't require manager — set default
    if (data.zayavka === 'Входящий' && !data.manager) {
      data.manager = ''
    }

    const lead = await db.lead.create({
      data: {
        organization: data.organization,
        partner: data.partner,
        zayavka: data.zayavka,
        status: data.zayavka === 'Входящий' ? 'Не начато' : (data.status || ''),
        activityType: data.activityType || '',
        comment: data.comment || '',
        contactInfo: data.contactInfo || '',
        email: data.email || '',
        margin: data.margin || '',
        manager: data.manager,
        turnoverTsp: data.turnoverTsp || '',
        ourRate: data.ourRate || '',
        revenue: autoRevenue,
        callDate: null,
        reported: data.reported ?? false,
      },
    })

    return NextResponse.json(lead, { status: 201 })
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
