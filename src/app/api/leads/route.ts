import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leadSchema } from '@/lib/validations'
import { requireAuth, handleApiError, cleanLeadFields, handleValidationError } from '@/lib/api-helpers'

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuth()
    if (!user || response) return response!

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const partner = searchParams.get('partner') || ''
    const zayavka = searchParams.get('zayavka') || ''
    const manager = searchParams.get('manager') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

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

    if (partner) where.partner = partner
    if (zayavka) where.zayavka = zayavka
    if (manager) where.manager = manager

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.min(limit, 500),
      }),
      db.lead.count({ where }),
    ])

    return NextResponse.json({ leads, total, page, limit })
  } catch (error) {
    return handleApiError(error, 'GET /api/leads')
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuth()
    if (!user || response) return response!

    const body = await request.json()

    if (body.zayavka === 'Входящий' && !body.manager) {
      body.manager = '—'
    }

    const cleanBody = cleanLeadFields(body)
    let data: Record<string, unknown>
    try {
      data = leadSchema.parse(cleanBody) as Record<string, unknown>
    } catch (error) {
      const validationResponse = handleValidationError(error)
      if (validationResponse) return validationResponse
      throw error
    }

    if (user.role === 'vtb') {
      data.partner = 'ВТБ'
    }

    const turnover = parseFloat(data.turnoverTsp as string) || 0
    const marginVal = parseFloat(data.margin as string) || 0
    const autoRevenue = turnover && marginVal ? (turnover * marginVal / 100).toFixed(2) : ''

    if (data.zayavka === 'Входящий' && !data.manager) {
      data.manager = ''
    }

    const lead = await db.lead.create({
      data: {
        organization: data.organization as string,
        partner: data.partner as string,
        zayavka: data.zayavka as string,
        status: data.zayavka === 'Входящий' ? 'Не начато' : (data.status as string || ''),
        activityType: (data.activityType as string) || '',
        comment: (data.comment as string) || '',
        contactInfo: (data.contactInfo as string) || '',
        email: (data.email as string) || '',
        margin: (data.margin as string) || '',
        manager: data.manager as string,
        turnoverTsp: (data.turnoverTsp as string) || '',
        ourRate: (data.ourRate as string) || '',
        revenue: autoRevenue,
        callDate: null,
        reported: (data.reported as boolean) ?? false,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    const validationResponse = handleValidationError(error)
    if (validationResponse) return validationResponse
    return handleApiError(error, 'POST /api/leads')
  }
}
