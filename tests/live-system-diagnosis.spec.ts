import { test, expect, Page } from '@playwright/test';

interface TestResult {
  testName: string;
  success: boolean;
  loadTime?: number;
  errors: any[];
  warnings: any[];
  details?: any;
}

const results: TestResult[] = [];

// 에러 수집 헬퍼
async function setupErrorCollection(page: Page) {
  const errors: any[] = [];
  const warnings: any[] = [];

  page.on('pageerror', (error) => {
    errors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`🚨 Page Error: ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    errors.push({
      type: 'requestfailed',
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText,
      timestamp: new Date().toISOString()
    });
    console.log(`🔴 Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('console', (message) => {
    const msg = {
      type: message.type(),
      text: message.text(),
      timestamp: new Date().toISOString()
    };

    if (message.type() === 'error') {
      errors.push({ ...msg, type: 'console_error' });
      console.log(`❌ Console Error: ${message.text()}`);
    } else if (message.type() === 'warning') {
      warnings.push({ ...msg, type: 'console_warning' });
      console.log(`⚠️ Console Warning: ${message.text()}`);
    } else if (message.type() === 'info') {
      console.log(`ℹ️ Console Info: ${message.text()}`);
    }
  });

  return { errors, warnings };
}

test.describe('MZS 정산 시스템 - 실시간 진단 테스트', () => {

  test('1. 기본 페이지 로딩 및 성능 측정', async ({ page }) => {
    console.log('\n🚀 === 기본 페이지 로딩 테스트 시작 ===');

    const { errors, warnings } = await setupErrorCollection(page);
    let testSuccess = false;
    let loadTime = 0;

    try {
      const startTime = Date.now();

      console.log('📍 http://localhost:3001 접속 시도...');

      // 매우 관대한 타임아웃 설정
      await page.goto('http://localhost:3001', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      loadTime = Date.now() - startTime;
      console.log(`⏱️ DOM Load Time: ${loadTime}ms`);

      // 페이지 제목 확인
      const title = await page.title();
      console.log(`📄 Page Title: "${title}"`);

      // 네트워크 idle 상태 대기 (선택적)
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        const totalTime = Date.now() - startTime;
        console.log(`⏱️ Network Idle Time: ${totalTime}ms`);
      } catch (e) {
        console.log('⚠️ Network idle timeout - 계속 진행');
      }

      // 스크린샷 저장
      await page.screenshot({
        path: 'test-results/01-initial-load.png',
        fullPage: true
      });
      console.log('📸 스크린샷 저장: test-results/01-initial-load.png');

      // 기본 요소 확인
      const bodyVisible = await page.locator('body').isVisible();
      console.log(`🔍 Body element visible: ${bodyVisible}`);

      testSuccess = bodyVisible && errors.filter(e => e.type === 'pageerror').length === 0;

    } catch (error) {
      console.error(`❌ 페이지 로딩 실패: ${error}`);
      await page.screenshot({
        path: 'test-results/01-load-error.png',
        fullPage: true
      });
    }

    const result: TestResult = {
      testName: '기본 페이지 로딩',
      success: testSuccess,
      loadTime,
      errors,
      warnings,
      details: { loadTime }
    };
    results.push(result);

    console.log(`✅ 결과: ${testSuccess ? 'PASS' : 'FAIL'}, 로딩시간: ${loadTime}ms, 에러: ${errors.length}개`);
  });

  test('2. 네비게이션 탭 테스트', async ({ page }) => {
    console.log('\n🧭 === 네비게이션 탭 테스트 시작 ===');

    const { errors, warnings } = await setupErrorCollection(page);
    let testSuccess = true;

    try {
      await page.goto('http://localhost:3001', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const tabs = [
        { name: 'Dashboard', paths: ['/', 'dashboard'] },
        { name: 'Projects', paths: ['/projects', 'projects'] },
        { name: 'Contacts', paths: ['/contacts', 'contacts'] },
        { name: 'Feed', paths: ['/feed', 'feed'] },
        { name: 'Team', paths: ['/team', 'team'] },
        { name: 'Funds', paths: ['/funds', 'funds'] },
        { name: 'Settlements', paths: ['/settlements', 'settlements'] },
        { name: 'Settings', paths: ['/settings', 'settings'] }
      ];

      for (const tab of tabs) {
        console.log(`🔍 ${tab.name} 탭 테스트 중...`);

        try {
          // 다양한 선택자로 탭 찾기
          let tabElement = null;

          // 텍스트로 찾기
          const textElements = await page.getByText(tab.name, { exact: false }).all();
          if (textElements.length > 0) {
            tabElement = textElements[0];
          }

          // href로 찾기
          if (!tabElement) {
            for (const path of tab.paths) {
              const linkElements = await page.locator(`a[href="${path}"]`).all();
              if (linkElements.length > 0) {
                tabElement = linkElements[0];
                break;
              }
            }
          }

          if (tabElement) {
            const startTime = Date.now();

            // 요소가 보이는지 확인
            const isVisible = await tabElement.isVisible({ timeout: 2000 });
            if (isVisible) {
              await tabElement.click();
              const clickTime = Date.now() - startTime;

              // 페이지 변경 대기
              await page.waitForTimeout(1000);

              const currentUrl = page.url();
              console.log(`  ✅ ${tab.name}: 클릭시간 ${clickTime}ms, URL: ${currentUrl}`);

              // 스크린샷
              await page.screenshot({
                path: `test-results/nav-${tab.name.toLowerCase()}.png`,
                fullPage: true
              });

            } else {
              console.log(`  ⚠️ ${tab.name}: 요소가 보이지 않음`);
            }
          } else {
            console.log(`  ❌ ${tab.name}: 요소를 찾을 수 없음`);
            testSuccess = false;
          }

        } catch (error) {
          console.log(`  ❌ ${tab.name} 실패: ${error}`);
          testSuccess = false;

          await page.screenshot({
            path: `test-results/nav-${tab.name.toLowerCase()}-error.png`,
            fullPage: true
          });
        }

        // 각 탭 테스트 간 대기
        await page.waitForTimeout(500);
      }

    } catch (error) {
      console.error(`❌ 네비게이션 테스트 실패: ${error}`);
      testSuccess = false;
    }

    results.push({
      testName: '네비게이션 탭 테스트',
      success: testSuccess && errors.filter(e => e.type === 'pageerror').length === 0,
      errors,
      warnings,
      details: { testedTabs: tabs.length }
    });

    console.log(`✅ 네비게이션 테스트 결과: ${testSuccess ? 'PASS' : 'FAIL'}, 에러: ${errors.length}개`);
  });

  test('3. 모바일 반응형 테스트', async ({ page }) => {
    console.log('\n📱 === 모바일 반응형 테스트 시작 ===');

    const { errors, warnings } = await setupErrorCollection(page);
    let testSuccess = true;

    try {
      // 모바일 뷰포트로 설정
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('http://localhost:3001', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      console.log('📱 모바일 뷰포트 (375x812)로 설정');

      // 모바일 스크린샷
      await page.screenshot({
        path: 'test-results/mobile-view.png',
        fullPage: true
      });

      // 햄버거 메뉴 찾기
      const hamburgerSelectors = [
        'button[aria-label*="menu" i]',
        'button[aria-label*="메뉴" i]',
        'button:has-text("☰")',
        '.hamburger',
        '[data-testid="mobile-menu"]',
        'button[class*="menu"]'
      ];

      let hamburgerFound = false;
      for (const selector of hamburgerSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log('🍔 햄버거 메뉴 발견, 클릭 테스트...');
            await element.click();
            await page.waitForTimeout(500);

            await page.screenshot({
              path: 'test-results/mobile-menu-open.png',
              fullPage: true
            });

            hamburgerFound = true;
            break;
          }
        } catch (e) {
          // 계속 진행
        }
      }

      if (!hamburgerFound) {
        console.log('🍔 햄버거 메뉴를 찾을 수 없음');
      }

      // FAB (Floating Action Button) 찾기
      const fabSelectors = [
        '.fab',
        '[data-testid="fab"]',
        'button[class*="float"]',
        'button[style*="position: fixed"]',
        '.fixed.bottom',
        'button[class*="fixed"][class*="bottom"]'
      ];

      let fabFound = false;
      for (const selector of fabSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log('🎯 FAB 버튼 발견, 클릭 테스트...');
            await element.click();
            await page.waitForTimeout(500);

            await page.screenshot({
              path: 'test-results/mobile-fab-clicked.png',
              fullPage: true
            });

            fabFound = true;
            break;
          }
        } catch (e) {
          // 계속 진행
        }
      }

      if (!fabFound) {
        console.log('🎯 FAB 버튼을 찾을 수 없음');
      }

    } catch (error) {
      console.error(`❌ 모바일 테스트 실패: ${error}`);
      testSuccess = false;
    }

    results.push({
      testName: '모바일 반응형 테스트',
      success: testSuccess && errors.length === 0,
      errors,
      warnings
    });

    console.log(`✅ 모바일 테스트 결과: ${testSuccess ? 'PASS' : 'FAIL'}, 에러: ${errors.length}개`);
  });

  test('4. 성능 분석', async ({ page }) => {
    console.log('\n⚡ === 성능 분석 테스트 시작 ===');

    const { errors, warnings } = await setupErrorCollection(page);
    let performanceScore = 0;

    try {
      const startTime = Date.now();

      await page.goto('http://localhost:3001', { timeout: 30000 });
      const loadTime = Date.now() - startTime;

      // 성능 메트릭 수집
      const metrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        const paintEntries = performance.getEntriesByType('paint');

        if (entries.length > 0) {
          const nav = entries[0];
          return {
            domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
            loadComplete: nav.loadEventEnd - nav.loadEventStart,
            firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0
          };
        }
        return null;
      });

      // 리소스 분석
      const resources = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        return {
          total: entries.length,
          scripts: entries.filter(e => e.name.includes('.js')).length,
          stylesheets: entries.filter(e => e.name.includes('.css')).length,
          images: entries.filter(e => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(e.name)).length
        };
      });

      console.log('📊 성능 메트릭:');
      console.log(`  ⏱️ 총 로딩 시간: ${loadTime}ms`);
      if (metrics) {
        console.log(`  🎨 First Paint: ${metrics.firstPaint.toFixed(1)}ms`);
        console.log(`  📄 First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(1)}ms`);
        console.log(`  📜 DOM Content Loaded: ${metrics.domContentLoaded.toFixed(1)}ms`);
      }
      console.log(`  📦 리소스: 총 ${resources.total}개`);
      console.log(`    - JavaScript: ${resources.scripts}개`);
      console.log(`    - CSS: ${resources.stylesheets}개`);
      console.log(`    - Images: ${resources.images}개`);

      // 성능 점수 계산 (0-100)
      performanceScore = 100;
      if (loadTime > 5000) performanceScore -= 40;
      else if (loadTime > 3000) performanceScore -= 25;
      else if (loadTime > 1000) performanceScore -= 10;

      if (metrics?.firstContentfulPaint > 3000) performanceScore -= 20;
      else if (metrics?.firstContentfulPaint > 1800) performanceScore -= 10;

      if (resources.total > 100) performanceScore -= 15;
      else if (resources.total > 50) performanceScore -= 8;

      console.log(`📈 성능 점수: ${Math.max(0, performanceScore)}/100`);

    } catch (error) {
      console.error(`❌ 성능 분석 실패: ${error}`);
    }

    results.push({
      testName: '성능 분석',
      success: performanceScore > 60,
      errors,
      warnings,
      details: { performanceScore }
    });

    console.log(`✅ 성능 분석 결과: ${performanceScore > 60 ? 'PASS' : 'FAIL'}, 점수: ${performanceScore}/100`);
  });

  test('5. 종합 결과 리포트', async ({ page }) => {
    console.log('\n📋 === 종합 테스트 결과 리포트 ===');

    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = total > 0 ? (passed / total * 100).toFixed(1) : '0';

    console.log('='.repeat(60));
    console.log('🎯 MZS 정산 시스템 - 종합 테스트 결과');
    console.log('='.repeat(60));
    console.log(`📊 총 테스트: ${total}개`);
    console.log(`✅ 통과: ${passed}개`);
    console.log(`❌ 실패: ${failed}개`);
    console.log(`📈 성공률: ${successRate}%`);
    console.log('='.repeat(60));

    // 개별 테스트 결과
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.testName}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
      if (result.loadTime) {
        console.log(`   로딩 시간: ${result.loadTime}ms`);
      }
      if (result.errors.length > 0) {
        console.log(`   에러: ${result.errors.length}개`);
        result.errors.slice(0, 2).forEach(error => {
          console.log(`     - ${error.message || error.text || 'Unknown error'}`);
        });
      }
    });

    // 우선순위별 문제점
    console.log('\n🚨 발견된 주요 문제점:');

    const allErrors = results.flatMap(r => r.errors);
    const criticalErrors = allErrors.filter(e =>
      e.type === 'pageerror' ||
      e.message?.includes('TypeError') ||
      e.message?.includes('ReferenceError')
    );

    if (criticalErrors.length > 0) {
      console.log('\n🔥 CRITICAL - JavaScript/Page Errors:');
      criticalErrors.slice(0, 3).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
      });
    }

    const performanceIssues = results.filter(r =>
      r.loadTime && r.loadTime > 3000
    );

    if (performanceIssues.length > 0) {
      console.log('\n⚠️ HIGH - Performance Issues:');
      performanceIssues.forEach(issue => {
        console.log(`  - ${issue.testName}: ${issue.loadTime}ms (너무 느림)`);
      });
    }

    const networkErrors = allErrors.filter(e => e.type === 'requestfailed');
    if (networkErrors.length > 0) {
      console.log('\n⚠️ MEDIUM - Network Errors:');
      networkErrors.slice(0, 3).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.url}: ${error.failure}`);
      });
    }

    // 추천사항
    console.log('\n💡 추천사항:');
    if (criticalErrors.length > 0) {
      console.log('  1. JavaScript 오류 수정 필요 - 버튼/탭 실패 원인');
      console.log('  2. 에러 핸들링 및 로딩 상태 구현 필요');
    }
    if (performanceIssues.length > 0) {
      console.log('  3. 초기 페이지 로딩 최적화 필요');
      console.log('  4. 코드 스플리팅 및 지연 로딩 구현');
    }
    if (networkErrors.length > 0) {
      console.log('  5. API 엔드포인트 및 네트워크 요청 확인');
    }
    console.log('  6. 사용자 피드백을 위한 로딩 인디케이터 추가');
    console.log('  7. 에러 바운더리 구현으로 앱 크래시 방지');

    console.log('\n='.repeat(60));
  });
});