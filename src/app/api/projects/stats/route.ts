/**
 * API Route: /api/projects/stats
 * Handles GET operations for project statistics
 */

import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get total projects count
    const { count: totalProjects, error: totalError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    // Get projects by status
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from('projects')
      .select('status')

    if (statusError) throw statusError

    const statusStats = statusCounts?.reduce((acc: Record<string, number>, project) => {
      const status = project.status || 'draft'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}) || {}

    // Get monthly stats for current year
    const currentYear = new Date().getFullYear()
    const { data: monthlyData, error: monthlyError } = await supabaseAdmin
      .from('projects')
      .select('created_at, gross_amount')
      .gte('created_at', `${currentYear}-01-01`)
      .lt('created_at', `${currentYear + 1}-01-01`)

    if (monthlyError) throw monthlyError

    const monthlyStats = Array(12).fill(0).map((_, index) => ({
      month: index + 1,
      count: 0,
      revenue: 0
    }))

    monthlyData?.forEach(project => {
      const month = new Date(project.created_at).getMonth()
      monthlyStats[month].count += 1
      monthlyStats[month].revenue += project.gross_amount || 0
    })

    return NextResponse.json({
      data: {
        totalProjects: totalProjects || 0,
        statusStats,
        monthlyStats
      }
    })
  } catch (error: any) {
    console.error('GET /api/projects/stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}