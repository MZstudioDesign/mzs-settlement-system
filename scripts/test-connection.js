/**
 * Supabase 연결 테스트 스크립트
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Supabase 연결 테스트...')
console.log('URL:', supabaseUrl)
console.log('Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔗 연결 중...')

    // 현재 테이블 목록 확인
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (error) {
      console.error('❌ 테이블 조회 실패:', error.message)
      return
    }

    console.log('✅ 연결 성공!')
    console.log('📋 현재 테이블 목록:')

    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
    } else {
      console.log('  (테이블 없음)')
    }

    // 멤버 데이터 확인
    console.log('\n👥 멤버 데이터 확인...')
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select('*')
      .limit(5)

    if (memberError) {
      console.log('  ℹ️ 멤버 테이블이 아직 생성되지 않았습니다:', memberError.message)
    } else {
      console.log('  ✅ 멤버 데이터:', members?.length || 0, '개 발견')
    }

  } catch (error) {
    console.error('❌ 연결 실패:', error.message)
  }
}

testConnection()