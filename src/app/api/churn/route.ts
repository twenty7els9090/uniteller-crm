import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { churnSchema } from '@/lib/validations'
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
  } catch (error) {
    return handleApiError(error, 'GET /api/churn')
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
    const cleanBody = cleanNullableFields(body, ['turnoverTsp', 'revenue', 'status', 'comment'])
    const data = churnSchema.parse(cleanBody)

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
  } catch (error) {
    const validationResponse = handleValidationError(error)
    if (validationResponse) return validationResponse
    return handleApiError(error, 'POST /api/churn')
  }
}
