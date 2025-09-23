/**
 * API Route: /api/settlements
 * Handles GET (list) and POST (create) operations for settlements
 */

import { NextRequest, NextResponse } from 'next/server'
import { settlementsApi } from '@/lib/api/settlements'
import { CreateSettlementForm } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      month: searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined,
      member_id: searchParams.get('member_id') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
    }

    const result = await settlementsApi.getSettlements(params)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/settlements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['year', 'month']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate year and month
    const currentYear = new Date().getFullYear()
    if (body.year < 2020 || body.year > currentYear + 1) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      )
    }

    if (body.month < 1 || body.month > 12) {
      return NextResponse.json(
        { error: 'Invalid month' },
        { status: 400 }
      )
    }

    const settlementData: CreateSettlementForm = {
      year: body.year,
      month: body.month,
      notes: body.notes,
    }

    const result = await settlementsApi.createSettlement(settlementData)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/settlements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}