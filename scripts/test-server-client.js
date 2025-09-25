/**
 * Test script for server-side Supabase client
 * Tests direct database access using SERVICE_ROLE_KEY
 */

const { config } = require('dotenv')
config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Testing server-side Supabase client...')
console.log(`URL: ${supabaseUrl}`)
console.log(`Service Key: ${supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 20)}...` : 'NOT SET'}`)

async function testServerClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  // Create server client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('\n🔍 Testing database access...')

  try {
    // Test 1: Get members
    console.log('1. Testing members table...')
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(3)

    if (membersError) {
      console.error('❌ Members query failed:', membersError.message)
    } else {
      console.log(`✅ Members: Found ${members?.length || 0} records`)
      if (members && members.length > 0) {
        console.log(`   First member: ${members[0].name} (${members[0].code})`)
      }
    }

    // Test 2: Get channels
    console.log('2. Testing channels table...')
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .limit(3)

    if (channelsError) {
      console.error('❌ Channels query failed:', channelsError.message)
    } else {
      console.log(`✅ Channels: Found ${channels?.length || 0} records`)
      if (channels && channels.length > 0) {
        console.log(`   First channel: ${channels[0].name} (fee: ${channels[0].fee_rate})`)
      }
    }

    // Test 3: Get categories
    console.log('3. Testing categories table...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(3)

    if (categoriesError) {
      console.error('❌ Categories query failed:', categoriesError.message)
    } else {
      console.log(`✅ Categories: Found ${categories?.length || 0} records`)
      if (categories && categories.length > 0) {
        console.log(`   First category: ${categories[0].name}`)
      }
    }

    console.log('\n🎉 Server client test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testServerClient()