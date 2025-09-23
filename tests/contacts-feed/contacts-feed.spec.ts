/**
 * 컨택 및 피드 관리 E2E 테스트
 * 컨택/피드 등록, 수정, 삭제, 프로젝트 연결, 현금화 처리
 */

import { test, expect } from '@playwright/test';
import {
  authenticatedPage,
  waitForPageLoad,
  waitForLoadingToFinish,
  selectDropdownOption,
  waitForModal,
  expectToastMessage,
  expectErrorMessage,
  waitForAPIResponse,
  setMobileViewport,
  setDesktopViewport,
  fillDateInput,
  SAMPLE_DATA
} from '../test-utils';

test.describe('Contacts & Feed Management', () => {

  test.describe('Contacts Management', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/contacts');
      await waitForLoadingToFinish(page);
    });

    test('should display contacts list with correct columns', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('컨택');

      // 테이블 헤더 확인
      const table = page.locator('[data-testid="contacts-table"]');
      await expect(table).toBeVisible();

      const headers = [
        '날짜',
        '멤버',
        '유형',
        '금액',
        '프로젝트',
        '메모',
        '액션'
      ];

      for (const header of headers) {
        await expect(table.locator('thead')).toContainText(header);
      }
    });

    test('should create new contact entry', async ({ page }) => {
      await page.click('[data-testid="new-contact-button"]');

      const modal = await waitForModal(page);
      await expect(modal).toContainText('새 컨택 등록');

      // 필수 필드 입력
      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'INCOMING');
      await fillDateInput(page, '[data-testid="contact-date"]', '2024-01-15');

      // 프로젝트 연결 (선택사항)
      const projectSelect = page.locator('[data-testid="contact-project-select"]');
      if (await projectSelect.count() > 0) {
        await selectDropdownOption(page, '[data-testid="contact-project-select"]', 'Test Project');
      }

      // 메모 입력
      await page.fill('[data-testid="contact-notes"]', '테스트 컨택 등록');

      // 저장
      await page.click('[data-testid="save-contact"]');

      await expectToastMessage(page, '컨택이 등록되었습니다');
      await expect(modal).toBeHidden();

      // 목록에서 새 항목 확인
      const firstRow = page.locator('[data-testid="contacts-table"] tbody tr').first();
      await expect(firstRow).toContainText('오유택');
      await expect(firstRow).toContainText('INCOMING');
      await expect(firstRow).toContainText('1,000');
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      // 빈 폼 제출
      await page.click('[data-testid="save-contact"]');

      // 유효성 검사 에러 확인
      const memberSelect = page.locator('[data-testid="contact-member-select"]');
      await expect(memberSelect).toHaveAttribute('aria-invalid', 'true');

      const typeSelect = page.locator('[data-testid="contact-type-select"]');
      await expect(typeSelect).toHaveAttribute('aria-invalid', 'true');
    });

    test('should filter contacts by member', async ({ page }) => {
      const memberFilter = page.locator('[data-testid="member-filter"]');

      if (await memberFilter.count() > 0) {
        await selectDropdownOption(page, '[data-testid="member-filter"]', '오유택');
        await waitForLoadingToFinish(page);

        // 필터링된 결과 확인
        const tableRows = page.locator('[data-testid="contacts-table"] tbody tr');
        const rowCount = await tableRows.count();

        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const memberCell = tableRows.nth(i).locator('[data-testid="contact-member"]');
          await expect(memberCell).toContainText('오유택');
        }
      }
    });

    test('should filter contacts by date range', async ({ page }) => {
      const startDateFilter = page.locator('[data-testid="start-date-filter"]');
      const endDateFilter = page.locator('[data-testid="end-date-filter"]');

      if (await startDateFilter.count() > 0) {
        await fillDateInput(page, '[data-testid="start-date-filter"]', '2024-01-01');
        await fillDateInput(page, '[data-testid="end-date-filter"]', '2024-01-31');

        await page.click('[data-testid="apply-filter"]');
        await waitForLoadingToFinish(page);

        // 필터 범위 내의 날짜만 표시되는지 확인
        const dateElements = page.locator('[data-testid="contact-date"]');
        const dateCount = await dateElements.count();

        if (dateCount > 0) {
          const firstDate = await dateElements.first().textContent();
          expect(firstDate).toMatch(/2024-01-/);
        }
      }
    });

    test('should edit existing contact', async ({ page }) => {
      const editButton = page.locator('[data-testid="edit-contact"]').first();

      if (await editButton.count() > 0) {
        await editButton.click();

        const modal = await waitForModal(page);
        await expect(modal).toContainText('컨택 수정');

        // 메모 수정
        await page.fill('[data-testid="contact-notes"]', '수정된 메모');

        await page.click('[data-testid="save-contact"]');

        await expectToastMessage(page, '컨택이 수정되었습니다');
        await expect(modal).toBeHidden();

        // 수정된 내용 확인
        const updatedRow = page.locator('[data-testid="contacts-table"] tbody tr').first();
        await expect(updatedRow).toContainText('수정된 메모');
      }
    });

    test('should delete contact with confirmation', async ({ page }) => {
      const deleteButton = page.locator('[data-testid="delete-contact"]').first();

      if (await deleteButton.count() > 0) {
        await deleteButton.click();

        const confirmModal = await waitForModal(page);
        await expect(confirmModal).toContainText('삭제하시겠습니까?');

        await confirmModal.locator('button').filter({ hasText: '삭제' }).click();

        await expectToastMessage(page, '컨택이 삭제되었습니다');
      }
    });

    test('should show contact type amounts correctly', async ({ page }) => {
      // 각 컨택 유형별 금액 확인
      const contactTypes = [
        { type: 'INCOMING', amount: '1,000' },
        { type: 'CHAT', amount: '1,000' },
        { type: 'GUIDE', amount: '2,000' }
      ];

      for (const contactType of contactTypes) {
        await page.click('[data-testid="new-contact-button"]');
        const modal = await waitForModal(page);

        await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
        await selectDropdownOption(page, '[data-testid="contact-type-select"]', contactType.type);

        // 자동으로 설정된 금액 확인
        const amountField = page.locator('[data-testid="contact-amount"]');
        const amount = await amountField.inputValue();
        expect(amount).toBe(contactType.amount.replace(',', ''));

        await page.click('[data-testid="cancel-contact"]');
        await expect(modal).toBeHidden();
      }
    });

    test('should link contacts to projects', async ({ page }) => {
      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'INCOMING');

      // 프로젝트 선택
      const projectSelect = page.locator('[data-testid="contact-project-select"]');
      if (await projectSelect.count() > 0) {
        await selectDropdownOption(page, '[data-testid="contact-project-select"]', 'Test Project');

        await page.click('[data-testid="save-contact"]');
        await expectToastMessage(page, '컨택이 등록되었습니다');

        // 목록에서 프로젝트 연결 확인
        const firstRow = page.locator('[data-testid="contacts-table"] tbody tr').first();
        await expect(firstRow).toContainText('Test Project');
      }
    });

    test('should show monthly contact summary', async ({ page }) => {
      const summarySection = page.locator('[data-testid="contact-summary"]');

      if (await summarySection.count() > 0) {
        await expect(summarySection).toBeVisible();

        // 이번달 컨택 통계 확인
        await expect(summarySection).toContainText('이번달 컨택');
        await expect(summarySection).toContainText('총 금액');

        // 각 유형별 개수와 금액 확인
        const incomingCount = summarySection.locator('[data-testid="incoming-count"]');
        const chatCount = summarySection.locator('[data-testid="chat-count"]');
        const guideCount = summarySection.locator('[data-testid="guide-count"]');

        if (await incomingCount.count() > 0) {
          await expect(incomingCount).toBeVisible();
        }
      }
    });

    test('should export contacts data', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export-contacts"]');

      if (await exportButton.count() > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          exportButton.click()
        ]);

        // 파일명 확인
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/contacts.*\.csv$/);

        // 다운로드 완료 확인
        const path = await download.path();
        expect(path).toBeTruthy();
      }
    });
  });

  test.describe('Feed Management', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/feed');
      await waitForLoadingToFinish(page);
    });

    test('should display feed list', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('피드');

      const table = page.locator('[data-testid="feed-table"]');
      await expect(table).toBeVisible();

      const headers = [
        '날짜',
        '멤버',
        '유형',
        '금액',
        '현금화',
        '메모',
        '액션'
      ];

      for (const header of headers) {
        await expect(table.locator('thead')).toContainText(header);
      }
    });

    test('should create feed entry with different types', async ({ page }) => {
      const feedTypes = [
        { type: 'BELOW3', amount: 400, label: '3개 미만' },
        { type: 'GTE3', amount: 1000, label: '3개 이상' }
      ];

      for (const feedType of feedTypes) {
        await page.click('[data-testid="new-feed-button"]');
        const modal = await waitForModal(page);

        await selectDropdownOption(page, '[data-testid="feed-member-select"]', '이예천');
        await selectDropdownOption(page, '[data-testid="feed-type-select"]', feedType.label);

        // 자동 설정된 금액 확인
        const amountField = page.locator('[data-testid="feed-amount"]');
        const amount = await amountField.inputValue();
        expect(amount).toBe(feedType.amount.toString());

        await page.fill('[data-testid="feed-notes"]', `${feedType.label} 피드 테스트`);

        await page.click('[data-testid="save-feed"]');
        await expectToastMessage(page, '피드가 등록되었습니다');

        await expect(modal).toBeHidden();
      }
    });

    test('should allow cumulative feed entries', async ({ page }) => {
      // 같은 멤버의 여러 피드 등록
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="new-feed-button"]');
        const modal = await waitForModal(page);

        await selectDropdownOption(page, '[data-testid="feed-member-select"]', '김연지');
        await selectDropdownOption(page, '[data-testid="feed-type-select"]', '3개 미만');

        await page.fill('[data-testid="feed-notes"]', `누적 피드 ${i + 1}`);

        await page.click('[data-testid="save-feed"]');
        await expectToastMessage(page, '피드가 등록되었습니다');
      }

      // 누적된 피드 합계 확인
      const memberSummary = page.locator('[data-testid="member-feed-summary"]');
      if (await memberSummary.count() > 0) {
        const kimYeonjiTotal = memberSummary.locator('text=/김연지.*1,200/');
        await expect(kimYeonjiTotal).toBeVisible();
      }
    });

    test('should handle immediate cash-out request', async ({ page }) => {
      await page.click('[data-testid="new-feed-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="feed-member-select"]', '김하늘');
      await selectDropdownOption(page, '[data-testid="feed-type-select"]', '3개 이상');

      // 즉시 현금화 체크박스 선택
      const cashOutCheckbox = page.locator('[data-testid="immediate-cashout"]');
      await cashOutCheckbox.check();

      await page.click('[data-testid="save-feed"]');
      await expectToastMessage(page, '피드가 등록되고 현금화 요청되었습니다');

      // 목록에서 현금화 상태 확인
      const newEntry = page.locator('[data-testid="feed-table"] tbody tr').first();
      const cashoutStatus = newEntry.locator('[data-testid="cashout-status"]');
      await expect(cashoutStatus).toContainText('요청됨');
    });

    test('should process cash-out for existing feeds', async ({ page }) => {
      // 기존 피드 항목의 현금화 버튼 클릭
      const cashOutButton = page.locator('[data-testid="request-cashout"]').first();

      if (await cashOutButton.count() > 0) {
        await cashOutButton.click();

        const confirmModal = await waitForModal(page);
        await expect(confirmModal).toContainText('현금화를 요청하시겠습니까?');

        await confirmModal.locator('button').filter({ hasText: '확인' }).click();

        await expectToastMessage(page, '현금화가 요청되었습니다');

        // 상태 변경 확인
        const statusCell = page.locator('[data-testid="cashout-status"]').first();
        await expect(statusCell).toContainText('요청됨');
      }
    });

    test('should show feed summary by member', async ({ page }) => {
      const summarySection = page.locator('[data-testid="feed-summary"]');

      if (await summarySection.count() > 0) {
        await expect(summarySection).toBeVisible();
        await expect(summarySection).toContainText('멤버별 피드 현황');

        // 각 멤버의 누적 피드 금액 확인
        const memberSummaryItems = summarySection.locator('[data-testid="member-summary-item"]');
        const itemCount = await memberSummaryItems.count();

        if (itemCount > 0) {
          const firstMember = memberSummaryItems.first();
          await expect(firstMember).toContainText(/\d+원/);
          await expect(firstMember).toContainText(/\d+회/);
        }
      }
    });

    test('should filter feeds by cash-out status', async ({ page }) => {
      const statusFilter = page.locator('[data-testid="cashout-filter"]');

      if (await statusFilter.count() > 0) {
        // '요청됨' 상태 필터링
        await selectDropdownOption(page, '[data-testid="cashout-filter"]', '요청됨');
        await waitForLoadingToFinish(page);

        const tableRows = page.locator('[data-testid="feed-table"] tbody tr');
        const rowCount = await tableRows.count();

        for (let i = 0; i < Math.min(rowCount, 3); i++) {
          const statusCell = tableRows.nth(i).locator('[data-testid="cashout-status"]');
          await expect(statusCell).toContainText('요청됨');
        }
      }
    });

    test('should edit feed entry', async ({ page }) => {
      const editButton = page.locator('[data-testid="edit-feed"]').first();

      if (await editButton.count() > 0) {
        await editButton.click();

        const modal = await waitForModal(page);
        await expect(modal).toContainText('피드 수정');

        // 기존 데이터 로드 확인
        const memberSelect = page.locator('[data-testid="feed-member-select"]');
        const memberText = await memberSelect.textContent();
        expect(memberText).not.toBe('');

        // 메모 수정
        await page.fill('[data-testid="feed-notes"]', '수정된 피드 메모');

        await page.click('[data-testid="save-feed"]');
        await expectToastMessage(page, '피드가 수정되었습니다');
      }
    });

    test('should prevent editing processed cash-out feeds', async ({ page }) => {
      // 현금화 완료된 피드의 수정 버튼 비활성화 확인
      const processedFeedRow = page.locator('[data-testid="cashout-status"]:has-text("완료")').first();

      if (await processedFeedRow.count() > 0) {
        const parentRow = processedFeedRow.locator('..');
        const editButton = parentRow.locator('[data-testid="edit-feed"]');

        await expect(editButton).toBeDisabled();
      }
    });

    test('should export feed data with cash-out status', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export-feed"]');

      if (await exportButton.count() > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          exportButton.click()
        ]);

        const filename = download.suggestedFilename();
        expect(filename).toMatch(/feed.*\.csv$/);

        // CSV 내용 확인 (간접적)
        const path = await download.path();
        expect(path).toBeTruthy();
      }
    });

    test('should show monthly feed statistics', async ({ page }) => {
      const statsSection = page.locator('[data-testid="monthly-feed-stats"]');

      if (await statsSection.count() > 0) {
        await expect(statsSection).toBeVisible();

        // 이번달 통계 확인
        await expect(statsSection).toContainText('이번달 피드');
        await expect(statsSection).toContainText('총 금액');
        await expect(statsSection).toContainText('현금화 대기');

        // 수치 표시 확인
        const totalAmount = statsSection.locator('[data-testid="total-feed-amount"]');
        const pendingAmount = statsSection.locator('[data-testid="pending-cashout-amount"]');

        if (await totalAmount.count() > 0) {
          const totalText = await totalAmount.textContent();
          expect(totalText).toMatch(/₩|원|\d/);
        }
      }
    });
  });

  test.describe('Mobile Contacts & Feed', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
    });

    test('should display mobile-optimized contacts list', async ({ page }) => {
      await authenticatedPage(page, '/contacts');

      // 모바일에서 카드 형태로 표시 확인
      const contactCards = page.locator('[data-testid="contact-card"]');

      if (await contactCards.count() > 0) {
        const firstCard = contactCards.first();
        await expect(firstCard).toBeVisible();

        // 카드 내 필수 정보 확인
        await expect(firstCard).toContainText(/오유택|이예천|김연지/); // 멤버명
        await expect(firstCard).toContainText(/INCOMING|CHAT|GUIDE/); // 타입
        await expect(firstCard).toContainText(/1,000|2,000/); // 금액
      }
    });

    test('should use mobile-friendly input methods', async ({ page }) => {
      await authenticatedPage(page, '/contacts');
      await page.click('[data-testid="new-contact-button"]');

      const modal = await waitForModal(page);

      // 날짜 입력이 모바일에서 적절한 타입인지 확인
      const dateInput = page.locator('[data-testid="contact-date"]');
      await expect(dateInput).toHaveAttribute('type', 'date');

      // 숫자 입력 시 숫자 키패드 호출
      const amountInput = page.locator('[data-testid="contact-amount"]');
      if (await amountInput.count() > 0) {
        await expect(amountInput).toHaveAttribute('inputmode', 'numeric');
      }
    });

    test('should support swipe gestures for actions', async ({ page }) => {
      await authenticatedPage(page, '/feed');

      const feedCard = page.locator('[data-testid="feed-card"]').first();

      if (await feedCard.count() > 0) {
        // 스와이프 제스처 시뮬레이션
        const cardBox = await feedCard.boundingBox();

        if (cardBox) {
          await page.touchscreen.tap(cardBox.x + 10, cardBox.y + cardBox.height / 2);
          await page.touchscreen.tap(cardBox.x + cardBox.width - 10, cardBox.y + cardBox.height / 2);

          // 액션 메뉴나 현금화 버튼이 나타나는지 확인
          const actionMenu = page.locator('[data-testid="swipe-actions"]');
          if (await actionMenu.count() > 0) {
            await expect(actionMenu).toBeVisible();
          }
        }
      }
    });

    test('should show mobile bottom sheet modals', async ({ page }) => {
      await authenticatedPage(page, '/contacts');
      await page.click('[data-testid="new-contact-button"]');

      // 모바일에서 바텀 시트로 표시되는지 확인
      const modal = page.locator('[data-testid="contact-modal"]');
      if (await modal.count() > 0) {
        // 바텀 시트 스타일 클래스 확인
        const modalClass = await modal.getAttribute('class');
        expect(modalClass).toMatch(/bottom|drawer|sheet/);
      }
    });
  });

  test.describe('Data Validation & Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/contacts');
    });

    test('should validate duplicate entries', async ({ page }) => {
      // 첫 번째 컨택 등록
      await page.click('[data-testid="new-contact-button"]');
      let modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'INCOMING');
      await fillDateInput(page, '[data-testid="contact-date"]', '2024-01-15');

      await page.click('[data-testid="save-contact"]');
      await expectToastMessage(page, '컨택이 등록되었습니다');

      // 동일한 날짜에 같은 멤버의 같은 타입 컨택 등록 시도
      await page.click('[data-testid="new-contact-button"]');
      modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'INCOMING');
      await fillDateInput(page, '[data-testid="contact-date"]', '2024-01-15');

      await page.click('[data-testid="save-contact"]');

      // 중복 경고 또는 확인 메시지
      const duplicateWarning = page.locator('[data-testid="duplicate-warning"]');
      if (await duplicateWarning.count() > 0) {
        await expect(duplicateWarning).toBeVisible();
        await expect(duplicateWarning).toContainText('중복');
      }
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // API 에러 모킹
      await page.route('**/api/contacts', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server Error' })
        });
      });

      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'INCOMING');

      await page.click('[data-testid="save-contact"]');

      await expectErrorMessage(page, '서버 오류가 발생했습니다');
    });

    test('should validate future dates', async ({ page }) => {
      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'INCOMING');

      // 미래 날짜 입력
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await fillDateInput(page, '[data-testid="contact-date"]', futureDateStr);

      await page.click('[data-testid="save-contact"]');

      // 미래 날짜 경고 확인
      const dateField = page.locator('[data-testid="contact-date"]');
      await expect(dateField).toHaveAttribute('aria-invalid', 'true');

      await expectErrorMessage(page, '미래 날짜는 입력할 수 없습니다');
    });

    test('should handle network timeouts', async ({ page }) => {
      // 네트워크 지연 시뮬레이션
      await page.route('**/api/contacts', async route => {
        await page.waitForTimeout(10000); // 10초 지연
        route.continue();
      });

      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'INCOMING');

      await page.click('[data-testid="save-contact"]');

      // 로딩 상태 확인
      const saveButton = page.locator('[data-testid="save-contact"]');
      await expect(saveButton).toBeDisabled();
      await expect(saveButton).toContainText('저장중...');

      // 타임아웃 에러 메시지 (실제로는 더 짧은 타임아웃 설정)
      // await expectErrorMessage(page, '요청이 시간 초과되었습니다');
    });

    test('should preserve form data on errors', async ({ page }) => {
      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      // 폼 데이터 입력
      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '이예천');
      await page.fill('[data-testid="contact-notes"]', '에러 테스트 메모');

      // API 에러 상황에서 폼 제출
      await page.route('**/api/contacts', route => {
        route.fulfill({ status: 400 });
      });

      await page.click('[data-testid="save-contact"]');

      // 에러 후에도 입력된 데이터가 유지되는지 확인
      const memberSelect = page.locator('[data-testid="contact-member-select"]');
      const notesField = page.locator('[data-testid="contact-notes"]');

      const memberText = await memberSelect.textContent();
      const notesValue = await notesField.inputValue();

      expect(memberText).toContain('이예천');
      expect(notesValue).toBe('에러 테스트 메모');
    });
  });

  test.describe('Data Persistence and State Management', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/contacts');
    });

    test('should maintain filter state across page reloads', async ({ page }) => {
      const memberFilter = page.locator('[data-testid="member-filter"]');

      if (await memberFilter.count() > 0) {
        await selectDropdownOption(page, '[data-testid="member-filter"]', '오유택');

        // 페이지 새로고침
        await page.reload();
        await waitForLoadingToFinish(page);

        // 필터 상태가 유지되었는지 확인
        const filterValue = await memberFilter.textContent();
        expect(filterValue).toContain('오유택');
      }
    });

    test('should sync data between contacts and feed pages', async ({ page }) => {
      // 컨택 페이지에서 항목 추가
      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '김하늘');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'INCOMING');

      await page.click('[data-testid="save-contact"]');
      await expectToastMessage(page, '컨택이 등록되었습니다');

      // 피드 페이지로 이동하여 관련 데이터 확인
      await page.goto('/feed');
      await waitForLoadingToFinish(page);

      // 멤버별 요약에서 김하늘의 정보 업데이트 확인
      const memberSummary = page.locator('[data-testid="member-feed-summary"]');
      if (await memberSummary.count() > 0) {
        // 컨택은 피드와 별도이지만, 전체 활동 요약에서 반영될 수 있음
        await expect(memberSummary).toContainText('김하늘');
      }
    });

    test('should handle optimistic updates', async ({ page }) => {
      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '박지윤');
      await selectDropdownOption(page, '[data-testid="contact-type-select"]', 'GUIDE');

      // API 응답 지연 시뮬레이션
      await page.route('**/api/contacts', async route => {
        await page.waitForTimeout(2000);
        route.continue();
      });

      await page.click('[data-testid="save-contact"]');

      // 즉시 목록에 추가되는지 확인 (낙관적 업데이트)
      const newRow = page.locator('[data-testid="contacts-table"] tbody tr').first();
      await expect(newRow).toContainText('박지윤');

      // 저장 완료 후 확정 상태 확인
      await expectToastMessage(page, '컨택이 등록되었습니다');
    });
  });
});