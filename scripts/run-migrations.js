const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function runMigrations() {
  console.log('🚀 Starting database migration...');
  console.log('📡 Supabase URL:', supabaseUrl);

  // Run the initial schema first
  const schemaPath = path.join(__dirname, '../supabase/migrations/20240922000001_initial_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('📝 Running initial schema...');
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSql });
    
    if (error) {
      console.log('⚠️ Schema error:', error);
    } else {
      console.log('✅ Initial schema applied successfully');
    }

    // Test if tables exist now
    const { data, error: testError } = await supabase.from('members').select('count').limit(1);
    if (testError) {
      console.log('⚠️ Members table test failed:', testError.message);
    } else {
      console.log('✅ Members table accessible');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
}

runMigrations().catch(console.error);
