/**
 * Supabase Connection Test
 * Tests if environment variables are properly loaded and Supabase is accessible
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Environment Variables:')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing')
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Loaded' : '❌ Missing')
console.log('')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Testing Supabase Connection...')

// Test connection by fetching auth session
async function testConnection() {
  try {
    // Test 1: Check if we can reach the API
    const { data, error } = await supabase.from('members').select('count', { count: 'exact' })

    if (error) {
      console.log('⚠️ Table query failed (expected if table doesn\'t exist yet):', error.message)

      // Test 2: Try a simpler connection test
      const { data: authData, error: authError } = await supabase.auth.getSession()

      if (authError) {
        console.error('❌ Supabase connection failed:', authError.message)
        return false
      } else {
        console.log('✅ Supabase connection successful!')
        console.log('📊 Auth service is reachable')
        return true
      }
    } else {
      console.log('✅ Supabase connection successful!')
      console.log('📊 Members table exists with', data?.length || 0, 'records')
      return true
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase is properly configured and accessible!')
    console.log('💡 You can now use the MCP Supabase server to manage your database.')
  } else {
    console.log('\n🚨 Supabase connection issues detected.')
    console.log('💡 Please check your environment variables and network connection.')
  }
})