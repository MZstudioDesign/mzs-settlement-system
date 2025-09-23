/**
 * API Route: /api/settlements/[id]
 * Handles GET, PATCH, and DELETE operations for individual settlements
 */

import { NextRequest, NextResponse } from 'next/server'
import { settlementsApi } from '@/lib/api/settlements'

interface RouteParams {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const result = await settlementsApi.getSettlement(params.id)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/settlements/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()

    const result = await settlementsApi.updateSettlement(params.id, body)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('PATCH /api/settlements/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const result = await settlementsApi.deleteSettlement(params.id)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('DELETE /api/settlements/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}