import 'server-only'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'members'

  // Improved logging for 400 error tracking
  console.log('[supporting-data] Request received:', {
    type,
    url: req.url,
    searchParams: Object.fromEntries(searchParams),
    timestamp: new Date().toISOString()
  })

  try {
    if (type === 'members') {
      const { data, error } = await supabaseAdmin.from('members').select('*').eq('active', true).order('name')
      if (error) throw error
      return NextResponse.json(data)
    }

    if (type === 'channels') {
      const { data, error } = await supabaseAdmin.from('channels').select('*').eq('active', true).order('name')
      if (error) throw error
      return NextResponse.json(data)
    }

    if (type === 'categories') {
      const { data, error } = await supabaseAdmin.from('categories').select('*').eq('active', true).order('name')
      if (error) throw error
      return NextResponse.json(data)
    }

    if (type === 'all') {
      const [membersResult, channelsResult, categoriesResult] = await Promise.all([
        supabaseAdmin.from('members').select('*').eq('active', true).order('name'),
        supabaseAdmin.from('channels').select('*').eq('active', true).order('name'),
        supabaseAdmin.from('categories').select('*').eq('active', true).order('name')
      ])

      if (membersResult.error || channelsResult.error || categoriesResult.error) {
        throw new Error('Failed to fetch supporting data')
      }

      return NextResponse.json({
        data: {
          members: membersResult.data,
          channels: channelsResult.data,
          categories: categoriesResult.data,
        },
      })
    }

    // Enhanced 400 error with better information
    const validTypes = ['members', 'channels', 'categories', 'all']
    console.error('[supporting-data] 400 Error - Invalid type:', {
      requestedType: type,
      validTypes,
      url: req.url,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      error: 'Invalid type parameter',
      message: `Type '${type}' is not supported. Valid types are: ${validTypes.join(', ')}`,
      validTypes,
      requestedType: type
    }, { status: 400 })
  } catch (err: any) {
    console.error('[supporting-data] ', err)
    return NextResponse.json({ message: err.message ?? 'Internal Server Error' }, { status: 500 })
  }
}