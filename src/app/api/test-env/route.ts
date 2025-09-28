import 'server-only'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    return NextResponse.json({
      supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
      serviceRoleKey: serviceRoleKey ? '✅ Set' : '❌ Missing',
      anonKey: anonKey ? '✅ Set' : '❌ Missing',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PWD: process.env.PWD,
      }
    })
  } catch (error) {
    console.error('Environment test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}