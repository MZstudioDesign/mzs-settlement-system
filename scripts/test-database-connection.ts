/**
 * Test database connection and verify table structure
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') })

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDatabaseConnection() {
  console.log('🔌 Testing Supabase connection...')
  console.log(`🌐 URL: ${supabaseUrl}`)

  const tables = ['members', 'channels', 'categories', 'projects', 'contacts', 'feed_logs', 'team_tasks', 'mileage', 'funds_company', 'funds_personal', 'settlements', 'settlement_items']

  try {
    // Test basic connection
    console.log('\n📊 Testing table access:')

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table as any)
          .select('*', { count: 'exact' })
          .limit(1)

        if (error) {
          console.error(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: ${count || 0} records`)
        }
      } catch (err) {
        console.error(`💥 ${table}: ${err}`)
      }
    }

    // Test specific project query that's failing in the app
    console.log('\n🎯 Testing specific API queries:')

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          channel:channels(name),
          category:categories(name)
        `)
        .limit(5)

      if (error) {
        console.error(`❌ Projects with relations: ${error.message}`)
      } else {
        console.log(`✅ Projects with relations: ${data?.length || 0} records`)
        console.log('Sample record:', JSON.stringify(data?.[0], null, 2))
      }
    } catch (err) {
      console.error(`💥 Projects with relations: ${err}`)
    }

    // Test supporting data query
    try {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*')

      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('*')

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')

      if (membersError || channelsError || categoriesError) {
        console.error('❌ Supporting data queries failed:')
        console.error('  Members:', membersError?.message)
        console.error('  Channels:', channelsError?.message)
        console.error('  Categories:', categoriesError?.message)
      } else {
        console.log('✅ Supporting data queries successful')
        console.log(`  Members: ${members?.length || 0}`)
        console.log(`  Channels: ${channels?.length || 0}`)
        console.log(`  Categories: ${categories?.length || 0}`)
      }
    } catch (err) {
      console.error(`💥 Supporting data queries: ${err}`)
    }

  } catch (error) {
    console.error('💥 Database connection test failed:', error)
  }
}

// Run the test
testDatabaseConnection()