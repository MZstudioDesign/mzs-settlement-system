/**
 * API Route: /api/projects/stats
 * Handles GET operations for project statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { projectsApi } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const result = await projectsApi.getStats()

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/projects/stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}