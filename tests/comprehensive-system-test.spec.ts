import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * MZS 정산 시스템 종합 테스트
 * - 페이지 로딩 성능 측정
 * - 내비게이션 기능 테스트
 * - 핵심 기능 동작 확인
 * - 오류 탐지 및 분석
 * - 반응형 디자인 검증
 */

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  errorCount: number;
  networkErrors: string[];
  consoleErrors: string[];
}

interface TestResults {
  page: string;
  performance: PerformanceMetrics;
  functionality: {
    navigation: boolean;
    interactions: boolean;
    errors: string[];
  };
  responsiveness: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
}

let testResults: TestResults[] = [];
let globalErrors: string[] = [];

test.describe('MZS 정산 시스템 종합 테스트', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
  });

  test.beforeEach(async ({ page }) => {
    // 콘솔 에러 수집
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        globalErrors.push(`Console Error: ${msg.text()}`);
      }
    });

    // 네트워크 에러 수집
    page.on('response', (response) => {
      if (response.status() >= 400) {
        globalErrors.push(`Network Error: ${response.status()} - ${response.url()}`);
      }
    });

    // JavaScript 런타임 에러 수집
    page.on('pageerror', (error) => {
      globalErrors.push(`JavaScript Error: ${error.message}`);
    });
  });

  test('홈페이지 로딩 성능 및 기본 기능 테스트', async ({ page }) => {
    console.log('🚀 시작: 홈페이지 로딩 성능 테스트');

    const startTime = Date.now();

    try {
      // 페이지 로딩 시간 측정
      await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
      const loadTime = Date.now() - startTime;

      console.log(`⏱️ 홈페이지 로딩 시간: ${loadTime}ms`);

      // Core Web Vitals 측정
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {
            fcp: 0,
            lcp: 0,
            cls: 0,
            fid: 0
          };

          // Performance Observer로 메트릭 수집
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            }
          }).observe({ entryTypes: ['paint'] });

          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              vitals.lcp = entry.startTime;
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              vitals.cls += (entry as any).value;
            }
          }).observe({ entryTypes: ['layout-shift'] });

          // 2초 후 결과 반환
          setTimeout(() => resolve(vitals), 2000);
        });
      });

      console.log('📊 Core Web Vitals:', webVitals);

      // 기본 요소들이 로드되는지 확인
      await expect(page).toHaveTitle(/MZS/i);

      // 메인 내비게이션이 존재하는지 확인
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible({ timeout: 10000 });

      console.log('✅ 기본 페이지 구조 확인 완료');

    } catch (error) {
      console.log('❌ 홈페이지 로딩 실패:', error);
      globalErrors.push(`Homepage loading failed: ${error}`);
    }
  });

  test('모든 내비게이션 탭 테스트', async ({ page }) => {
    console.log('🧭 시작: 내비게이션 탭 테스트');

    await page.goto('/', { waitUntil: 'networkidle' });

    const navigationTabs = [
      { name: 'Dashboard', selector: 'a[href="/"], button:has-text("Dashboard"), [data-testid="nav-dashboard"]' },
      { name: 'Projects', selector: 'a[href="/projects"], button:has-text("Projects"), [data-testid="nav-projects"]' },
      { name: 'Contacts', selector: 'a[href="/contacts"], button:has-text("Contacts"), [data-testid="nav-contacts"]' },
      { name: 'Feed', selector: 'a[href="/feed"], button:has-text("Feed"), [data-testid="nav-feed"]' },
      { name: 'Team', selector: 'a[href="/team"], button:has-text("Team"), [data-testid="nav-team"]' },
      { name: 'Funds', selector: 'a[href="/funds"], button:has-text("Funds"), [data-testid="nav-funds"]' },
      { name: 'Settlements', selector: 'a[href="/settlements"], button:has-text("Settlements"), [data-testid="nav-settlements"]' },
      { name: 'Settings', selector: 'a[href="/settings"], button:has-text("Settings"), [data-testid="nav-settings"]' }
    ];

    for (const tab of navigationTabs) {
      try {
        console.log(`🔄 테스트 중: ${tab.name} 탭`);

        const startTime = Date.now();

        // 여러 선택자를 시도
        const selectors = tab.selector.split(', ');
        let element = null;

        for (const selector of selectors) {
          try {
            element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
              break;
            }
          } catch (e) {
            // 다음 선택자 시도
          }
        }

        if (!element || !(await element.isVisible({ timeout: 5000 }))) {
          console.log(`⚠️ ${tab.name} 탭을 찾을 수 없음`);
          globalErrors.push(`Navigation tab not found: ${tab.name}`);
          continue;
        }

        await element.click({ timeout: 10000 });

        // 페이지 전환 대기
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        const loadTime = Date.now() - startTime;

        console.log(`⏱️ ${tab.name} 로딩 시간: ${loadTime}ms`);

        // URL 변경 확인 (Dashboard 제외)
        if (tab.name !== 'Dashboard') {
          const currentUrl = page.url();
          const expectedPath = tab.name.toLowerCase();
          if (!currentUrl.includes(expectedPath)) {
            console.log(`⚠️ ${tab.name}: URL 변경 실패 (현재: ${currentUrl})`);
            globalErrors.push(`Navigation failed for ${tab.name}: wrong URL`);
          }
        }

        // 페이지 컨텐츠 로딩 확인
        await expect(page.locator('body')).toBeVisible();

        console.log(`✅ ${tab.name} 탭 테스트 완료`);

      } catch (error) {
        console.log(`❌ ${tab.name} 탭 테스트 실패:`, error);
        globalErrors.push(`Navigation test failed for ${tab.name}: ${error}`);
      }
    }
  });

  test('핵심 UI 요소 인터랙션 테스트', async ({ page }) => {
    console.log('🎯 시작: 핵심 UI 요소 테스트');

    await page.goto('/', { waitUntil: 'networkidle' });

    // 버튼 클릭 테스트
    const commonButtons = [
      'button:has-text("새")',
      'button:has-text("추가")',
      'button:has-text("생성")',
      '[role="button"]',
      '.btn',
      'button:not([disabled])'
    ];

    for (const buttonSelector of commonButtons) {
      try {
        const buttons = await page.locator(buttonSelector).all();
        for (let i = 0; i < Math.min(buttons.length, 3); i++) {
          const button = buttons[i];
          if (await button.isVisible({ timeout: 1000 })) {
            console.log(`🔘 버튼 클릭 테스트: ${buttonSelector}`);
            await button.click({ timeout: 5000 });
            await page.waitForTimeout(500); // 반응 대기
          }
        }
      } catch (error) {
        console.log(`⚠️ 버튼 테스트 실패 (${buttonSelector}):`, error);
      }
    }

    // 폼 입력 테스트
    try {
      const inputs = await page.locator('input, select, textarea').all();
      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        const input = inputs[i];
        if (await input.isVisible({ timeout: 1000 })) {
          const tagName = await input.evaluate(el => el.tagName.toLowerCase());
          console.log(`📝 입력 요소 테스트: ${tagName}`);

          if (tagName === 'input') {
            await input.fill('테스트 입력');
          } else if (tagName === 'textarea') {
            await input.fill('테스트 텍스트 영역');
          }
          await page.waitForTimeout(200);
        }
      }
    } catch (error) {
      console.log('⚠️ 폼 입력 테스트 실패:', error);
    }
  });

  test('FAB 빠른 입력 기능 테스트', async ({ page }) => {
    console.log('⚡ 시작: FAB 빠른 입력 기능 테스트');

    await page.goto('/', { waitUntil: 'networkidle' });

    try {
      // FAB 버튼 찾기
      const fabSelectors = [
        '[data-testid="fab"]',
        '.fab',
        'button[class*="fab"]',
        'button[class*="floating"]',
        'button:has-text("+")',
        '.fixed.bottom'
      ];

      let fabButton = null;
      for (const selector of fabSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            fabButton = element;
            break;
          }
        } catch (e) {
          // 다음 선택자 시도
        }
      }

      if (fabButton) {
        console.log('🎯 FAB 버튼 발견');
        await fabButton.click();
        await page.waitForTimeout(1000);

        // FAB 메뉴 옵션들 테스트
        const fabOptions = [
          'button:has-text("컨택")',
          'button:has-text("상담")',
          'button:has-text("가이드")',
          'button:has-text("피드")',
          'button:has-text("1000")',
          'button:has-text("2000")',
          'button:has-text("400")'
        ];

        for (const option of fabOptions) {
          try {
            const optionElement = page.locator(option).first();
            if (await optionElement.isVisible({ timeout: 1000 })) {
              console.log(`✨ FAB 옵션 테스트: ${option}`);
              await optionElement.click();
              await page.waitForTimeout(500);
              break; // 한 옵션만 테스트
            }
          } catch (error) {
            console.log(`⚠️ FAB 옵션 실패: ${option}`);
          }
        }

        console.log('✅ FAB 테스트 완료');
      } else {
        console.log('⚠️ FAB 버튼을 찾을 수 없음');
        globalErrors.push('FAB button not found');
      }

    } catch (error) {
      console.log('❌ FAB 테스트 실패:', error);
      globalErrors.push(`FAB test failed: ${error}`);
    }
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    console.log('📱 시작: 반응형 디자인 테스트');

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      try {
        console.log(`🔄 ${viewport.name} 뷰포트 테스트 (${viewport.width}x${viewport.height})`);

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/', { waitUntil: 'networkidle' });

        // 레이아웃이 올바르게 표시되는지 확인
        await expect(page.locator('body')).toBeVisible();

        // 모바일에서 햄버거 메뉴 테스트
        if (viewport.name === 'Mobile') {
          const hamburgerSelectors = [
            '[data-testid="mobile-menu-button"]',
            'button[aria-label*="menu"]',
            'button:has-text("☰")',
            '.hamburger',
            'button[class*="mobile"]'
          ];

          for (const selector of hamburgerSelectors) {
            try {
              const hamburger = page.locator(selector).first();
              if (await hamburger.isVisible({ timeout: 2000 })) {
                console.log('🍔 햄버거 메뉴 발견 및 테스트');
                await hamburger.click();
                await page.waitForTimeout(500);
                break;
              }
            } catch (e) {
              // 다음 선택자 시도
            }
          }
        }

        console.log(`✅ ${viewport.name} 뷰포트 테스트 완료`);

      } catch (error) {
        console.log(`❌ ${viewport.name} 뷰포트 테스트 실패:`, error);
        globalErrors.push(`Responsive test failed for ${viewport.name}: ${error}`);
      }
    }
  });

  test('성능 및 리소스 로딩 분석', async ({ page }) => {
    console.log('📊 시작: 성능 및 리소스 로딩 분석');

    // Performance API 활용
    await page.goto('/', { waitUntil: 'networkidle' });

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.navigationStart,
        resourceCount: resources.length,
        slowResources: resources.filter(r => r.duration > 1000).map(r => ({
          name: r.name,
          duration: r.duration,
          type: (r as PerformanceResourceTiming).initiatorType
        }))
      };
    });

    console.log('⚡ 성능 메트릭:', performanceMetrics);

    // 느린 리소스가 있다면 경고
    if (performanceMetrics.slowResources.length > 0) {
      console.log('⚠️ 느린 리소스 발견:');
      performanceMetrics.slowResources.forEach(resource => {
        console.log(`   - ${resource.name}: ${resource.duration.toFixed(2)}ms`);
        globalErrors.push(`Slow resource: ${resource.name} (${resource.duration.toFixed(2)}ms)`);
      });
    }

    // 전체 로딩 시간이 너무 길면 경고
    if (performanceMetrics.totalLoadTime > 5000) {
      globalErrors.push(`Slow page load: ${performanceMetrics.totalLoadTime.toFixed(2)}ms`);
    }
  });

  test.afterAll(async () => {
    console.log('\n🎭 === MZS 정산 시스템 종합 테스트 결과 ===\n');

    if (globalErrors.length > 0) {
      console.log('❌ 발견된 문제점들:');
      globalErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 주요 문제점이 발견되지 않았습니다.');
    }

    console.log(`\n📊 총 ${globalErrors.length}개의 문제점이 발견되었습니다.`);
    console.log('\n=== 테스트 완료 ===\n');

    await context.close();
  });
});

// 유틸리티 함수들
async function captureScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}

async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  return Date.now() - startTime;
}

async function checkForConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}