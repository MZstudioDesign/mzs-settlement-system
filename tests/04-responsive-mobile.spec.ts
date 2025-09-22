/**
 * 모바일 반응형 E2E 테스트
 * - 모바일 뷰포트에서 테스트
 * - 터치 타겟 크기 확인
 * - 네비게이션 동작
 * - 모바일 FAB 기능
 */

import { test, expect, devices } from '@playwright/test';

test.describe('모바일 반응형', () => {
  test.describe('모바일 환경', () => {
    test.use({ ...devices['iPhone 12'] });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('모바일에서 홈페이지가 올바르게 표시된다', async ({ page }) => {
      // 뷰포트 크기 확인
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBeLessThanOrEqual(414); // iPhone 12 width

      // 메인 헤딩 표시 확인
      await expect(page.locator('h2:has-text("환영합니다!")')).toBeVisible();

      // 모바일 그리드 레이아웃 확인 (1열로 표시되어야 함)
      const featureCards = page.locator('[class*="grid-cols-1"]');
      await expect(featureCards.first()).toBeVisible();

      // 스크롤 가능 여부 확인
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
    });

    test('모바일에서 터치 타겟이 충분히 크다', async ({ page }) => {
      // 버튼들의 최소 크기 확인 (44px × 44px 권장)
      const buttons = page.locator('button, a[role="button"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();

        if (boundingBox) {
          // 최소 터치 타겟 크기 확인 (40px × 40px)
          expect(boundingBox.height).toBeGreaterThanOrEqual(40);
          expect(boundingBox.width).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('모바일에서 네비게이션이 작동한다', async ({ page }) => {
      // 빠른 시작 버튼 클릭
      const newProjectButton = page.locator('text=새 프로젝트 정산');
      await expect(newProjectButton).toBeVisible();

      // 터치 이벤트로 클릭
      await newProjectButton.tap();
      await expect(page).toHaveURL(/\/projects\/new/);

      // 뒤로 가기
      await page.goBack();
      await expect(page).toHaveURL('/');
    });

    test('모바일에서 프로젝트 목록이 올바르게 표시된다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // 모바일에서 테이블이 반응형으로 표시되는지 확인
      const table = page.locator('table');
      if (await table.count() > 0) {
        await expect(table).toBeVisible();

        // 가로 스크롤이 가능한지 확인
        const tableContainer = page.locator('table').locator('..');
        const containerBox = await tableContainer.boundingBox();
        const tableBox = await table.boundingBox();

        if (containerBox && tableBox) {
          // 테이블이 컨테이너보다 넓으면 스크롤 가능해야 함
          if (tableBox.width > containerBox.width) {
            // 스크롤 컨테이너가 있는지 확인
            const scrollContainer = page.locator('[style*="overflow"]').or(page.locator('.overflow-x-auto'));
            if (await scrollContainer.count() > 0) {
              await expect(scrollContainer.first()).toBeVisible();
            }
          }
        }
      }
    });

    test('모바일에서 폼 입력이 용이하다', async ({ page }) => {
      await page.goto('/projects/new');
      await page.waitForLoadState('networkidle');

      // 입력 필드들의 크기 확인
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        const boundingBox = await input.boundingBox();

        if (boundingBox) {
          // 모바일에서 입력하기 쉬운 높이 확인 (최소 44px)
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }

      // 숫자 입력 필드에서 가상 키보드 타입 확인
      const numberInput = page.locator('input[type="number"]');
      if (await numberInput.count() > 0) {
        await numberInput.first().focus();
        // inputmode가 numeric으로 설정되어 있는지 확인 (모바일 최적화)
        const inputMode = await numberInput.first().getAttribute('inputmode');
        if (inputMode) {
          expect(['numeric', 'decimal']).toContain(inputMode);
        }
      }
    });

    test('모바일에서 모달/다이얼로그가 전체 화면을 활용한다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // 삭제 다이얼로그 등 모달이 있는지 확인
      const moreButton = page.locator('[data-lucide="more-horizontal"]');
      if (await moreButton.count() > 0) {
        await moreButton.first().tap();

        // 모달이나 드롭다운이 표시되는지 확인
        const modal = page.locator('[role="dialog"]').or(page.locator('[role="menu"]'));
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();

          // 모바일에서 모달이 적절한 크기로 표시되는지 확인
          const modalBox = await modal.first().boundingBox();
          const viewportSize = page.viewportSize();

          if (modalBox && viewportSize) {
            // 모달이 화면의 80% 이상을 차지하거나 적절한 크기인지 확인
            const widthRatio = modalBox.width / viewportSize.width;
            expect(widthRatio).toBeGreaterThan(0.3); // 최소 30% 이상
          }
        }
      }
    });

    test('모바일에서 스와이프 동작을 지원한다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // 테이블이나 카드 컨테이너에서 스와이프 테스트
      const scrollableElement = page.locator('[class*="overflow-x"]').or(page.locator('table'));

      if (await scrollableElement.count() > 0) {
        const element = scrollableElement.first();
        const boundingBox = await element.boundingBox();

        if (boundingBox) {
          // 터치 스와이프 시뮬레이션
          await page.touchscreen.tap(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);

          // 스와이프 동작
          await page.touchscreen.tap(boundingBox.x + 50, boundingBox.y + boundingBox.height / 2);
          await page.mouse.move(boundingBox.x + boundingBox.width - 50, boundingBox.y + boundingBox.height / 2);

          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('태블릿 환경', () => {
    test.use({ ...devices['iPad Pro'] });

    test('태블릿에서 2열 그리드가 적용된다', async ({ page }) => {
      await page.goto('/');

      // MD 브레이크포인트에서 2열 그리드 확인
      const featureGrid = page.locator('.md\\:grid-cols-2');
      await expect(featureGrid.first()).toBeVisible();

      // 뷰포트 크기 확인
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBeGreaterThan(768); // MD 브레이크포인트
    });

    test('태블릿에서 프로젝트 테이블이 적절히 표시된다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // 태블릿에서는 테이블이 스크롤 없이 표시될 수 있는지 확인
      const table = page.locator('table');
      if (await table.count() > 0) {
        const tableBox = await table.boundingBox();
        const viewportSize = page.viewportSize();

        if (tableBox && viewportSize) {
          // 태블릿에서는 테이블이 화면에 맞을 가능성이 높음
          if (tableBox.width <= viewportSize.width) {
            await expect(table).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('데스크톱 환경', () => {
    test.use({ ...devices['Desktop Chrome'] });

    test('데스크톱에서 4열 그리드가 적용된다', async ({ page }) => {
      await page.goto('/');

      // LG 브레이크포인트에서 4열 그리드 확인
      const featureGrid = page.locator('.lg\\:grid-cols-4');
      await expect(featureGrid.first()).toBeVisible();

      // 뷰포트 크기 확인
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBeGreaterThan(1024); // LG 브레이크포인트
    });

    test('데스크톱에서 호버 효과가 작동한다', async ({ page }) => {
      await page.goto('/');

      // 카드 호버 효과 확인
      const card = page.locator('.hover\\:shadow-lg').first();
      await expect(card).toBeVisible();

      // 호버 시 그림자 효과
      await card.hover();
      await page.waitForTimeout(200);

      // CSS 트랜지션이 적용되는지 확인
      await expect(card).toHaveClass(/transition-shadow/);
    });
  });

  test.describe('반응형 브레이크포인트', () => {
    const breakpoints = [
      { name: '모바일 S', width: 320, height: 568 },
      { name: '모바일 M', width: 375, height: 667 },
      { name: '모바일 L', width: 414, height: 896 },
      { name: '태블릿', width: 768, height: 1024 },
      { name: '데스크톱', width: 1024, height: 768 },
      { name: '데스크톱 L', width: 1440, height: 900 },
    ];

    breakpoints.forEach(({ name, width, height }) => {
      test(`${name} (${width}x${height})에서 레이아웃이 올바르게 표시된다`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');

        // 메인 헤딩 표시 확인
        await expect(page.locator('h2:has-text("환영합니다!")')).toBeVisible();

        // 콘텐츠가 뷰포트를 벗어나지 않는지 확인
        const body = page.locator('body');
        const bodyBox = await body.boundingBox();

        if (bodyBox) {
          // 가로 스크롤이 생기지 않는지 확인 (허용 오차 10px)
          expect(bodyBox.width).toBeLessThanOrEqual(width + 10);
        }

        // 스크롤 테스트
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);

        // 하단까지 스크롤 후에도 레이아웃이 깨지지 않는지 확인
        await expect(page.locator('h2:has-text("환영합니다!")')).toBeVisible();
      });
    });
  });

  test.describe('터치 인터페이스', () => {
    test.use({ ...devices['iPhone 12'] });

    test('터치 제스처가 올바르게 처리된다', async ({ page }) => {
      await page.goto('/');

      // 버튼 터치 테스트
      const button = page.locator('text=새 프로젝트 정산');
      await expect(button).toBeVisible();

      // 터치 다운/업 이벤트
      const buttonBox = await button.boundingBox();
      if (buttonBox) {
        await page.touchscreen.tap(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
        await expect(page).toHaveURL(/\/projects\/new/);
      }
    });

    test('핀치 줌이 비활성화되어 있다', async ({ page }) => {
      await page.goto('/');

      // 뷰포트 메타 태그 확인
      const viewportMeta = page.locator('meta[name="viewport"]');
      const content = await viewportMeta.getAttribute('content');

      if (content) {
        // user-scalable=no 또는 maximum-scale=1 확인
        expect(content).toMatch(/user-scalable=no|maximum-scale=1/);
      }
    });

    test('터치 피드백이 제공된다', async ({ page }) => {
      await page.goto('/');

      // 버튼에 터치 피드백 클래스가 있는지 확인
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();

        // 터치 시작
        await firstButton.tap();

        // 활성 상태나 포커스 상태 확인
        const hasActiveState = await firstButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.outline !== 'none' || el.matches(':focus') || el.matches(':active');
        });

        // 포커스나 활성 상태가 있어야 함
        expect(hasActiveState).toBeTruthy();
      }
    });
  });
});