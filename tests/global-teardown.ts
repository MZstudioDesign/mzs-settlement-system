/**
 * MZS 정산 시스템 E2E 테스트 전역 정리
 * 모든 테스트 완료 후 실행되는 정리 작업
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 테스트 완료 - 정리 작업 시작');

  // 테스트 결과 요약 출력
  const projects = config.projects;
  console.log(`📋 테스트된 프로젝트: ${projects.length}개`);

  projects.forEach(project => {
    console.log(`  - ${project.name}`);
  });

  console.log('✅ E2E 테스트 정리 완료');
}

export default globalTeardown;