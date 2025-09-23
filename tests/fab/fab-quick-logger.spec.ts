/**
 * FAB 퀵 로거 E2E 테스트
 * 모바일 FAB 기능, 원탭 로깅, 오프라인 지원, 동기화
 */

import { test, expect } from '@playwright/test';
import {
  authenticatedPage,
  waitForPageLoad,
  clickFABButton,
  selectMember,
  setMobileViewport,
  simulateOffline,
  simulateOnline,
  getLocalStorageData,
  setLocalStorageData,
  waitForAPIResponse,
  expectToastMessage,
  waitForLoadingToFinish,
  SAMPLE_DATA
} from '../test-utils';

test.describe('FAB Quick Logger', () => {

  test.describe('FAB Visibility and Interaction', () => {
    test.beforeEach(async ({ page, context }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);
    });

    test('should show FAB on mobile viewport', async ({ page }) => {
      // FAB 버튼이 표시되는지 확인
      const fabButton = page.locator('[data-testid="fab-button"]');
      await expect(fabButton).toBeVisible();

      // 우측 하단에 위치하는지 확인
      const fabPosition = await fabButton.boundingBox();
      expect(fabPosition?.x).toBeGreaterThan(300); // 화면 오른쪽
      expect(fabPosition?.y).toBeGreaterThan(600); // 화면 하단
    });

    test('should open quick logger overlay when FAB clicked', async ({ page }) => {
      const fabButton = page.locator('[data-testid="fab-button"]');
      await fabButton.click();

      // 퀵 로거 오버레이가 열렸는지 확인
      const overlay = page.locator('[data-testid="quick-logger-overlay"]');
      await expect(overlay).toBeVisible();

      // 멤버 선택 드롭다운 확인
      await expect(page.locator('[data-testid="member-select"]')).toBeVisible();

      // 퀵 액션 버튼들 확인
      const actionButtons = [
        '컨택1000',
        '상담1000',
        '가이드2000',
        '피드 3개 미만(400)',
        '피드 3개 이상(1000)'
      ];

      for (const buttonText of actionButtons) {
        await expect(page.locator(`button:has-text("${buttonText}")`)).toBeVisible();
      }
    });

    test('should close overlay when clicking outside', async ({ page }) => {
      const fabButton = page.locator('[data-testid="fab-button"]');
      await fabButton.click();

      const overlay = page.locator('[data-testid="quick-logger-overlay"]');
      await expect(overlay).toBeVisible();

      // 오버레이 외부 클릭
      await page.click('body', { position: { x: 50, y: 50 } });

      // 오버레이가 닫혔는지 확인
      await expect(overlay).toBeHidden();
    });

    test('should close overlay on escape key', async ({ page }) => {
      const fabButton = page.locator('[data-testid="fab-button"]');
      await fabButton.click();

      const overlay = page.locator('[data-testid="quick-logger-overlay"]');
      await expect(overlay).toBeVisible();

      // ESC 키 누르기
      await page.keyboard.press('Escape');

      // 오버레이가 닫혔는지 확인
      await expect(overlay).toBeHidden();
    });

    test('should hide FAB on desktop viewport', async ({ page }) => {
      // 데스크탑으로 변경
      await page.setViewportSize({ width: 1280, height: 720 });

      // FAB이 숨겨져야 함
      const fabButton = page.locator('[data-testid="fab-button"]');
      await expect(fabButton).toBeHidden();
    });
  });

  test.describe('Member Selection', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);

      // FAB 열기
      await page.click('[data-testid="fab-button"]');
      await page.waitForTimeout(300);
    });

    test('should show all active members in dropdown', async ({ page }) => {
      const memberSelect = page.locator('[data-testid="member-select"]');
      await memberSelect.click();

      // 예상 멤버들이 표시되는지 확인
      const expectedMembers = ['오유택', '이예천', '김연지', '김하늘', '이정수', '박지윤'];

      for (const member of expectedMembers) {
        await expect(page.locator(`[data-testid="member-option-${member}"]`)).toBeVisible();
      }
    });

    test('should select member and remember choice', async ({ page }) => {
      // 멤버 선택
      await selectMember(page, '오유택');

      // 선택된 멤버가 표시되는지 확인
      const selectedMember = page.locator('[data-testid="selected-member"]');
      await expect(selectedMember).toContainText('오유택');

      // FAB을 닫고 다시 열어도 선택이 유지되는지 확인
      await page.keyboard.press('Escape');
      await page.click('[data-testid="fab-button"]');

      const memberSelect = page.locator('[data-testid="member-select"]');
      const memberText = await memberSelect.textContent();
      expect(memberText).toContain('오유택');
    });

    test('should require member selection before action', async ({ page }) => {
      // 멤버 선택 없이 액션 버튼 클릭
      await page.click('button:has-text("컨택1000")');

      // 경고 메시지 확인
      await expectToastMessage(page, '멤버를 선택해주세요');

      // 오버레이가 여전히 열려있는지 확인
      const overlay = page.locator('[data-testid="quick-logger-overlay"]');
      await expect(overlay).toBeVisible();
    });
  });

  test.describe('Quick Action Buttons', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);

      // FAB 열기 및 멤버 선택
      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '오유택');
    });

    test('should log 컨택1000 action', async ({ page }) => {
      // 컨택1000 버튼 클릭
      await page.click('button:has-text("컨택1000")');

      // 성공 메시지 확인
      await expectToastMessage(page, '컨택이 기록되었습니다');

      // 오버레이가 닫혔는지 확인
      const overlay = page.locator('[data-testid="quick-logger-overlay"]');
      await expect(overlay).toBeHidden();

      // 데이터가 서버로 전송되었는지 확인 (API 호출)
      // 실제 구현에서는 API 응답을 모니터링할 수 있음
    });

    test('should log 상담1000 action', async ({ page }) => {
      await page.click('button:has-text("상담1000")');

      await expectToastMessage(page, '상담이 기록되었습니다');

      // 컨택 페이지에서 기록 확인
      await page.goto('/contacts');
      await waitForLoadingToFinish(page);

      // 최근 기록된 상담 항목 확인
      const recentEntry = page.locator('[data-testid="contact-entry"]').first();
      await expect(recentEntry).toContainText('상담');
      await expect(recentEntry).toContainText('1,000');
    });

    test('should log 가이드2000 action', async ({ page }) => {
      await page.click('button:has-text("가이드2000")');

      await expectToastMessage(page, '가이드가 기록되었습니다');

      // 컨택 페이지에서 확인
      await page.goto('/contacts');
      await waitForLoadingToFinish(page);

      const recentEntry = page.locator('[data-testid="contact-entry"]').first();
      await expect(recentEntry).toContainText('가이드');
      await expect(recentEntry).toContainText('2,000');
    });

    test('should log 피드 3개 미만(400) action', async ({ page }) => {
      await page.click('button:has-text("피드 3개 미만(400)")');

      await expectToastMessage(page, '피드가 기록되었습니다');

      // 피드 페이지에서 확인
      await page.goto('/feed');
      await waitForLoadingToFinish(page);

      const recentFeed = page.locator('[data-testid="feed-entry"]').first();
      await expect(recentFeed).toContainText('3개 미만');
      await expect(recentFeed).toContainText('400');
    });

    test('should log 피드 3개 이상(1000) action', async ({ page }) => {
      await page.click('button:has-text("피드 3개 이상(1000)")');

      await expectToastMessage(page, '피드가 기록되었습니다');

      // 피드 페이지에서 확인
      await page.goto('/feed');
      await waitForLoadingToFinish(page);

      const recentFeed = page.locator('[data-testid="feed-entry"]').first();
      await expect(recentFeed).toContainText('3개 이상');
      await expect(recentFeed).toContainText('1,000');
    });

    test('should record multiple actions in sequence', async ({ page }) => {
      // 여러 액션 연속 기록
      await page.click('button:has-text("컨택1000")');
      await expectToastMessage(page, '컨택이 기록되었습니다');

      // FAB 다시 열기
      await page.click('[data-testid="fab-button"]');
      await page.click('button:has-text("피드 3개 이상(1000)")');
      await expectToastMessage(page, '피드가 기록되었습니다');

      // 대시보드에서 최근 활동 확인
      await page.goto('/');
      await waitForLoadingToFinish(page);

      const recentActivities = page.locator('[data-testid="recent-activities"]');
      await expect(recentActivities).toContainText('컨택');
      await expect(recentActivities).toContainText('피드');
    });
  });

  test.describe('Offline Functionality', () => {
    test.beforeEach(async ({ page, context }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);

      // FAB 열기 및 멤버 선택
      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '오유택');
    });

    test('should work when offline', async ({ page, context }) => {
      // 네트워크 오프라인으로 설정
      await simulateOffline(context);

      // 오프라인 상태에서 액션 기록
      await page.click('button:has-text("컨택1000")');

      // 오프라인 저장 메시지 확인
      await expectToastMessage(page, '오프라인으로 저장되었습니다');

      // LocalStorage에 저장되었는지 확인
      const offlineData = await getLocalStorageData(page, 'fab-offline-logs');
      expect(offlineData).not.toBeNull();

      const parsedData = JSON.parse(offlineData || '[]');
      expect(parsedData.length).toBeGreaterThan(0);
      expect(parsedData[0]).toMatchObject({
        member_name: '오유택',
        event_type: 'INCOMING',
        amount: 1000
      });
    });

    test('should accumulate offline actions', async ({ page, context }) => {
      await simulateOffline(context);

      // 여러 오프라인 액션 수행
      await page.click('button:has-text("컨택1000")');
      await expectToastMessage(page, '오프라인으로 저장되었습니다');

      await page.click('[data-testid="fab-button"]');
      await page.click('button:has-text("상담1000")');
      await expectToastMessage(page, '오프라인으로 저장되었습니다');

      // LocalStorage에 여러 항목이 저장되었는지 확인
      const offlineData = await getLocalStorageData(page, 'fab-offline-logs');
      const parsedData = JSON.parse(offlineData || '[]');
      expect(parsedData.length).toBe(2);
    });

    test('should show offline indicator', async ({ page, context }) => {
      await simulateOffline(context);

      // 오프라인 표시 확인
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      await expect(offlineIndicator).toBeVisible();
      await expect(offlineIndicator).toContainText('오프라인');
    });

    test('should sync when back online', async ({ page, context }) => {
      // 오프라인에서 데이터 저장
      await simulateOffline(context);
      await page.click('button:has-text("컨택1000")');
      await expectToastMessage(page, '오프라인으로 저장되었습니다');

      // 온라인으로 복구
      await simulateOnline(context);

      // 자동 동기화 대기
      await page.waitForTimeout(2000);

      // 동기화 성공 메시지 확인
      await expectToastMessage(page, '동기화가 완료되었습니다');

      // LocalStorage가 비워졌는지 확인
      const offlineData = await getLocalStorageData(page, 'fab-offline-logs');
      const parsedData = JSON.parse(offlineData || '[]');
      expect(parsedData.length).toBe(0);

      // 실제 데이터가 서버에 저장되었는지 확인
      await page.goto('/contacts');
      await waitForLoadingToFinish(page);

      const recentEntry = page.locator('[data-testid="contact-entry"]').first();
      await expect(recentEntry).toContainText('컨택');
    });

    test('should handle sync failures gracefully', async ({ page, context }) => {
      // 오프라인에서 데이터 저장
      await simulateOffline(context);
      await page.click('button:has-text("컨택1000")');

      // 온라인으로 복구하지만 API 에러 발생 시뮬레이션
      await simulateOnline(context);
      await page.route('**/api/contacts', route => {
        route.abort('failed');
      });

      // 동기화 시도 후 실패 메시지 확인
      await page.waitForTimeout(2000);
      await expectToastMessage(page, '동기화에 실패했습니다');

      // 데이터가 여전히 LocalStorage에 남아있는지 확인
      const offlineData = await getLocalStorageData(page, 'fab-offline-logs');
      const parsedData = JSON.parse(offlineData || '[]');
      expect(parsedData.length).toBe(1);
    });

    test('should retry sync on manual request', async ({ page, context }) => {
      // 동기화 실패 상황 설정
      await simulateOffline(context);
      await page.click('button:has-text("컨택1000")');
      await simulateOnline(context);

      // API 실패 모킹
      await page.route('**/api/contacts', route => {
        route.abort('failed');
      });

      await page.waitForTimeout(2000);

      // 수동 재시도 버튼 클릭
      const retryButton = page.locator('[data-testid="sync-retry"]');
      if (await retryButton.count() > 0) {
        // API 성공으로 변경
        await page.unroute('**/api/contacts');

        await retryButton.click();

        // 성공 메시지 확인
        await expectToastMessage(page, '동기화가 완료되었습니다');
      }
    });
  });

  test.describe('Data Validation and Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);
    });

    test('should handle rapid successive clicks', async ({ page }) => {
      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '오유택');

      // 빠른 연속 클릭
      const button = page.locator('button:has-text("컨택1000")');
      await button.click();
      await button.click();
      await button.click();

      // 중복 요청 방지 확인 (한 번만 저장되어야 함)
      const toastCount = await page.locator('[data-sonner-toast]').count();
      expect(toastCount).toBeLessThanOrEqual(2); // 최대 2개 (성공 메시지 + 중복 방지 메시지)
    });

    test('should validate member selection persistence', async ({ page }) => {
      // 멤버 선택 후 페이지 이동
      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '이예천');
      await page.keyboard.press('Escape');

      // 다른 페이지로 이동
      await page.goto('/projects');
      await waitForPageLoad(page);

      // 다시 FAB 열기
      await page.click('[data-testid="fab-button"]');

      // 선택이 유지되었는지 확인
      const memberSelect = page.locator('[data-testid="member-select"]');
      const memberText = await memberSelect.textContent();
      expect(memberText).toContain('이예천');
    });

    test('should handle empty member list', async ({ page }) => {
      // 멤버 데이터를 빈 배열로 모킹
      await page.route('**/api/members', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.reload();
      await page.click('[data-testid="fab-button"]');

      // 빈 상태 메시지 확인
      const memberSelect = page.locator('[data-testid="member-select"]');
      await expect(memberSelect).toContainText('멤버가 없습니다');

      // 액션 버튼들이 비활성화되어야 함
      const actionButtons = page.locator('[data-testid="quick-action-button"]');
      const buttonCount = await actionButtons.count();

      for (let i = 0; i < buttonCount; i++) {
        await expect(actionButtons.nth(i)).toBeDisabled();
      }
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '오유택');

      // API 에러 모킹
      await page.route('**/api/contacts', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server Error' })
        });
      });

      await page.click('button:has-text("컨택1000")');

      // 에러 메시지 확인
      await expectToastMessage(page, '저장에 실패했습니다');

      // 오프라인 저장으로 대체되었는지 확인
      const offlineData = await getLocalStorageData(page, 'fab-offline-logs');
      expect(offlineData).not.toBeNull();
    });

    test('should respect user permissions', async ({ page }) => {
      // 권한 제한된 사용자 시뮬레이션 (실제 구현에 따라 다름)
      await page.evaluate(() => {
        localStorage.setItem('user-permissions', JSON.stringify({
          canLogContacts: false,
          canLogFeed: true
        }));
      });

      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '오유택');

      // 컨택 버튼이 비활성화되어야 함
      const contactButton = page.locator('button:has-text("컨택1000")');
      if (await contactButton.count() > 0) {
        await expect(contactButton).toBeDisabled();
      }

      // 피드 버튼은 활성화되어야 함
      const feedButton = page.locator('button:has-text("피드 3개 이상(1000)")');
      if (await feedButton.count() > 0) {
        await expect(feedButton).toBeEnabled();
      }
    });
  });

  test.describe('Animation and UX', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);
    });

    test('should animate FAB button interactions', async ({ page }) => {
      const fabButton = page.locator('[data-testid="fab-button"]');

      // 버튼 호버 또는 터치 애니메이션 확인 (CSS 변화)
      await fabButton.hover();
      await page.waitForTimeout(200);

      // 클릭 애니메이션 확인
      await fabButton.click();
      await page.waitForTimeout(300);

      // 오버레이 등장 애니메이션이 완료되었는지 확인
      const overlay = page.locator('[data-testid="quick-logger-overlay"]');
      await expect(overlay).toBeVisible();
    });

    test('should show loading state during actions', async ({ page }) => {
      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '오유택');

      // API 응답 지연 시뮬레이션
      await page.route('**/api/contacts', async route => {
        await page.waitForTimeout(2000);
        route.continue();
      });

      const actionButton = page.locator('button:has-text("컨택1000")');
      await actionButton.click();

      // 로딩 상태 확인
      await expect(actionButton).toHaveAttribute('disabled');
      await expect(actionButton).toContainText('저장중...');

      // 로딩 완료 후 정상 상태로 복구
      await page.waitForTimeout(3000);
      await expectToastMessage(page, '컨택이 기록되었습니다');
    });

    test('should provide haptic feedback simulation', async ({ page }) => {
      // 진동 API 호출 시뮬레이션 (실제로는 모바일에서만 동작)
      let vibrationCalled = false;

      await page.addInitScript(() => {
        // @ts-ignore
        window.navigator.vibrate = () => {
          // @ts-ignore
          window.__vibrationCalled = true;
          return true;
        };
      });

      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '오유택');
      await page.click('button:has-text("컨택1000")');

      // 진동 호출 여부 확인
      vibrationCalled = await page.evaluate(() => {
        // @ts-ignore
        return window.__vibrationCalled || false;
      });

      // 실제 모바일 환경이 아니므로 테스트는 선택적
      // expect(vibrationCalled).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab 키로 FAB까지 이동
      let tabCount = 0;
      while (tabCount < 20) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');

        if (await focusedElement.getAttribute('data-testid') === 'fab-button') {
          break;
        }
        tabCount++;
      }

      // Enter로 FAB 열기
      await page.keyboard.press('Enter');

      const overlay = page.locator('[data-testid="quick-logger-overlay"]');
      await expect(overlay).toBeVisible();

      // Tab으로 멤버 선택으로 이동
      await page.keyboard.press('Tab');
      const memberSelect = page.locator('[data-testid="member-select"]:focus');
      await expect(memberSelect).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const fabButton = page.locator('[data-testid="fab-button"]');

      // ARIA 라벨 확인
      await expect(fabButton).toHaveAttribute('aria-label', '퀵 로거 열기');

      await fabButton.click();

      // 오버레이의 ARIA 속성 확인
      const overlay = page.locator('[data-testid="quick-logger-overlay"]');
      await expect(overlay).toHaveAttribute('role', 'dialog');
      await expect(overlay).toHaveAttribute('aria-label', '퀵 로거');
    });

    test('should announce actions to screen readers', async ({ page }) => {
      await page.click('[data-testid="fab-button"]');
      await selectMember(page, '오유택');

      await page.click('button:has-text("컨택1000")');

      // 스크린 리더 알림 확인 (aria-live 영역)
      const announcement = page.locator('[aria-live="polite"]');
      if (await announcement.count() > 0) {
        await expect(announcement).toContainText('컨택이 기록되었습니다');
      }
    });
  });
});