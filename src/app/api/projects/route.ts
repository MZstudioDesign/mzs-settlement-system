/**
 * API Route: /api/projects
 * Handles GET (list) and POST (create) operations for projects
 */

import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CreateProjectForm } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const channel_id = searchParams.get('channel_id')
    const category_id = searchParams.get('category_id')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc'

    // Build query
    let query = supabaseAdmin
      .from('projects')
      .select(`
        *,
        channels!projects_channel_id_fkey(id, name),
        categories!projects_category_id_fkey(id, name)
      `)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,client_name.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (channel_id) {
      query = query.eq('channel_id', channel_id)
    }

    if (category_id) {
      query = query.eq('category_id', category_id)
    }

    // Apply sorting and pagination
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range((page - 1) * limit, page * limit - 1)

    const { data: projects, error: projectsError, count } = await query

    if (projectsError) throw projectsError

    // Get total count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    return NextResponse.json({
      data: projects || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields with improved logging
    const requiredFields = ['name', 'channel_id', 'gross_amount', 'designers']
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error('[projects] 400 Error - Missing field:', {
          missingField: field,
          receivedBody: Object.keys(body),
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          {
            error: `Missing required field: ${field}`,
            requiredFields,
            receivedFields: Object.keys(body)
          },
          { status: 400 }
        )
      }
    }

    // Validate designers array with improved logging
    if (!Array.isArray(body.designers) || body.designers.length === 0) {
      console.error('[projects] 400 Error - Invalid designers:', {
        designersValue: body.designers,
        designersType: typeof body.designers,
        isArray: Array.isArray(body.designers),
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        {
          error: 'At least one designer must be assigned',
          received: body.designers,
          expectedType: 'array with at least one element'
        },
        { status: 400 }
      )
    }

    // Validate gross_amount is positive with improved logging
    if (body.gross_amount <= 0) {
      console.error('[projects] 400 Error - Invalid gross_amount:', {
        grossAmount: body.gross_amount,
        grossAmountType: typeof body.gross_amount,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        {
          error: 'Gross amount must be positive',
          received: body.gross_amount,
          expectedType: 'positive number'
        },
        { status: 400 }
      )
    }

    const projectData = {
      client_name: body.name,
      channel_id: body.channel_id,
      category_id: body.category_id || null,
      title: body.title || body.name,
      qty: body.qty || 1,
      list_price_net: body.gross_amount,
      discount_net: body.discount_net || 0,
      deposit_gross_T: body.gross_amount,
      net_B: body.gross_amount - (body.discount_net || 0),
      settle_date: body.payment_date,
      work_date: body.project_date,
      invoice_requested: body.invoice_requested || false,
      designers: body.designers,
      notes: body.notes,
      status: 'active'
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert(projectData)
      .select(`
        *,
        channels!projects_channel_id_fkey(id, name),
        categories!projects_category_id_fkey(id, name)
      `)
      .single()

    if (projectError) throw projectError

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}