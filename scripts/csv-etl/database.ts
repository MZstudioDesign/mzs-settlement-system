/**
 * Database Utilities for CSV ETL
 * Supabase 데이터베이스 연동 및 벌크 삽입 유틸리티
 */

import { config } from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { BatchInsertResult } from './types';

// .env.local 파일 로드
config({ path: path.join(process.cwd(), '.env.local') });

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 참조 데이터 조회 (멤버, 채널, 카테고리)
 */
export async function loadReferenceData() {
  try {
    const [membersResult, channelsResult, categoriesResult] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('channels').select('*'),
      supabase.from('categories').select('*')
    ]);

    if (membersResult.error) throw membersResult.error;
    if (channelsResult.error) throw channelsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    return {
      members: membersResult.data || [],
      channels: channelsResult.data || [],
      categories: categoriesResult.data || []
    };
  } catch (error) {
    throw new Error(`참조 데이터 로드 실패: ${error}`);
  }
}

/**
 * 프로젝트 ID 조회 (제목으로)
 */
export async function getProjectIdByTitle(title: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('title', title)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116는 "행을 찾을 수 없음" 오류
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.warn(`프로젝트 ID 조회 실패: ${title}`, error);
    return null;
  }
}

/**
 * 벌크 삽입 (배치 처리)
 */
