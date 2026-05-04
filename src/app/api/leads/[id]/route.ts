import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leadSchema } from '@/lib/validations'
import { requireAuth, handleApiError, cleanLeadFields, handleValidationError } from '@/lib/api-helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user || response) return response!

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
  } catch (error) {
    return handleApiError(error, 'GET /api/leads/[id]')
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user || response) return response!

    const { id } = await params
    const body = await request.json()

    const cleanBody = cleanLeadFields(body)
    let data: Record<string, unknown>
    try {
      data = leadSchema.parse(cleanBody) as Record<string, unknown>
    } catch (error) {
      const validationResponse = handleValidationError(error)
      if (validationResponse) return validationResponse
      throw error
    }

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
    const turnover = parseFloat(data.turnoverTsp as string) || 0
    const marginVal = parseFloat(data.margin as string) || 0
    const autoRevenue = turnover && marginVal ? (turnover * marginVal / 100).toFixed(2) : ''

    // If status changed, record the timestamp
    const statusChangedAt = (data.status && data.status !== existingLead.status)
      ? new Date()
      : (data.status === existingLead.status ? existingLead.statusChangedAt : undefined)

    const lead = await db.lead.update({
      where: { id },
      data: {
        organization: data.organization as string,
        partner: data.partner as string,
        zayavka: data.zayavka as string,
        status: (data.status as string) || '',
        activityType: (data.activityType as string) || '',
        comment: (data.comment as string) || '',
        contactInfo: (data.contactInfo as string) || '',
        email: (data.email as string) || '',
        margin: (data.margin as string) || '',
        manager: data.manager as string,
        turnoverTsp: (data.turnoverTsp as string) || '',
        ourRate: (data.ourRate as string) || '',
        revenue: autoRevenue,
        callDate: data.callDate ? new Date(data.callDate as string) : null,
        reported: (data.reported as boolean) ?? false,
        ...(statusChangedAt !== undefined && { statusChangedAt }),
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    const validationResponse = handleValidationError(error)
    if (validationResponse) return validationResponse
    return handleApiError(error, 'PUT /api/leads/[id]')
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuth()
    if (!user || response) return response!

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
  } catch (error) {
    return handleApiError(error, 'DELETE /api/leads/[id]')
  }
}
