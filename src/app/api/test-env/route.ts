/**
 * API Route: /api/test-env
 * Tests environment variable loading and Supabase connectivity
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✅ Loaded' : '❌ Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ Loaded' : '❌ Missing',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? '✅ Loaded' : '❌ Missing',
    }

    // Test Supabase connection
    let connectionStatus = '❌ Not tested'
    let tableStatus = '❌ Not tested'

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Test auth service
        const { data: authData, error: authError } = await supabase.auth.getSession()

        if (!authError) {
          connectionStatus = '✅ Connected'

          // Test if members table exists (expected to fail initially)
          try {
            const { data, error } = await supabase.from('members').select('count', { count: 'exact' })
            if (error) {
              tableStatus = `⚠️ Tables not created yet: ${error.message}`
            } else {
              tableStatus = `✅ Tables exist (${data?.length || 0} members)`
            }
          } catch (err) {
            tableStatus = `⚠️ Tables not accessible: ${err instanceof Error ? err.message : 'Unknown error'}`
          }
        } else {
          connectionStatus = `❌ Auth failed: ${authError.message}`
        }
      } catch (err) {
        connectionStatus = `❌ Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
    }

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: {
        variables: envStatus,
        supabase: {
          connection: connectionStatus,
          tables: tableStatus,
          url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not set',
        }
      },
      nextSteps: supabaseUrl && supabaseAnonKey && connectionStatus.includes('✅')
        ? 'Ready to deploy database schema using MCP Supabase server'
        : 'Check environment variables in .env.local'
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}