export async function bulkInsert<T>(
  tableName: string,
  data: T[],
  batchSize: number = 100
): Promise<BatchInsertResult> {
  const result: BatchInsertResult = {
    tableName,
    success: true,
    insertedCount: 0,
    errors: []
  };

  if (!data || data.length === 0) {
    return result;
  }

  try {
    // 배치 단위로 나누어 처리
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      try {
        const { error, count } = await supabase
          .from(tableName)
          .insert(batch)
          .select('*', { count: 'exact' });

        if (error) {
          // 개별 행 오류 처리
          for (let j = 0; j < batch.length; j++) {
            result.errors.push({
              index: i + j,
              data: batch[j],
              error: error.message
            });
          }
          result.success = false;
        } else {
          result.insertedCount += count || batch.length;
        }
      } catch (batchError) {
        // 배치 전체 오류 처리
        for (let j = 0; j < batch.length; j++) {
          result.errors.push({
            index: i + j,
            data: batch[j],
            error: `배치 삽입 실패: ${batchError}`
          });
        }
        result.success = false;
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push({
      index: -1,
      data: null,
      error: `벌크 삽입 실패: ${error}`
    });
  }

  return result;
}

/**
 * 프로젝트 삽입 (디자이너 정보 포함)
 */
export async function insertProjects(projects: any[]): Promise<BatchInsertResult> {
  return bulkInsert('projects', projects);
}

/**
 * 컨택 삽입
 */
export async function insertContacts(contacts: any[]): Promise<BatchInsertResult> {
  // 프로젝트 ID 매핑
  const contactsWithProjectIds = await Promise.all(
    contacts.map(async (contact) => {
      if (contact.project_id && typeof contact.project_id === 'string') {
        // 프로젝트명으로 ID 조회
        const projectId = await getProjectIdByTitle(contact.project_id);
        contact.project_id = projectId;
      }
      return contact;
    })
  );

  return bulkInsert('contacts', contactsWithProjectIds);
}

/**
 * 피드 삽입
 */
export async function insertFeeds(feeds: any[]): Promise<BatchInsertResult> {
  return bulkInsert('feed_logs', feeds);
}

/**
 * 팀업무 삽입
 */
export async function insertTeamTasks(teamTasks: any[]): Promise<BatchInsertResult> {
  // 프로젝트 ID 매핑
  const tasksWithProjectIds = await Promise.all(
    teamTasks.map(async (task) => {
      if (task.project_id && typeof task.project_id === 'string') {
        // 프로젝트명으로 ID 조회
        const projectId = await getProjectIdByTitle(task.project_id);
        task.project_id = projectId;
      }
      return task;
    })
  );

  return bulkInsert('team_tasks', tasksWithProjectIds);
}

/**
 * 마일리지 삽입
 */
export async function insertMileage(mileage: any[]): Promise<BatchInsertResult> {
  return bulkInsert('mileage', mileage);
}

/**
 * 회사 고정비 삽입
 */
export async function insertCompanyFunds(funds: any[]): Promise<BatchInsertResult> {
  return bulkInsert('funds_company', funds);
}

/**
 * 개인 보조금 삽입
 */
export async function insertPersonalFunds(funds: any[]): Promise<BatchInsertResult> {
  return bulkInsert('funds_personal', funds);
}

/**
 * 기본 참조 데이터 삽입 (시드 데이터)
 */
export async function insertSeedData(): Promise<void> {
  console.log('시드 데이터 삽입 시작...');

  try {
    // 멤버 데이터 삽입
    const members = [
      { id: 'OY', name: '오유택', code: 'OY', active: true },
      { id: 'LE', name: '이예천', code: 'LE', active: true },
      { id: 'KY', name: '김연지', code: 'KY', active: true },
      { id: 'KH', name: '김하늘', code: 'KH', active: true },
      { id: 'IJ', name: '이정수', code: 'IJ', active: true },
      { id: 'PJ', name: '박지윤', code: 'PJ', active: true }
    ];

    const { error: membersError } = await supabase
      .from('members')
      .upsert(members, { onConflict: 'id' });

    if (membersError) {
      console.warn('멤버 시드 데이터 삽입 실패:', membersError);
    } else {
      console.log('멤버 시드 데이터 삽입 완료');
    }

    // 채널 데이터 삽입
    const channels = [
      {
        id: 'kmong',
        name: '크몽',
        ad_rate: 0.10,
        program_rate: 0.03,
        market_fee_rate: 0.21,
        fee_base: 'B'
      },
      {
        id: 'direct',
        name: '계좌입금',
        ad_rate: 0.10,
        program_rate: 0.03,
        market_fee_rate: 0.0,
        fee_base: 'B'
      }
    ];

    const { error: channelsError } = await supabase
      .from('channels')
      .upsert(channels, { onConflict: 'id' });

    if (channelsError) {
      console.warn('채널 시드 데이터 삽입 실패:', channelsError);
    } else {
      console.log('채널 시드 데이터 삽입 완료');
    }

    // 카테고리 데이터 삽입
    const categories = [
      { id: 'card_news', code: 'CN', name: '카드뉴스' },
      { id: 'poster', code: 'PT', name: '포스터' },
      { id: 'banner', code: 'BN', name: '현수막/배너' },
      { id: 'menu', code: 'MN', name: '메뉴판' },
      { id: 'blog_skin', code: 'BS', name: '블로그스킨' },
      { id: 'web_design', code: 'WD', name: '웹디자인' },
      { id: 'logo', code: 'LG', name: '로고' },
      { id: 'branding', code: 'BR', name: '브랜딩' },
      { id: 'package', code: 'PK', name: '패키지디자인' },
      { id: 'ui_ux', code: 'UX', name: 'UI/UX' },
      { id: 'app_design', code: 'AD', name: '앱디자인' },
      { id: 'editorial', code: 'ED', name: '편집디자인' },
      { id: 'print', code: 'PR', name: '인쇄물' },
      { id: 'others', code: 'OT', name: '기타' }
    ];

    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'id' });

    if (categoriesError) {
      console.warn('카테고리 시드 데이터 삽입 실패:', categoriesError);
    } else {
      console.log('카테고리 시드 데이터 삽입 완료');
    }

    console.log('시드 데이터 삽입 완료');
  } catch (error) {
    console.error('시드 데이터 삽입 중 오류:', error);
    throw error;
  }
}

/**
 * 데이터베이스 정리 (테스트용)
 */
export async function clearAllData(): Promise<void> {
  console.log('⚠️  모든 데이터 삭제 시작...');

  const tables = [
    'settlement_items',
    'settlements',
    'mileage',
    'team_tasks',
    'feed_logs',
    'contacts',
    'projects',
    'funds_personal',
    'funds_company'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제

      if (error) {
        console.warn(`${table} 테이블 삭제 실패:`, error);
      } else {
        console.log(`${table} 테이블 삭제 완료`);
      }
    } catch (error) {
      console.warn(`${table} 테이블 삭제 중 오류:`, error);
    }
  }

  console.log('데이터 삭제 완료');
}

/**
 * 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('count')
      .limit(1);

    if (error) {
      console.error('데이터베이스 연결 실패:', error);
      return false;
    }

    console.log('데이터베이스 연결 성공');
    return true;
  } catch (error) {
    console.error('데이터베이스 연결 테스트 실패:', error);
    return false;
  }
}