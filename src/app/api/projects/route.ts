/**
 * API Route: /api/projects
 * Handles GET (list) and POST (create) operations for projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { projectsApi } from '@/lib/api'
import { CreateProjectForm } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      channel_id: searchParams.get('channel_id') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
    }

    const result = await projectsApi.getProjects(params)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/projects error:', error)
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
    const requiredFields = ['name', 'channel_id', 'gross_amount', 'designers']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate designers array
    if (!Array.isArray(body.designers) || body.designers.length === 0) {
      return NextResponse.json(
        { error: 'At least one designer must be assigned' },
        { status: 400 }
      )
    }

    // Validate gross_amount is positive
    if (body.gross_amount <= 0) {
      return NextResponse.json(
        { error: 'Gross amount must be positive' },
        { status: 400 }
      )
    }

    const projectData: CreateProjectForm = {
      name: body.name,
      channel_id: body.channel_id,
      category_id: body.category_id,
      gross_amount: body.gross_amount,
      discount_net: body.discount_net || 0,
      designers: body.designers,
      project_date: body.project_date,
      payment_date: body.payment_date,
      notes: body.notes,
    }

    const result = await projectsApi.createProject(projectData)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}