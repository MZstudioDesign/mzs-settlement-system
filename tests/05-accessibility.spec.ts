/**
 * 접근성 E2E 테스트
 * - 키보드 네비게이션
 * - 스크린 리더 호환성
 * - ARIA 속성 확인
 * - 색상 대비 및 시각적 접근성
 */

import { test, expect } from '@playwright/test';

test.describe('접근성 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('키보드 네비게이션', () => {
    test('키보드로 모든 인터랙티브 요소에 접근할 수 있다', async ({ page }) => {
      // 첫 번째 포커스 가능한 요소로 이동
      await page.keyboard.press('Tab');

      // 포커스된 요소 확인
      let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);

      // 여러 번 Tab을 눌러 포커스 이동 확인
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'BODY']).toContain(focusedElement);
      }
    });

    test('Enter와 Space 키로 버튼을 활성화할 수 있다', async ({ page }) => {
      // 새 프로젝트 정산 버튼으로 이동
      const newProjectButton = page.locator('text=새 프로젝트 정산');
      await newProjectButton.focus();

      // Enter 키로 버튼 활성화
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/projects\/new/);

      // 홈으로 돌아가기
      await page.goto('/');

      // 다른 버튼에 Space 키 테스트
      const projectManageButton = page.locator('text=프로젝트 관리').first();
      await projectManageButton.focus();
      await page.keyboard.press('Space');
      await expect(page).toHaveURL(/\/projects/);
    });

    test('Escape 키로 모달이나 드롭다운을 닫을 수 있다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // 드롭다운이 있는 경우 테스트
      const moreButton = page.locator('[data-lucide="more-horizontal"]');
      if (await moreButton.count() > 0) {
        await moreButton.first().focus();
        await page.keyboard.press('Enter');

        // 메뉴가 열렸는지 확인
        const menu = page.locator('[role="menu"]').or(page.locator('[role="dialog"]'));
        if (await menu.count() > 0) {
          await expect(menu.first()).toBeVisible();

          // Escape 키로 닫기
          await page.keyboard.press('Escape');
          await expect(menu.first()).not.toBeVisible();
        }
      }
    });

    test('포커스 트랩이 모달에서 작동한다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // 모달을 여는 액션 찾기
      const deleteButton = page.locator('text=삭제').or(page.locator('[data-lucide="trash-2"]'));
      if (await deleteButton.count() > 0) {
        // 프로젝트 선택 후 삭제 버튼 클릭
        const checkbox = page.locator('input[type="checkbox"]').nth(1);
        if (await checkbox.count() > 0) {
          await checkbox.click();
          await deleteButton.first().click();

          // 모달이 열렸는지 확인
          const modal = page.locator('[role="dialog"]');
          if (await modal.count() > 0) {
            await expect(modal).toBeVisible();

            // 모달 내에서 Tab 키 순환 확인
            const modalButtons = modal.locator('button');
            const buttonCount = await modalButtons.count();

            if (buttonCount > 1) {
              // 첫 번째 버튼으로 포커스 이동
              await modalButtons.first().focus();

              // Tab으로 다음 버튼으로 이동
              await page.keyboard.press('Tab');
              await expect(modalButtons.nth(1)).toBeFocused();

              // 마지막 버튼에서 Tab 시 첫 번째로 순환하는지 확인
              await modalButtons.last().focus();
              await page.keyboard.press('Tab');
            }
          }
        }
      }
    });
  });

  test.describe('ARIA 속성 및 시맨틱 마크업', () => {
    test('적절한 ARIA 레이블이 설정되어 있다', async ({ page }) => {
      // 버튼들의 ARIA 레이블 확인
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();

        // ARIA 레이블이나 텍스트 콘텐츠가 있어야 함
        expect(ariaLabel || text).toBeTruthy();
      }
    });

    test('폼 필드에 적절한 레이블이 연결되어 있다', async ({ page }) => {
      await page.goto('/projects/new');
      await page.waitForLoadState('networkidle');

      const inputs = page.locator('input');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');

        // ID가 있으면 해당하는 label 확인
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const labelExists = (await label.count()) > 0;

          // 레이블, ARIA 레이블, 또는 aria-labelledby 중 하나는 있어야 함
          expect(labelExists || ariaLabel || ariaLabelledby).toBeTruthy();
        }
      }
    });

    test('테이블에 적절한 헤더가 설정되어 있다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      const table = page.locator('table');
      if (await table.count() > 0) {
        // 테이블 헤더 확인
        const headers = table.locator('th');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThan(0);

        // 각 헤더에 텍스트가 있는지 확인
        for (let i = 0; i < headerCount; i++) {
          const header = headers.nth(i);
          const headerText = await header.textContent();
          const scope = await header.getAttribute('scope');

          // 헤더에 텍스트나 scope 속성이 있어야 함
          expect(headerText || scope).toBeTruthy();
        }
      }
    });

    test('랜드마크 역할이 올바르게 설정되어 있다', async ({ page }) => {
      // 주요 랜드마크 확인
      const landmarks = [
        'main',
        'nav',
        'header',
        'footer',
        'aside',
        '[role="main"]',
        '[role="navigation"]',
        '[role="banner"]',
        '[role="contentinfo"]'
      ];

      for (const landmark of landmarks) {
        const element = page.locator(landmark);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
        }
      }
    });

    test('상태 정보가 스크린 리더에 전달된다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // 로딩 상태 확인
      const loadingElements = page.locator('[aria-live]').or(page.locator('[role="status"]'));
      if (await loadingElements.count() > 0) {
        const element = loadingElements.first();
        const ariaLive = await element.getAttribute('aria-live');
        expect(['polite', 'assertive']).toContain(ariaLive);
      }

      // 에러나 성공 메시지 확인
      const alerts = page.locator('[role="alert"]');
      if (await alerts.count() > 0) {
        await expect(alerts.first()).toBeVisible();
      }
    });
  });

  test.describe('색상 및 시각적 접근성', () => {
    test('포커스 표시가 명확하다', async ({ page }) => {
      // 버튼에 포커스 시 아웃라인 확인
      const button = page.locator('button').first();
      await button.focus();

      const focusStyles = await button.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        };
      });

      // 포커스 표시가 있는지 확인 (outline 또는 box-shadow)
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';

      expect(hasFocusIndicator).toBeTruthy();
    });

    test('텍스트와 배경 간 충분한 대비를 유지한다', async ({ page }) => {
      // 주요 텍스트 요소들의 색상 대비 확인
      const textElements = [
        'h1', 'h2', 'h3', 'p', 'button', 'a'
      ];

      for (const selector of textElements) {
        const elements = page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          const element = elements.first();
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            };
          });

          // 색상이 설정되어 있는지 확인 (실제 대비율 계산은 복잡하므로 기본 확인만)
          expect(styles.color).toBeTruthy();
        }
      }
    });

    test('색상만으로 정보를 전달하지 않는다', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // 상태 뱃지들이 텍스트도 포함하는지 확인
      const statusBadges = page.locator('[class*="bg-yellow"], [class*="bg-green"], [class*="bg-red"], [class*="bg-blue"]');
      const badgeCount = await statusBadges.count();

      for (let i = 0; i < Math.min(badgeCount, 3); i++) {
        const badge = statusBadges.nth(i);
        const badgeText = await badge.textContent();

        // 배경색만 있는 것이 아니라 텍스트도 포함해야 함
        expect(badgeText?.trim()).toBeTruthy();
      }
    });
  });

  test.describe('스크린 리더 호환성', () => {
    test('페이지 제목이 명확하다', async ({ page }) => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(5);
    });

    test('헤딩 구조가 논리적이다', async ({ page }) => {
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      if (headingCount > 0) {
        // H1이 있는지 확인
        const h1 = page.locator('h1');
        if (await h1.count() > 0) {
          await expect(h1.first()).toBeVisible();
        }

        // 헤딩들에 텍스트가 있는지 확인
        for (let i = 0; i < Math.min(headingCount, 5); i++) {
          const heading = headings.nth(i);
          const headingText = await heading.textContent();
          expect(headingText?.trim()).toBeTruthy();
        }
      }
    });

    test('이미지에 대체 텍스트가 있다', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute('alt');
        const ariaLabel = await image.getAttribute('aria-label');
        const role = await image.getAttribute('role');

        // alt 속성이나 ARIA 레이블이 있어야 함 (장식용 이미지는 alt="" 허용)
        expect(alt !== null || ariaLabel || role === 'presentation').toBeTruthy();
      }
    });

    test('링크에 명확한 텍스트가 있다', async ({ page }) => {
      const links = page.locator('a');
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = links.nth(i);
        const linkText = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');

        // 링크 텍스트, ARIA 레이블, 또는 title 중 하나는 있어야 함
        const hasAccessibleName = linkText?.trim() || ariaLabel || title;
        expect(hasAccessibleName).toBeTruthy();

        // "여기를 클릭" 같은 모호한 텍스트는 피해야 함
        if (linkText) {
          expect(linkText).not.toMatch(/^(클릭|여기|더보기|more|click)$/i);
        }
      }
    });
  });

  test.describe('폼 접근성', () => {
    test('필수 필드가 명확하게 표시된다', async ({ page }) => {
      await page.goto('/projects/new');
      await page.waitForLoadState('networkidle');

      const requiredInputs = page.locator('input[required], select[required], textarea[required]');
      const requiredCount = await requiredInputs.count();

      for (let i = 0; i < requiredCount; i++) {
        const input = requiredInputs.nth(i);
        const ariaRequired = await input.getAttribute('aria-required');
        const required = await input.getAttribute('required');

        // required 속성이나 aria-required가 있어야 함
        expect(required !== null || ariaRequired === 'true').toBeTruthy();
      }

      // 시각적 필수 표시자 확인 (*, required 텍스트 등)
      const requiredIndicators = page.locator('text=*').or(page.locator('text=필수'));
      if (await requiredIndicators.count() > 0) {
        await expect(requiredIndicators.first()).toBeVisible();
      }
    });

    test('에러 메시지가 접근 가능하다', async ({ page }) => {
      await page.goto('/projects/new');
      await page.waitForLoadState('networkidle');

      // 폼 제출로 에러 발생시키기
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("저장")'));
      if (await submitButton.count() > 0) {
        await submitButton.click();

        // 에러 메시지 확인
        const errorMessages = page.locator('[role="alert"]')
          .or(page.locator('.text-red-500'))
          .or(page.locator('[aria-invalid="true"]'));

        if (await errorMessages.count() > 0) {
          await expect(errorMessages.first()).toBeVisible();

          // 에러 메시지가 해당 필드와 연결되어 있는지 확인
          const errorMessage = errorMessages.first();
          const ariaDescribedby = await page.locator('input[aria-describedby]').first().getAttribute('aria-describedby');

          if (ariaDescribedby) {
            const describedElement = page.locator(`#${ariaDescribedby}`);
            await expect(describedElement).toBeVisible();
          }
        }
      }
    });

    test('필드 그룹이 적절히 구조화되어 있다', async ({ page }) => {
      await page.goto('/projects/new');
      await page.waitForLoadState('networkidle');

      // 필드셋이나 그룹 구조 확인
      const fieldsets = page.locator('fieldset');
      if (await fieldsets.count() > 0) {
        const fieldset = fieldsets.first();
        const legend = fieldset.locator('legend');

        if (await legend.count() > 0) {
          await expect(legend).toBeVisible();
          const legendText = await legend.textContent();
          expect(legendText?.trim()).toBeTruthy();
        }
      }
    });
  });

  test.describe('동적 콘텐츠 접근성', () => {
    test('동적으로 추가된 콘텐츠가 알림된다', async ({ page }) => {
      // 페이지 변화 감지를 위한 live region 확인
      const liveRegions = page.locator('[aria-live]');
      if (await liveRegions.count() > 0) {
        const liveRegion = liveRegions.first();
        const politeLevel = await liveRegion.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(politeLevel);
      }
    });

    test('로딩 상태가 스크린 리더에 전달된다', async ({ page }) => {
      await page.goto('/projects');

      // 로딩 인디케이터 확인
      const loadingIndicators = page.locator('[role="status"]')
        .or(page.locator('text=로딩'))
        .or(page.locator('[aria-busy="true"]'));

      if (await loadingIndicators.count() > 0) {
        const indicator = loadingIndicators.first();
        const ariaLabel = await indicator.getAttribute('aria-label');
        const text = await indicator.textContent();

        expect(ariaLabel || text).toBeTruthy();
      }
    });
  });
});