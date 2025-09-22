/**
 * API Route: /api/projects/[id]
 * Handles GET (single), PUT (update), and DELETE operations for projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { projectsApi } from '@/lib/api'
import { UpdateProjectForm } from '@/types/database'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const result = await projectsApi.getProject(params.id)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`GET /api/projects/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()

    // Validate gross_amount if provided
    if (body.gross_amount !== undefined && body.gross_amount <= 0) {
      return NextResponse.json(
        { error: 'Gross amount must be positive' },
        { status: 400 }
      )
    }

    // Validate designers array if provided
    if (body.designers !== undefined) {
      if (!Array.isArray(body.designers) || body.designers.length === 0) {
        return NextResponse.json(
          { error: 'At least one designer must be assigned' },
          { status: 400 }
        )
      }
    }

    const updateData: UpdateProjectForm = {
      ...(body.name && { name: body.name }),
      ...(body.channel_id && { channel_id: body.channel_id }),
      ...(body.category_id && { category_id: body.category_id }),
      ...(body.gross_amount !== undefined && { gross_amount: body.gross_amount }),
      ...(body.discount_net !== undefined && { discount_net: body.discount_net }),
      ...(body.designers && { designers: body.designers }),
      ...(body.status && { status: body.status }),
      ...(body.project_date && { project_date: body.project_date }),
      ...(body.payment_date && { payment_date: body.payment_date }),
      ...(body.notes !== undefined && { notes: body.notes }),
    }

    const result = await projectsApi.updateProject(params.id, updateData)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`PUT /api/projects/${params.id} error:`, error)
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
    const result = await projectsApi.deleteProject(params.id)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`DELETE /api/projects/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}