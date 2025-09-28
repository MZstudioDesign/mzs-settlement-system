/**
 * MZS 정산 시스템 E2E 테스트 전역 정리
 * 모든 테스트 완료 후 실행되는 정리 작업
 */

import { FullConfig } from '@playwright/test';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 테스트 완료 - 정리 작업 시작');

  try {
    // 다운로드 폴더 정리
    const downloadsDir = join(__dirname, 'downloads');

    if (existsSync(downloadsDir)) {
      console.log('📁 다운로드 폴더 정리');
      rmSync(downloadsDir, { recursive: true, force: true });
    }

    // 다운로드 폴더 재생성 (다음 테스트를 위해)
    mkdirSync(downloadsDir, { recursive: true });

    // 테스트 결과 요약 출력
    const projects = config.projects;
    console.log(`📋 테스트된 프로젝트: ${projects.length}개`);

    projects.forEach(project => {
      console.log(`  - ${project.name}`);
    });

    // 테스트 리포트 요약
    const testResultsDir = join(__dirname, '..', 'test-results');
    if (existsSync(testResultsDir)) {
      console.log('📊 테스트 결과 확인');

      // 결과 파일들 확인
      const htmlReport = join(testResultsDir, 'index.html');
      const jsonReport = join(testResultsDir, 'results.json');
      const junitReport = join(testResultsDir, 'results.xml');

      if (existsSync(htmlReport)) {
        console.log(`✅ HTML 리포트: ${htmlReport}`);
      }
      if (existsSync(jsonReport)) {
        console.log(`✅ JSON 리포트: ${jsonReport}`);
      }
      if (existsSync(junitReport)) {
        console.log(`✅ JUnit 리포트: ${junitReport}`);
      }
    }

    console.log('✅ 정리 작업 완료');

  } catch (error) {
    console.error('❌ 정리 중 오류 발생:', error);
  }

  console.log('🎯 MZS 정산 시스템 E2E 테스트 완료');
}

export default globalTeardown;