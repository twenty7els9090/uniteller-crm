import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { relegalSchema } from '@/lib/validations'
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
        { fromOrg: { contains: search } },
        { toOrg: { contains: search } },
        { action: { contains: search } },
        { manager: { contains: search } },
      ]
    }

    const relegal = await db.relegal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(relegal)
  } catch (error) {
    return handleApiError(error, 'GET /api/relegal')
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
    const cleanBody = cleanNullableFields(body, ['fromOrg', 'toOrg', 'action'])
    const data = relegalSchema.parse(cleanBody)

    const relegal = await db.relegal.create({
      data: {
        fromOrg: data.fromOrg || '',
        toOrg: data.toOrg || '',
        action: data.action || '',
        manager: data.manager,
      },
    })

    return NextResponse.json(relegal, { status: 201 })
  } catch (error) {
    const validationResponse = handleValidationError(error)
    if (validationResponse) return validationResponse
    return handleApiError(error, 'POST /api/relegal')
  }
}
