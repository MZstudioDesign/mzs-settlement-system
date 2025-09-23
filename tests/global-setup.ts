/**
 * MZS 정산 시스템 E2E 테스트 전역 설정
 * 모든 테스트 실행 전에 실행되는 설정
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 MZS 정산 시스템 E2E 테스트 시작');

  // 개발 서버가 시작될 때까지 기다림
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3002';

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log(`📊 개발 서버 상태 확인: ${baseURL}`);

    // 홈페이지 로드 확인
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // 기본 DOM 요소 확인
    await page.waitForSelector('h1:has-text("안녕하세요!")');

    console.log('✅ 개발 서버 정상 동작 확인');

    await browser.close();
  } catch (error) {
    console.error('❌ 개발 서버 연결 실패:', error);
    throw error;
  }
}

export default globalSetup;