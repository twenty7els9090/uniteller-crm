import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { additionalSchema } from '@/lib/validations'
import { requireAuth, cleanNullableFields, handleValidationError, handleApiError } from '@/lib/api-helpers'

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuth()
    if (!user || response) return response!

    if (user.role === 'vtb') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { organization: { contains: search } },
        { partner: { contains: search } },
        { finInstrument: { contains: search } },
      ]
    }

    const records = await db.additional.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(records)
  } catch (error) {
    return handleApiError(error, 'GET /api/additional')
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuth()
    if (!user || response) return response!

    if (user.role === 'vtb') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await request.json()
    const cleanBody = cleanNullableFields(body, ['partner', 'finInstrument', 'turnover', 'revenue'])
    const data = additionalSchema.parse(cleanBody)

    const record = await db.additional.create({
      data: {
        organization: data.organization,
        partner: data.partner || '',
        finInstrument: data.finInstrument || '',
        turnover: data.turnover || '',
        revenue: data.revenue || '',
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    const validationResponse = handleValidationError(error)
    if (validationResponse) return validationResponse
    return handleApiError(error, 'POST /api/additional')
  }
}
