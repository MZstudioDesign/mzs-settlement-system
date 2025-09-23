/**
 * 정산 생성 및 관리 E2E 테스트
 * 월별 정산 생성, 계산 검증, PDF/CSV 내보내기, 지급 처리
 */

import { test, expect } from '@playwright/test';
import {
  authenticatedPage,
  waitForPageLoad,
  waitForLoadingToFinish,
  selectDropdownOption,
  waitForModal,
  waitForDownload,
  expectToastMessage,
  expectErrorMessage,
  expectNumberWithTolerance,
  setMobileViewport,
  setDesktopViewport,
  SAMPLE_DATA
} from '../test-utils';

test.describe('Settlements Management', () => {

  test.describe('Settlement List & Overview', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/settlements');
      await waitForLoadingToFinish(page);
    });

    test('should display settlements list', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('정산');

      const table = page.locator('[data-testid="settlements-table"]');
      await expect(table).toBeVisible();

      const headers = [
        '정산월',
        '총 매출',
        '총 지급액',
        '생성일',
        '상태',
        '액션'
      ];

      for (const header of headers) {
        await expect(table.locator('thead')).toContainText(header);
      }
    });

    test('should show monthly settlement summary', async ({ page }) => {
      const summaryCards = page.locator('[data-testid="settlement-summary"]');

      if (await summaryCards.count() > 0) {
        await expect(summaryCards).toBeVisible();

        // 이번달 정산 현황
        await expect(summaryCards).toContainText('이번달');
        await expect(summaryCards).toContainText('총 매출');
        await expect(summaryCards).toContainText('지급 예정');

        // 금액이 통화 형식으로 표시되는지 확인
        const amounts = summaryCards.locator('[data-testid*="amount"]');
        const amountCount = await amounts.count();

        for (let i = 0; i < amountCount; i++) {
          const amountText = await amounts.nth(i).textContent();
          expect(amountText).toMatch(/₩|원|\d{1,3}(,\d{3})*/);
        }
      }
    });

    test('should filter settlements by month', async ({ page }) => {
      const monthFilter = page.locator('[data-testid="month-filter"]');

      if (await monthFilter.count() > 0) {
        await selectDropdownOption(page, '[data-testid="month-filter"]', '2024-01');
        await waitForLoadingToFinish(page);

        // 필터링된 결과 확인
        const tableRows = page.locator('[data-testid="settlements-table"] tbody tr');
        const rowCount = await tableRows.count();

        if (rowCount > 0) {
          const firstRow = tableRows.first();
          const monthCell = firstRow.locator('[data-testid="settlement-month"]');
          await expect(monthCell).toContainText('2024-01');
        }
      }
    });

    test('should show settlement status correctly', async ({ page }) => {
      const statusElements = page.locator('[data-testid="settlement-status"]');
      const statusCount = await statusElements.count();

      if (statusCount > 0) {
        const validStatuses = ['생성중', '완료', '지급중', '지급완료'];

        for (let i = 0; i < Math.min(statusCount, 5); i++) {
          const statusText = await statusElements.nth(i).textContent();
          expect(validStatuses.some(status => statusText?.includes(status))).toBeTruthy();
        }
      }
    });
  });

  test.describe('Create New Settlement', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/settlements');
    });

    test('should create monthly settlement', async ({ page }) => {
      await page.click('[data-testid="new-settlement-button"]');

      const modal = await waitForModal(page);
      await expect(modal).toContainText('새 정산 생성');

      // 정산 월 선택
      await selectDropdownOption(page, '[data-testid="settlement-month-select"]', '2024-02');

      // 정산 생성 전 미리보기 확인
      const previewSection = page.locator('[data-testid="settlement-preview"]');
      if (await previewSection.count() > 0) {
        await expect(previewSection).toBeVisible();

        // 예상 항목들 확인
        await expect(previewSection).toContainText('프로젝트');
        await expect(previewSection).toContainText('컨택');
        await expect(previewSection).toContainText('피드');
        await expect(previewSection).toContainText('팀업무');
      }

      // 정산 생성 실행
      await page.click('[data-testid="create-settlement"]');

      // 생성 완료 메시지
      await expectToastMessage(page, '정산이 생성되었습니다');
      await expect(modal).toBeHidden();

      // 목록에서 새로 생성된 정산 확인
      const newSettlement = page.locator('[data-testid="settlements-table"] tbody tr').first();
      await expect(newSettlement).toContainText('2024-02');
      await expect(newSettlement).toContainText('완료');
    });

    test('should validate settlement prerequisites', async ({ page }) => {
      await page.click('[data-testid="new-settlement-button"]');
      const modal = await waitForModal(page);

      // 이미 정산이 존재하는 월 선택 시도
      await selectDropdownOption(page, '[data-testid="settlement-month-select"]', '2024-01');

      await page.click('[data-testid="create-settlement"]');

      // 중복 생성 경고 확인
      await expectErrorMessage(page, '이미 정산이 존재합니다');
    });

    test('should show settlement calculation preview', async ({ page }) => {
      await page.click('[data-testid="new-settlement-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="settlement-month-select"]', '2024-03');

      // 계산 미리보기 로딩 대기
      await waitForLoadingToFinish(page);

      const calculationPreview = page.locator('[data-testid="calculation-preview"]');
      if (await calculationPreview.count() > 0) {
        // 각 멤버별 예상 지급액 확인
        const memberPreviews = calculationPreview.locator('[data-testid="member-preview"]');
        const memberCount = await memberPreviews.count();

        if (memberCount > 0) {
          const firstMember = memberPreviews.first();
          await expect(firstMember).toContainText(/오유택|이예천|김연지/);

          // 원천징수 전/후 금액 표시 확인
          await expect(firstMember).toContainText('원천징수 전');
          await expect(firstMember).toContainText('원천징수 후');
        }
      }
    });

    test('should handle empty data periods', async ({ page }) => {
      await page.click('[data-testid="new-settlement-button"]');
      const modal = await waitForModal(page);

      // 데이터가 없는 월 선택
      await selectDropdownOption(page, '[data-testid="settlement-month-select"]', '2025-01');

      const previewSection = page.locator('[data-testid="settlement-preview"]');
      if (await previewSection.count() > 0) {
        await expect(previewSection).toContainText('데이터가 없습니다');
      }

      // 빈 정산도 생성 가능한지 확인
      await page.click('[data-testid="create-settlement"]');
      await expectToastMessage(page, '정산이 생성되었습니다');
    });

    test('should save settlement snapshot', async ({ page }) => {
      await page.click('[data-testid="new-settlement-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="settlement-month-select"]', '2024-04');
      await page.click('[data-testid="create-settlement"]');

      await expectToastMessage(page, '정산이 생성되었습니다');

      // 정산 상세 페이지로 이동
      const newSettlement = page.locator('[data-testid="settlements-table"] tbody tr').first();
      await newSettlement.locator('[data-testid="view-settlement"]').click();

      await waitForPageLoad(page);

      // 스냅샷 데이터가 저장되었는지 확인
      const snapshotInfo = page.locator('[data-testid="snapshot-info"]');
      if (await snapshotInfo.count() > 0) {
        await expect(snapshotInfo).toContainText('생성일시');
        await expect(snapshotInfo).toContainText('2024-04');
      }
    });
  });

  test.describe('Settlement Detail View', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/settlements');
      await waitForLoadingToFinish(page);

      // 첫 번째 정산 상세 보기
      const viewButton = page.locator('[data-testid="view-settlement"]').first();
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await waitForPageLoad(page);
      } else {
        // 테스트용 정산 생성
        await page.goto('/settlements');
        await page.click('[data-testid="new-settlement-button"]');
        const modal = await waitForModal(page);
        await selectDropdownOption(page, '[data-testid="settlement-month-select"]', '2024-05');
        await page.click('[data-testid="create-settlement"]');
        await waitForPageLoad(page);
      }
    });

    test('should display settlement details', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('정산 상세');

      // 정산 기본 정보 확인
      const settlementInfo = page.locator('[data-testid="settlement-info"]');
      await expect(settlementInfo).toBeVisible();
      await expect(settlementInfo).toContainText('정산월');
      await expect(settlementInfo).toContainText('생성일');
      await expect(settlementInfo).toContainText('총 지급액');
    });

    test('should show member settlement breakdown', async ({ page }) => {
      const memberSection = page.locator('[data-testid="member-settlements"]');
      await expect(memberSection).toBeVisible();

      // 각 멤버별 정산 카드 확인
      const memberCards = memberSection.locator('[data-testid="member-settlement-card"]');
      const cardCount = await memberCards.count();

      if (cardCount > 0) {
        const firstCard = memberCards.first();

        // 멤버 이름 확인
        await expect(firstCard).toContainText(/오유택|이예천|김연지|김하늘|이정수|박지윤/);

        // 정산 항목들 확인
        await expect(firstCard).toContainText('디자인');
        await expect(firstCard).toContainText('컨택');

        // 원천징수 전/후 금액 확인
        const beforeWithholding = firstCard.locator('[data-testid="before-withholding"]');
        const afterWithholding = firstCard.locator('[data-testid="after-withholding"]');

        await expect(beforeWithholding).toBeVisible();
        await expect(afterWithholding).toBeVisible();

        // 원천징수 후 금액이 전 금액보다 작은지 확인
        const beforeText = await beforeWithholding.textContent();
        const afterText = await afterWithholding.textContent();

        if (beforeText && afterText) {
          const beforeAmount = parseInt(beforeText.replace(/[^\d]/g, ''));
          const afterAmount = parseInt(afterText.replace(/[^\d]/g, ''));

          if (beforeAmount > 0) {
            expect(afterAmount).toBeLessThan(beforeAmount);
            expect(afterAmount / beforeAmount).toBeCloseTo(0.967, 2); // 3.3% 차감
          }
        }
      }
    });

    test('should show detailed calculation breakdown', async ({ page }) => {
      const memberCard = page.locator('[data-testid="member-settlement-card"]').first();

      if (await memberCard.count() > 0) {
        // 상세 보기 버튼 클릭
        const detailButton = memberCard.locator('[data-testid="show-detail"]');
        await detailButton.click();

        // 상세 계산 내역 확인
        const detailSection = memberCard.locator('[data-testid="settlement-detail"]');
        await expect(detailSection).toBeVisible();

        // 각 항목별 금액 확인
        const itemBreakdown = [
          'designer_amount',  // 디자이너 기본 금액
          'designer_bonus',   // 디자이너 보너스
          'contact_amount',   // 컨택 금액
          'feed_amount',      // 피드 금액
          'team_amount',      // 팀업무 금액
          'withholding_amount' // 원천징수 금액
        ];

        for (const item of itemBreakdown) {
          const itemElement = detailSection.locator(`[data-testid="${item}"]`);
          if (await itemElement.count() > 0) {
            const itemText = await itemElement.textContent();
            expect(itemText).toMatch(/₩|원|\d/);
          }
        }
      }
    });

    test('should handle payment status toggle', async ({ page }) => {
      const memberCard = page.locator('[data-testid="member-settlement-card"]').first();

      if (await memberCard.count() > 0) {
        const paymentToggle = memberCard.locator('[data-testid="payment-toggle"]');

        if (await paymentToggle.count() > 0) {
          const initialState = await paymentToggle.isChecked();

          // 토글 상태 변경
          await paymentToggle.click();

          // 상태 변경 확인
          const newState = await paymentToggle.isChecked();
          expect(newState).toBe(!initialState);

          // 지급 완료 시 날짜 표시 확인
          if (newState) {
            const paymentDate = memberCard.locator('[data-testid="payment-date"]');
            await expect(paymentDate).toBeVisible();
            await expect(paymentDate).toContainText(/\d{4}-\d{2}-\d{2}/);
          }

          await expectToastMessage(page, '지급 상태가 변경되었습니다');
        }
      }
    });

    test('should add payment notes', async ({ page }) => {
      const memberCard = page.locator('[data-testid="member-settlement-card"]').first();

      if (await memberCard.count() > 0) {
        const notesButton = memberCard.locator('[data-testid="add-notes"]');

        if (await notesButton.count() > 0) {
          await notesButton.click();

          const notesModal = await waitForModal(page);
          await expect(notesModal).toContainText('지급 메모');

          await page.fill('[data-testid="payment-notes"]', '은행 이체 완료 - 국민은행');

          await page.click('[data-testid="save-notes"]');

          await expectToastMessage(page, '메모가 저장되었습니다');
          await expect(notesModal).toBeHidden();

          // 저장된 메모 확인
          const savedNotes = memberCard.locator('[data-testid="payment-memo"]');
          await expect(savedNotes).toContainText('은행 이체 완료');
        }
      }
    });

    test('should calculate totals correctly', async ({ page }) => {
      const totalSection = page.locator('[data-testid="settlement-totals"]');

      if (await totalSection.count() > 0) {
        // 전체 합계 확인
        const totalBeforeWithholding = totalSection.locator('[data-testid="total-before-withholding"]');
        const totalWithholdingAmount = totalSection.locator('[data-testid="total-withholding"]');
        const totalAfterWithholding = totalSection.locator('[data-testid="total-after-withholding"]');

        await expect(totalBeforeWithholding).toBeVisible();
        await expect(totalWithholdingAmount).toBeVisible();
        await expect(totalAfterWithholding).toBeVisible();

        // 계산 검증
        const beforeText = await totalBeforeWithholding.textContent();
        const withholdingText = await totalWithholdingAmount.textContent();
        const afterText = await totalAfterWithholding.textContent();

        if (beforeText && withholdingText && afterText) {
          const beforeAmount = parseInt(beforeText.replace(/[^\d]/g, ''));
          const withholdingAmount = parseInt(withholdingText.replace(/[^\d]/g, ''));
          const afterAmount = parseInt(afterText.replace(/[^\d]/g, ''));

          expect(beforeAmount - withholdingAmount).toEqual(afterAmount);
        }
      }
    });
  });

  test.describe('Settlement Export', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/settlements');
      await waitForLoadingToFinish(page);

      // 정산 상세 페이지로 이동
      const viewButton = page.locator('[data-testid="view-settlement"]').first();
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await waitForPageLoad(page);
      }
    });

    test('should export settlement as PDF', async ({ page }) => {
      const pdfButton = page.locator('[data-testid="export-pdf"]');

      if (await pdfButton.count() > 0) {
        const download = await waitForDownload(page, '[data-testid="export-pdf"]');

        // PDF 파일명 확인
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/settlement.*\.pdf$/);

        // 다운로드 완료 확인
        const path = await download.path();
        expect(path).toBeTruthy();
      }
    });

    test('should export settlement as CSV', async ({ page }) => {
      const csvButton = page.locator('[data-testid="export-csv"]');

      if (await csvButton.count() > 0) {
        const download = await waitForDownload(page, '[data-testid="export-csv"]');

        const filename = download.suggestedFilename();
        expect(filename).toMatch(/settlement.*\.csv$/);

        const path = await download.path();
        expect(path).toBeTruthy();
      }
    });

    test('should show export options modal', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export-options"]');

      if (await exportButton.count() > 0) {
        await exportButton.click();

        const exportModal = await waitForModal(page);
        await expect(exportModal).toContainText('내보내기 옵션');

        // 내보내기 형식 선택
        await expect(exportModal).toContainText('PDF');
        await expect(exportModal).toContainText('CSV');
        await expect(exportModal).toContainText('Excel');

        // 포함 항목 선택
        const includeOptions = exportModal.locator('[data-testid="include-options"]');
        if (await includeOptions.count() > 0) {
          await expect(includeOptions).toContainText('원천징수 전 금액');
          await expect(includeOptions).toContainText('원천징수 후 금액');
          await expect(includeOptions).toContainText('지급 메모');
        }
      }
    });

    test('should customize export data', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export-options"]');

      if (await exportButton.count() > 0) {
        await exportButton.click();

        const exportModal = await waitForModal(page);

        // CSV 형식 선택
        await page.click('[data-testid="format-csv"]');

        // 포함 항목 선택
        await page.check('[data-testid="include-before-withholding"]');
        await page.check('[data-testid="include-after-withholding"]');
        await page.check('[data-testid="include-payment-memo"]');

        // 내보내기 실행
        const download = await waitForDownload(page, '[data-testid="confirm-export"]');

        const filename = download.suggestedFilename();
        expect(filename).toMatch(/settlement.*\.csv$/);
      }
    });

    test('should handle export errors', async ({ page }) => {
      // 서버 에러 시뮬레이션
      await page.route('**/api/settlements/*/export', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Export failed' })
        });
      });

      const pdfButton = page.locator('[data-testid="export-pdf"]');

      if (await pdfButton.count() > 0) {
        await pdfButton.click();

        await expectErrorMessage(page, '내보내기에 실패했습니다');
      }
    });

    test('should show export progress', async ({ page }) => {
      // API 응답 지연 시뮬레이션
      await page.route('**/api/settlements/*/export', async route => {
        await page.waitForTimeout(3000);
        route.continue();
      });

      const pdfButton = page.locator('[data-testid="export-pdf"]');

      if (await pdfButton.count() > 0) {
        await pdfButton.click();

        // 진행 상태 확인
        const progressIndicator = page.locator('[data-testid="export-progress"]');
        if (await progressIndicator.count() > 0) {
          await expect(progressIndicator).toBeVisible();
          await expect(progressIndicator).toContainText('내보내는 중...');
        }

        // 완료 후 진행 상태 사라짐
        await expect(progressIndicator).toBeHidden({ timeout: 10000 });
      }
    });
  });

  test.describe('Settlement Validation & Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/settlements');
    });

    test('should handle settlements with zero amounts', async ({ page }) => {
      // 금액이 0인 정산 생성 시뮬레이션
      await page.route('**/api/settlements/preview', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            members: [{
              id: 1,
              name: '테스트 멤버',
              designer_amount: 0,
              contact_amount: 0,
              feed_amount: 0,
              team_amount: 0,
              total_before_withholding: 0,
              withholding_amount: 0,
              total_after_withholding: 0
            }]
          })
        });
      });

      await page.click('[data-testid="new-settlement-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="settlement-month-select"]', '2024-06');

      // 0원 정산 미리보기 확인
      const previewSection = page.locator('[data-testid="settlement-preview"]');
      if (await previewSection.count() > 0) {
        await expect(previewSection).toContainText('₩0');
      }

      // 0원이어도 정산 생성 가능
      await page.click('[data-testid="create-settlement"]');
      await expectToastMessage(page, '정산이 생성되었습니다');
    });

    test('should handle large settlement amounts', async ({ page }) => {
      // 큰 금액 정산 시뮬레이션
      await page.route('**/api/settlements/preview', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            members: [{
              id: 1,
              name: '테스트 멤버',
              designer_amount: 50000000, // 5천만원
              contact_amount: 5000000,   // 5백만원
              total_before_withholding: 55000000,
              withholding_amount: 1815000, // 3.3%
              total_after_withholding: 53185000
            }]
          })
        });
      });

      await page.click('[data-testid="new-settlement-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="settlement-month-select"]', '2024-07');

      // 큰 금액이 적절히 포맷되어 표시되는지 확인
      const previewSection = page.locator('[data-testid="settlement-preview"]');
      if (await previewSection.count() > 0) {
        await expect(previewSection).toContainText('55,000,000');
        await expect(previewSection).toContainText('53,185,000');
      }
    });

    test('should validate calculation accuracy', async ({ page }) => {
      const viewButton = page.locator('[data-testid="view-settlement"]').first();

      if (await viewButton.count() > 0) {
        await viewButton.click();
        await waitForPageLoad(page);

        const memberCards = page.locator('[data-testid="member-settlement-card"]');
        const cardCount = await memberCards.count();

        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = memberCards.nth(i);

          // 상세 보기 열기
          const detailButton = card.locator('[data-testid="show-detail"]');
          if (await detailButton.count() > 0) {
            await detailButton.click();

            const beforeAmount = card.locator('[data-testid="before-withholding"]');
            const afterAmount = card.locator('[data-testid="after-withholding"]');

            const beforeText = await beforeAmount.textContent();
            const afterText = await afterAmount.textContent();

            if (beforeText && afterText) {
              const before = parseInt(beforeText.replace(/[^\d]/g, ''));
              const after = parseInt(afterText.replace(/[^\d]/g, ''));

              if (before > 0) {
                // 원천징수 3.3% 계산 검증
                const expectedAfter = Math.round(before * 0.967);
                expectNumberWithTolerance(page,
                  card.locator('[data-testid="after-withholding"]').first(),
                  expectedAfter,
                  100
                );
              }
            }
          }
        }
      }
    });

    test('should prevent editing completed settlements', async ({ page }) => {
      const completedSettlement = page.locator('[data-testid="settlement-status"]:has-text("지급완료")').first();

      if (await completedSettlement.count() > 0) {
        const parentRow = completedSettlement.locator('..');
        const editButton = parentRow.locator('[data-testid="edit-settlement"]');

        // 편집 버튼이 비활성화되어야 함
        if (await editButton.count() > 0) {
          await expect(editButton).toBeDisabled();
        }

        // 상세 페이지에서도 편집 불가
        const viewButton = parentRow.locator('[data-testid="view-settlement"]');
        await viewButton.click();
        await waitForPageLoad(page);

        const paymentToggle = page.locator('[data-testid="payment-toggle"]').first();
        if (await paymentToggle.count() > 0) {
          await expect(paymentToggle).toBeDisabled();
        }
      }
    });

    test('should handle partial payments', async ({ page }) => {
      const viewButton = page.locator('[data-testid="view-settlement"]').first();

      if (await viewButton.count() > 0) {
        await viewButton.click();
        await waitForPageLoad(page);

        const memberCards = page.locator('[data-testid="member-settlement-card"]');

        if (await memberCards.count() > 1) {
          // 첫 번째 멤버만 지급 완료
          const firstToggle = memberCards.first().locator('[data-testid="payment-toggle"]');
          await firstToggle.check();

          // 두 번째 멤버는 미지급 상태 유지
          const secondToggle = memberCards.nth(1).locator('[data-testid="payment-toggle"]');
          await secondToggle.uncheck();

          // 전체 정산 상태가 '지급중'으로 변경되는지 확인
          const settlementStatus = page.locator('[data-testid="overall-status"]');
          if (await settlementStatus.count() > 0) {
            await expect(settlementStatus).toContainText('지급중');
          }
        }
      }
    });
  });

  test.describe('Mobile Settlement View', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page, '/settlements');
    });

    test('should display mobile-optimized settlement list', async ({ page }) => {
      // 모바일에서 카드 형태로 표시
      const settlementCards = page.locator('[data-testid="settlement-card"]');

      if (await settlementCards.count() > 0) {
        const firstCard = settlementCards.first();
        await expect(firstCard).toBeVisible();

        // 카드 내 필수 정보 확인
        await expect(firstCard).toContainText(/2024-\d{2}/); // 정산월
        await expect(firstCard).toContainText(/₩|원/); // 금액
        await expect(firstCard).toContainText(/완료|생성중|지급중/); // 상태
      }
    });

    test('should use mobile-friendly settlement detail view', async ({ page }) => {
      const viewButton = page.locator('[data-testid="view-settlement"]').first();

      if (await viewButton.count() > 0) {
        await viewButton.click();
        await waitForPageLoad(page);

        // 모바일에서 세로 스크롤 가능한 카드 레이아웃
        const memberCards = page.locator('[data-testid="member-settlement-card"]');
        const cardCount = await memberCards.count();

        if (cardCount > 0) {
          // 각 카드가 전체 너비를 사용하는지 확인
          const firstCard = memberCards.first();
          const cardBox = await firstCard.boundingBox();

          if (cardBox) {
            expect(cardBox.width).toBeGreaterThan(300); // 최소 너비 확인
          }
        }
      }
    });

    test('should support touch interactions for payment toggles', async ({ page }) => {
      const viewButton = page.locator('[data-testid="view-settlement"]').first();

      if (await viewButton.count() > 0) {
        await viewButton.click();
        await waitForPageLoad(page);

        const paymentToggle = page.locator('[data-testid="payment-toggle"]').first();

        if (await paymentToggle.count() > 0) {
          // 터치로 토글 상태 변경
          await paymentToggle.tap();

          await expectToastMessage(page, '지급 상태가 변경되었습니다');
        }
      }
    });

    test('should show condensed export options on mobile', async ({ page }) => {
      const viewButton = page.locator('[data-testid="view-settlement"]').first();

      if (await viewButton.count() > 0) {
        await viewButton.click();
        await waitForPageLoad(page);

        // 모바일에서는 액션 시트 형태의 내보내기 옵션
        const exportButton = page.locator('[data-testid="export-options"]');

        if (await exportButton.count() > 0) {
          await exportButton.click();

          // 바텀 시트나 액션 시트 확인
          const exportSheet = page.locator('[data-testid="export-sheet"]');
          if (await exportSheet.count() > 0) {
            await expect(exportSheet).toBeVisible();
            await expect(exportSheet).toContainText('PDF');
            await expect(exportSheet).toContainText('CSV');
          }
        }
      }
    });
  });
});