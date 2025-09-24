const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Testing Supabase connection...');
console.log('📡 URL:', supabaseUrl);
console.log('🔐 Service Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'Missing');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function test() {
  try {
    // Test basic connection
    console.log('\n📋 Testing basic auth...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth result:', authError ? `Error: ${authError.message}` : 'OK');

    // Try to list tables
    console.log('\n📊 Testing database access...');
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
      
    if (error) {
      console.log('❌ Table list error:', error.message);
    } else {
      console.log('✅ Found tables:', data?.map(t => t.table_name) || []);
    }

    // Try members table specifically  
    console.log('\n👥 Testing members table...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (membersError) {
      console.log('❌ Members error:', membersError.message);
    } else {
      console.log('✅ Members accessible:', members?.length || 0, 'rows');
    }

  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

test();
