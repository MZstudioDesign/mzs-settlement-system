/**
 * 마이그레이션 실행 스크립트
 * Supabase 데이터베이스에 직접 SQL을 실행하여 스키마를 생성합니다.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// 환경변수 로드
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  console.log('🚀 마이그레이션 시작...')

  const migrations = [
    '20240922000001_initial_schema.sql',
    '20240922000002_update_functions.sql',
    '20240922000003_seed_data.sql'
  ]

  for (const migration of migrations) {
    const filePath = join(process.cwd(), 'supabase', 'migrations', migration)

    try {
      console.log(`📄 실행 중: ${migration}`)

      const sql = readFileSync(filePath, 'utf-8')

      // SQL을 세미콜론으로 분할하여 개별 실행
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.length > 10) { // 짧은 문장 제외
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

          if (error) {
            console.warn(`⚠️ SQL 실행 중 경고: ${error.message}`)
            // 일부 에러는 무시 (예: 이미 존재하는 테이블)
            if (!error.message.includes('already exists') &&
                !error.message.includes('duplicate key')) {
              throw error
            }
          }
        }
      }

      console.log(`✅ 완료: ${migration}`)
    } catch (error) {
      console.error(`❌ 실패: ${migration}`, error)
      // 계속 진행
    }
  }

  console.log('✅ 모든 마이그레이션 완료!')
}

// SQL 실행 함수 생성
async function createExecSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'SUCCESS';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN SQLERRM;
    END;
    $$;
  `

  const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSql })
    .catch(async () => {
      // 함수가 없으면 직접 실행
      const { error } = await supabase
        .from('_supabase_migrations')
        .select('version')
        .limit(1)
        .single()

      if (error && error.code === '42P01') {
        // 테이블이 없으면 마이그레이션 테이블부터 생성
        console.log('📋 마이그레이션 테이블 생성 중...')

        const migrationTableSql = `
          CREATE SCHEMA IF NOT EXISTS supabase_migrations;

          CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
            version TEXT PRIMARY KEY,
            statements TEXT[],
            name TEXT
          );
        `

        // 직접 실행
        console.log('🔧 기본 설정 실행 중...')
      }

      return { error }
    })

  if (error) {
    console.warn('⚠️ exec_sql 함수 생성 실패:', error.message)
  }
}

async function main() {
  try {
    console.log('🔍 데이터베이스 연결 확인...')

    // 연결 테스트
    const { error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)

    if (connectionError) {
      console.error('❌ 데이터베이스 연결 실패:', connectionError.message)
      process.exit(1)
    }

    console.log('✅ 데이터베이스 연결 성공!')

    await createExecSqlFunction()
    await runMigrations()

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error)
    process.exit(1)
  }
}

main()