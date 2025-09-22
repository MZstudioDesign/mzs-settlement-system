/**
 * API Route: /api/projects/batch
 * Handles batch operations for projects (update status, delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { projectsApi } from '@/lib/api'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const { ids, action, ...data } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required and must not be empty' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'update_status':
        if (!data.status) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          )
        }
        result = await projectsApi.batchUpdateStatus(ids, data.status)
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('PUT /api/projects/batch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()

    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required and must not be empty' },
        { status: 400 }
      )
    }

    const result = await projectsApi.batchDelete(ids)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('DELETE /api/projects/batch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}