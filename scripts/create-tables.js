const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function createBasicTables() {
  console.log('🚀 Creating essential tables manually...');

  const tables = [
    {
      name: 'members',
      sql: `
        INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000001', 'admin@temp.com') ON CONFLICT DO NOTHING;
        
        CREATE TABLE IF NOT EXISTS public.members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          code VARCHAR(20) NOT NULL UNIQUE,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        INSERT INTO public.members (name, code) VALUES 
          ('오유택', 'OY'), ('이예천', 'LE'), ('김연지', 'KY'), 
          ('김하늘', 'KH'), ('이정수', 'IJ'), ('박지윤', 'PJ')
        ON CONFLICT (code) DO NOTHING;
      `
    },
    {
      name: 'channels', 
      sql: `
        CREATE TABLE IF NOT EXISTS public.channels (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          fee_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        INSERT INTO public.channels (name, fee_rate) VALUES 
          ('크몽', 0.21), ('계좌입금', 0.0)
        ON CONFLICT (name) DO NOTHING;
      `
    },
    {
      name: 'categories',
      sql: `
        CREATE TABLE IF NOT EXISTS public.categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
          name VARCHAR(100) NOT NULL UNIQUE,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        INSERT INTO public.categories (name) VALUES 
          ('카드뉴스'), ('포스터'), ('현수막/배너'), ('메뉴판'), ('블로그스킨')
        ON CONFLICT (name) DO NOTHING;
      `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`📝 Creating ${table.name} table...`);
      
      // Use the built-in SQL editor API endpoint 
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ sql: table.sql })
      });

      if (response.ok) {
        console.log(`✅ ${table.name} created successfully`);
      } else {
        console.log(`⚠️ ${table.name} response:`, response.status, await response.text());
      }
      
    } catch (error) {
      console.log(`❌ Error creating ${table.name}:`, error.message);
    }
  }

  // Test if it worked
  try {
    console.log('\n🔍 Testing table access...');
    const { data, error } = await supabase.from('members').select('*').limit(3);
    if (error) {
      console.log('❌ Test failed:', error.message);
    } else {
      console.log('✅ Tables working! Found', data?.length || 0, 'members');
    }
  } catch (err) {
    console.log('❌ Test error:', err.message);
  }
}

createBasicTables();
