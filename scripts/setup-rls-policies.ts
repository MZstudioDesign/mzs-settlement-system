/**
 * Setup Row Level Security (RLS) policies for all tables
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') })

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

const tables = [
  'members',
  'channels',
  'categories',
  'projects',
  'contacts',
  'feed_logs',
  'team_tasks',
  'mileage',
  'funds_company',
  'funds_personal',
  'settlements',
  'settlement_items',
  'app_settings'
]

async function setupRLSPolicies() {
  console.log('🔐 Setting up Row Level Security policies...')

  try {
    for (const table of tables) {
      console.log(`\n📋 Processing table: ${table}`)

      // Disable RLS temporarily to create policies
      const { error: disableRLSError } = await supabase.rpc('sql', {
        query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
      })

      if (disableRLSError) {
        console.warn(`⚠️ Could not disable RLS for ${table}:`, disableRLSError.message)
      } else {
        console.log(`✅ Disabled RLS for ${table}`)
      }

      // Create a policy that allows all operations for service role
      const { error: policyError } = await supabase.rpc('sql', {
        query: `
          DROP POLICY IF EXISTS "Allow all operations for service role" ON ${table};
          CREATE POLICY "Allow all operations for service role"
          ON ${table} FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
        `
      })

      if (policyError) {
        console.error(`❌ Failed to create policy for ${table}:`, policyError.message)
      } else {
        console.log(`✅ Created service role policy for ${table}`)
      }

      // Create a policy that allows all operations for anon users (for development)
      const { error: anonPolicyError } = await supabase.rpc('sql', {
        query: `
          DROP POLICY IF EXISTS "Allow all operations for anon" ON ${table};
          CREATE POLICY "Allow all operations for anon"
          ON ${table} FOR ALL
          TO anon
          USING (true)
          WITH CHECK (true);
        `
      })

      if (anonPolicyError) {
        console.error(`❌ Failed to create anon policy for ${table}:`, anonPolicyError.message)
      } else {
        console.log(`✅ Created anon policy for ${table}`)
      }

      // Re-enable RLS
      const { error: enableRLSError } = await supabase.rpc('sql', {
        query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      })

      if (enableRLSError) {
        console.error(`❌ Failed to enable RLS for ${table}:`, enableRLSError.message)
      } else {
        console.log(`✅ Enabled RLS for ${table}`)
      }
    }

    console.log('\n🎉 RLS policies setup completed!')
    console.log('\n📊 Testing table access after policy setup:')

    // Test access to each table
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table as any)
          .select('*', { count: 'exact' })
          .limit(1)

        if (error) {
          console.error(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: ${count || 0} records accessible`)
        }
      } catch (err) {
        console.error(`💥 ${table}: ${err}`)
      }
    }

  } catch (error) {
    console.error('💥 RLS setup failed:', error)
  }
}

// Run the setup
setupRLSPolicies()