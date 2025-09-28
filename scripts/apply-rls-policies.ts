/**
 * Apply RLS Policies using direct SQL execution
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
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

async function applyRLSPolicies() {
  console.log('🔐 Applying RLS policies...')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'rls-policies.sql')
    const sqlContent = readFileSync(sqlPath, 'utf-8')

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    let successCount = 0
    let errorCount = 0

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue

      console.log(`\n${i + 1}/${statements.length}: Executing SQL statement...`)
      console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`)

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

        if (error) {
          console.error(`   ❌ Error:`, error.message)
          errorCount++
        } else {
          console.log(`   ✅ Success`)
          successCount++
        }
      } catch (err) {
        console.error(`   💥 Exception:`, err)
        errorCount++
      }
    }

    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} failed`)

    // Test access to each table
    console.log('\n🔍 Testing table access with anon client...')

    // Create anon client for testing
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const tables = [
      'members', 'channels', 'categories', 'projects', 'contacts',
      'feed_logs', 'team_tasks', 'mileage', 'funds_company', 'funds_personal',
      'settlements', 'settlement_items', 'app_settings'
    ]

    let accessibleCount = 0
    for (const table of tables) {
      try {
        const { data, error, count } = await anonClient
          .from(table as any)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.error(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: ${count || 0} records accessible`)
          accessibleCount++
        }
      } catch (err) {
        console.error(`💥 ${table}: ${err}`)
      }
    }

    console.log(`\n🎉 RLS policies applied! ${accessibleCount}/${tables.length} tables accessible`)

  } catch (error) {
    console.error('💥 RLS setup failed:', error)
  }
}

// Run the setup
applyRLSPolicies()