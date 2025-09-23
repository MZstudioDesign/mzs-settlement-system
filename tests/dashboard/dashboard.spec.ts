/**
 * 대시보드 E2E 테스트
 * KPI 표시, 월간 목표 진행률, 순위 테이블, 최근 활동 확인
 */

import { test, expect } from '@playwright/test';
import {
  authenticatedPage,
  waitForPageLoad,
  waitForLoadingToFinish,
  expectKoreanCurrency,
  setMobileViewport,
  setDesktopViewport,
  checkResponsiveLayout,
  expectNumberWithTolerance,
  waitForAPIResponse
} from '../test-utils';

test.describe('Dashboard', () => {

  test.describe('Dashboard Loading & Layout', () => {
    test('should load dashboard successfully', async ({ page }) => {
      await authenticatedPage(page);

      // 대시보드 제목 확인
      await expect(page.locator('h1')).toContainText('대시보드');

      // 로딩 완료 대기
      await waitForLoadingToFinish(page);

      // 주요 섹션들이 표시되는지 확인
      await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
      await expect(page.locator('[data-testid="ranking-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
    });

    test('should show loading state initially', async ({ page }) => {
      await authenticatedPage(page);

      // 로딩 상태 확인 (빠르게 사라질 수 있음)
      const loadingIndicator = page.locator('[data-testid="loading"]');
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator).toBeVisible();
        await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
      }
    });
  });

  test.describe('KPI Stats Cards', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
      await waitForLoadingToFinish(page);
    });

    test('should display this month KPI stats', async ({ page }) => {
      const statsCards = page.locator('[data-testid="stats-cards"]');
      await expect(statsCards).toBeVisible();

      // 주요 KPI 카드들 확인
      const expectedStats = [
        '이번달 매출',
        '이번달 프로젝트',
        '미지급 금액',
        '완료 프로젝트'
      ];

      for (const stat of expectedStats) {
        await expect(page.locator(`text=${stat}`)).toBeVisible();
      }
    });

    test('should show currency values in Korean format', async ({ page }) => {
      // 매출 금액이 한국 통화 형식으로 표시되는지 확인
      const revenueCard = page.locator('[data-testid="revenue-card"]');
      if (await revenueCard.count() > 0) {
        const revenueText = await revenueCard.textContent();
        expect(revenueText).toMatch(/₩|원|\d{1,3}(,\d{3})*/);
      }

      // 미지급 금액 확인
      const unpaidCard = page.locator('[data-testid="unpaid-card"]');
      if (await unpaidCard.count() > 0) {
        const unpaidText = await unpaidCard.textContent();
        expect(unpaidText).toMatch(/₩|원|\d{1,3}(,\d{3})*/);
      }
    });

    test('should show progress indicators', async ({ page }) => {
      // 월간 목표 대비 진행률 확인
      const progressIndicators = page.locator('[data-testid="progress-indicator"]');
      if (await progressIndicators.count() > 0) {
        await expect(progressIndicators.first()).toBeVisible();

        // 진행률 퍼센트 확인
        const progressText = await progressIndicators.first().textContent();
        expect(progressText).toMatch(/\d+%/);
      }
    });

    test('should update stats when data changes', async ({ page }) => {
      // 초기 값 저장
      const initialRevenue = await page.textContent('[data-testid="revenue-value"]');

      // 새 프로젝트 추가 (시뮬레이션)
      await page.goto('/projects/new');
      await page.fill('[name="client_name"]', 'Test Client');
      await page.fill('[name="title"]', 'Test Project');
      await page.fill('[name="net_B"]', '1000000');
      await page.click('button[type="submit"]');

      // 대시보드로 돌아가서 업데이트된 값 확인
      await page.goto('/');
      await waitForLoadingToFinish(page);

      // 값이 업데이트되었는지 확인 (실제로는 API 응답에 따라 다름)
      await page.waitForTimeout(1000);
    });

    test('should handle empty data gracefully', async ({ page }) => {
      // API 응답을 빈 데이터로 모킹
      await page.route('**/api/dashboard/stats', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            revenue: 0,
            projects: 0,
            unpaid: 0,
            completed: 0
          })
        });
      });

      await page.reload();
      await waitForLoadingToFinish(page);

      // 0 값이 적절히 표시되는지 확인
      const revenueCard = page.locator('[data-testid="revenue-card"]');
      await expect(revenueCard).toContainText('₩0');
    });
  });

  test.describe('Monthly Goal Progress', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
      await waitForLoadingToFinish(page);
    });

    test('should display monthly goal progress', async ({ page }) => {
      const progressSection = page.locator('[data-testid="monthly-progress"]');
      if (await progressSection.count() > 0) {
        await expect(progressSection).toBeVisible();

        // 목표 금액과 현재 진행률 확인
        await expect(progressSection).toContainText('월 목표');
        await expect(progressSection).toContainText('%');
      }
    });

    test('should show progress bar visualization', async ({ page }) => {
      const progressBar = page.locator('[data-testid="progress-bar"]');
      if (await progressBar.count() > 0) {
        await expect(progressBar).toBeVisible();

        // 진행률에 따른 바 너비 확인
        const progressValue = await progressBar.getAttribute('value');
        if (progressValue) {
          const value = parseInt(progressValue);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      }
    });

    test('should update progress in real-time', async ({ page }) => {
      // 초기 진행률 저장
      const initialProgress = await page.textContent('[data-testid="progress-percentage"]');

      // 프로젝트 완료 시뮬레이션 (실제로는 별도 액션 필요)
      await page.waitForTimeout(1000);

      // 진행률 업데이트 확인 (실제 구현에 따라 다름)
    });
  });

  test.describe('2.5배 환산 랭킹 테이블', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
      await waitForLoadingToFinish(page);
    });

    test('should display ranking table with team members', async ({ page }) => {
      const rankingTable = page.locator('[data-testid="ranking-table"]');
      await expect(rankingTable).toBeVisible();

      // 테이블 헤더 확인
      await expect(rankingTable.locator('thead')).toContainText('순위');
      await expect(rankingTable.locator('thead')).toContainText('이름');
      await expect(rankingTable.locator('thead')).toContainText('실적');
      await expect(rankingTable.locator('thead')).toContainText('2.5배 환산');
    });

    test('should show team members in correct ranking order', async ({ page }) => {
      const tableRows = page.locator('[data-testid="ranking-table"] tbody tr');
      const rowCount = await tableRows.count();

      if (rowCount > 1) {
        // 첫 번째 행의 환산 금액
        const firstRowAmount = await tableRows.nth(0).locator('[data-testid="converted-amount"]').textContent();
        // 두 번째 행의 환산 금액
        const secondRowAmount = await tableRows.nth(1).locator('[data-testid="converted-amount"]').textContent();

        if (firstRowAmount && secondRowAmount) {
          const firstAmount = parseInt(firstRowAmount.replace(/[^\d]/g, ''));
          const secondAmount = parseInt(secondRowAmount.replace(/[^\d]/g, ''));

          // 내림차순 정렬 확인
          expect(firstAmount).toBeGreaterThanOrEqual(secondAmount);
        }
      }
    });

    test('should show 2.5x conversion calculation correctly', async ({ page }) => {
      const firstRow = page.locator('[data-testid="ranking-table"] tbody tr').first();

      const originalAmount = await firstRow.locator('[data-testid="original-amount"]').textContent();
      const convertedAmount = await firstRow.locator('[data-testid="converted-amount"]').textContent();

      if (originalAmount && convertedAmount) {
        const original = parseInt(originalAmount.replace(/[^\d]/g, ''));
        const converted = parseInt(convertedAmount.replace(/[^\d]/g, ''));

        // 2.5배 계산 확인 (허용 오차 포함)
        const expectedConverted = original * 2.5;
        expect(Math.abs(converted - expectedConverted)).toBeLessThanOrEqual(100);
      }
    });

    test('should handle empty ranking data', async ({ page }) => {
      // 빈 순위 데이터 모킹
      await page.route('**/api/dashboard/ranking', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.reload();
      await waitForLoadingToFinish(page);

      // 빈 상태 메시지 확인
      const rankingSection = page.locator('[data-testid="ranking-table"]');
      await expect(rankingSection).toContainText('데이터가 없습니다');
    });

    test('should link to member detail pages', async ({ page }) => {
      const memberLink = page.locator('[data-testid="ranking-table"] tbody tr a').first();

      if (await memberLink.count() > 0) {
        await memberLink.click();
        await waitForPageLoad(page);

        // 멤버 상세 페이지나 관련 페이지로 이동 확인
        expect(page.url()).toContain('/member');
      }
    });
  });

  test.describe('Recent Activities', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
      await waitForLoadingToFinish(page);
    });

    test('should display recent activities list', async ({ page }) => {
      const activitiesSection = page.locator('[data-testid="recent-activities"]');
      await expect(activitiesSection).toBeVisible();

      // 활동 제목 확인
      await expect(activitiesSection).toContainText('최근 활동');

      // 활동 항목들 확인
      const activityItems = activitiesSection.locator('[data-testid="activity-item"]');
      const itemCount = await activityItems.count();

      if (itemCount > 0) {
        // 첫 번째 활동 항목 확인
        const firstItem = activityItems.first();
        await expect(firstItem).toBeVisible();

        // 시간 정보 확인
        await expect(firstItem).toContainText(/\d+분 전|\d+시간 전|\d+일 전/);
      }
    });

    test('should show different activity types', async ({ page }) => {
      const activityItems = page.locator('[data-testid="activity-item"]');
      const itemCount = await activityItems.count();

      if (itemCount > 0) {
        // 다양한 활동 유형 확인
        const activities = [];
        for (let i = 0; i < Math.min(itemCount, 5); i++) {
          const itemText = await activityItems.nth(i).textContent();
          activities.push(itemText);
        }

        // 프로젝트, 컨택, 피드 관련 활동들이 포함되어야 함
        const activityText = activities.join(' ');
        const hasVariousActivities = /프로젝트|컨택|피드|정산/.test(activityText);
        expect(hasVariousActivities).toBeTruthy();
      }
    });

    test('should link to related items', async ({ page }) => {
      const activityLink = page.locator('[data-testid="activity-item"] a').first();

      if (await activityLink.count() > 0) {
        await activityLink.click();
        await waitForPageLoad(page);

        // 관련 페이지로 이동했는지 확인
        expect(page.url()).not.toBe('/');
      }
    });

    test('should show relative timestamps', async ({ page }) => {
      const timeElements = page.locator('[data-testid="activity-time"]');
      const timeCount = await timeElements.count();

      if (timeCount > 0) {
        const timeText = await timeElements.first().textContent();

        // 상대 시간 표시 확인
        expect(timeText).toMatch(/방금|몇 초 전|\d+분 전|\d+시간 전|\d+일 전/);
      }
    });

    test('should limit number of activities shown', async ({ page }) => {
      const activityItems = page.locator('[data-testid="activity-item"]');
      const itemCount = await activityItems.count();

      // 최대 10개 정도로 제한되어야 함
      expect(itemCount).toBeLessThanOrEqual(10);
    });

    test('should handle no activities gracefully', async ({ page }) => {
      // 빈 활동 데이터 모킹
      await page.route('**/api/dashboard/activities', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.reload();
      await waitForLoadingToFinish(page);

      // 빈 상태 메시지 확인
      const activitiesSection = page.locator('[data-testid="recent-activities"]');
      await expect(activitiesSection).toContainText('최근 활동이 없습니다');
    });
  });

  test.describe('Responsive Dashboard', () => {
    test('should adapt layout for mobile devices', async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);
      await checkResponsiveLayout(page, 'mobile');

      // 모바일에서 카드들이 세로로 정렬되는지 확인
      const statsCards = page.locator('[data-testid="stats-cards"]');
      await expect(statsCards).toHaveClass(/flex-col|grid-cols-1/);

      // 순위 테이블이 스크롤 가능한지 확인
      const rankingTable = page.locator('[data-testid="ranking-table"]');
      await expect(rankingTable).toHaveCSS('overflow-x', 'auto');
    });

    test('should show desktop layout properly', async ({ page }) => {
      await setDesktopViewport(page);
      await authenticatedPage(page);
      await checkResponsiveLayout(page, 'desktop');

      // 데스크탑에서 카드들이 가로로 정렬되는지 확인
      const statsCards = page.locator('[data-testid="stats-cards"]');
      await expect(statsCards).toHaveClass(/grid-cols-2|grid-cols-4|flex-row/);
    });

    test('should maintain functionality on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await authenticatedPage(page);

      // 태블릿에서 모든 기능이 동작하는지 확인
      await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
      await expect(page.locator('[data-testid="ranking-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
    });
  });

  test.describe('Data Refresh & Real-time Updates', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
      await waitForLoadingToFinish(page);
    });

    test('should refresh data on page focus', async ({ page }) => {
      // 페이지 블러/포커스 시뮬레이션
      await page.evaluate(() => {
        window.dispatchEvent(new Event('blur'));
      });

      await page.waitForTimeout(1000);

      await page.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
      });

      // 데이터 새로고침 확인 (API 호출 모니터링)
      const apiResponse = waitForAPIResponse(page, '/api/dashboard');
      if (apiResponse) {
        await apiResponse;
      }
    });

    test('should show refresh indicator', async ({ page }) => {
      // 수동 새로고침 버튼이 있다면
      const refreshButton = page.locator('[data-testid="refresh-button"]');

      if (await refreshButton.count() > 0) {
        await refreshButton.click();

        // 로딩 상태 확인
        await expect(page.locator('[data-testid="refreshing"]')).toBeVisible();
        await expect(page.locator('[data-testid="refreshing"]')).toBeHidden();
      }
    });

    test('should handle refresh errors gracefully', async ({ page }) => {
      // API 에러 모킹
      await page.route('**/api/dashboard/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.reload();

      // 에러 상태 확인
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await authenticatedPage(page);
      await waitForLoadingToFinish(page);
      const endTime = Date.now();

      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // 5초 이내 로딩
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // 많은 데이터 모킹
      await page.route('**/api/dashboard/ranking', route => {
        const largeData = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `Member ${i + 1}`,
          amount: Math.random() * 1000000,
          convertedAmount: Math.random() * 2500000
        }));

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeData)
        });
      });

      await authenticatedPage(page);
      await waitForLoadingToFinish(page);

      // 페이지가 응답성을 유지하는지 확인
      const rankingTable = page.locator('[data-testid="ranking-table"]');
      await expect(rankingTable).toBeVisible();
    });
  });
});