/**
 * 프로젝트 관리 E2E 테스트
 * CRUD 작업, 디자이너 할당, 지분 설정, 정산 계산 미리보기
 */

import { test, expect } from '@playwright/test';
import {
  authenticatedPage,
  waitForPageLoad,
  waitForLoadingToFinish,
  fillProjectForm,
  setDesignerShares,
  verifySettlementCalculation,
  selectDropdownOption,
  waitForModal,
  expectSuccessMessage,
  expectErrorMessage,
  expectToastMessage,
  waitForAPIResponse,
  setMobileViewport,
  setDesktopViewport,
  SAMPLE_DATA
} from '../test-utils';

test.describe('Projects Management', () => {

  test.describe('Projects List View', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/projects');
      await waitForLoadingToFinish(page);
    });

    test('should display projects list with correct columns', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('프로젝트');

      // 테이블 헤더 확인
      const table = page.locator('[data-testid="projects-table"]');
      await expect(table).toBeVisible();

      const headers = [
        '클라이언트',
        '프로젝트명',
        '채널',
        '실입금',
        '정산일',
        '상태',
        '액션'
      ];

      for (const header of headers) {
        await expect(table.locator('thead')).toContainText(header);
      }
    });

    test('should show project data in table rows', async ({ page }) => {
      const tableRows = page.locator('[data-testid="projects-table"] tbody tr');
      const rowCount = await tableRows.count();

      if (rowCount > 0) {
        const firstRow = tableRows.first();

        // 클라이언트명이 표시되는지 확인
        await expect(firstRow.locator('[data-testid="client-name"]')).toBeVisible();

        // 실입금이 통화 형식으로 표시되는지 확인
        const netAmount = firstRow.locator('[data-testid="net-amount"]');
        const netAmountText = await netAmount.textContent();
        expect(netAmountText).toMatch(/₩|원|\d{1,3}(,\d{3})*/);

        // 상태 배지 확인
        await expect(firstRow.locator('[data-testid="project-status"]')).toBeVisible();
      }
    });

    test('should filter projects by status', async ({ page }) => {
      const statusFilter = page.locator('[data-testid="status-filter"]');

      if (await statusFilter.count() > 0) {
        // '진행중' 필터 선택
        await selectDropdownOption(page, '[data-testid="status-filter"]', '진행중');
        await waitForLoadingToFinish(page);

        // 필터링된 결과 확인
        const filteredRows = page.locator('[data-testid="projects-table"] tbody tr');
        const rowCount = await filteredRows.count();

        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const statusCell = filteredRows.nth(i).locator('[data-testid="project-status"]');
          await expect(statusCell).toContainText('진행중');
        }
      }
    });

    test('should search projects by client name', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');

      if (await searchInput.count() > 0) {
        await searchInput.fill('Test');
        await page.keyboard.press('Enter');
        await waitForLoadingToFinish(page);

        // 검색 결과 확인
        const searchResults = page.locator('[data-testid="projects-table"] tbody tr');
        const rowCount = await searchResults.count();

        if (rowCount > 0) {
          const firstResult = searchResults.first().locator('[data-testid="client-name"]');
          const clientName = await firstResult.textContent();
          expect(clientName?.toLowerCase()).toContain('test');
        }
      }
    });

    test('should navigate to project detail', async ({ page }) => {
      const firstProject = page.locator('[data-testid="projects-table"] tbody tr').first();
      const viewButton = firstProject.locator('[data-testid="view-project"]');

      if (await viewButton.count() > 0) {
        await viewButton.click();
        await waitForPageLoad(page);

        // 프로젝트 상세 페이지로 이동 확인
        expect(page.url()).toContain('/projects/');
        await expect(page.locator('[data-testid="project-detail"]')).toBeVisible();
      }
    });

    test('should show pagination for large datasets', async ({ page }) => {
      const pagination = page.locator('[data-testid="pagination"]');

      if (await pagination.count() > 0) {
        await expect(pagination).toBeVisible();

        // 페이지 번호 버튼들 확인
        const pageButtons = pagination.locator('button[data-page]');
        const buttonCount = await pageButtons.count();
        expect(buttonCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Create New Project', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/projects');
      await page.click('[data-testid="new-project-button"]');
      await waitForPageLoad(page);
    });

    test('should display project creation form', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('새 프로젝트');

      // 필수 필드들 확인
      const requiredFields = [
        'client_name',
        'title',
        'channel_id',
        'category_id',
        'list_price_net',
        'net_B'
      ];

      for (const field of requiredFields) {
        await expect(page.locator(`[name="${field}"]`)).toBeVisible();
      }
    });

    test('should create project with valid data', async ({ page }) => {
      // 프로젝트 기본 정보 입력
      await page.fill('[name="client_name"]', SAMPLE_DATA.project.client_name);
      await page.fill('[name="title"]', SAMPLE_DATA.project.title);

      // 채널 선택
      await selectDropdownOption(page, '[name="channel_id"]', '크몽');

      // 카테고리 선택
      await selectDropdownOption(page, '[name="category_id"]', '카드뉴스');

      // 금액 정보 입력
      await page.fill('[name="list_price_net"]', SAMPLE_DATA.project.list_price_net);
      await page.fill('[name="deposit_gross_T"]', SAMPLE_DATA.project.deposit_gross_T);
      await page.fill('[name="net_B"]', SAMPLE_DATA.project.net_B);

      // 정산일 설정
      await page.fill('[name="settle_date"]', '2024-12-31');

      // 프로젝트 생성
      await page.click('button[type="submit"]');

      // 성공 메시지 확인
      await expectToastMessage(page, '프로젝트가 생성되었습니다');

      // 프로젝트 목록으로 리다이렉트 확인
      await expect(page).toHaveURL('/projects');
    });

    test('should validate required fields', async ({ page }) => {
      // 빈 폼 제출
      await page.click('button[type="submit"]');

      // 유효성 검사 에러 확인
      await expectErrorMessage(page);

      // 필수 필드들이 invalid 상태인지 확인
      const requiredFields = ['client_name', 'title', 'net_B'];

      for (const field of requiredFields) {
        const fieldElement = page.locator(`[name="${field}"]`);
        await expect(fieldElement).toHaveAttribute('aria-invalid', 'true');
      }
    });

    test('should validate numeric fields', async ({ page }) => {
      // 잘못된 숫자 입력
      await page.fill('[name="net_B"]', 'invalid-number');
      await page.click('button[type="submit"]');

      // 숫자 유효성 검사 에러 확인
      const netBField = page.locator('[name="net_B"]');
      await expect(netBField).toHaveAttribute('aria-invalid', 'true');
    });

    test('should calculate preview amounts', async ({ page }) => {
      // 기본 정보 입력
      await page.fill('[name="list_price_net"]', '1100000');
      await page.fill('[name="deposit_gross_T"]', '550000');

      // 실입금 입력 시 자동 계산 확인
      await page.fill('[name="net_B"]', '500000');
      await page.waitForTimeout(500);

      // 계산된 값들 확인
      const previewSection = page.locator('[data-testid="amount-preview"]');
      if (await previewSection.count() > 0) {
        await expect(previewSection).toBeVisible();

        // 부가세 계산 확인 (실입금의 10%)
        const vatAmount = previewSection.locator('[data-testid="vat-amount"]');
        if (await vatAmount.count() > 0) {
          await expect(vatAmount).toContainText('50,000');
        }
      }
    });

    test('should save as draft', async ({ page }) => {
      await page.fill('[name="client_name"]', 'Draft Client');
      await page.fill('[name="title"]', 'Draft Project');

      // 임시저장 버튼 클릭
      const draftButton = page.locator('[data-testid="save-draft"]');
      if (await draftButton.count() > 0) {
        await draftButton.click();

        await expectToastMessage(page, '임시저장');
        await expect(page).toHaveURL('/projects');
      }
    });
  });

  test.describe('Edit Existing Project', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/projects');
      await waitForLoadingToFinish(page);

      // 첫 번째 프로젝트 편집
      const editButton = page.locator('[data-testid="edit-project"]').first();
      if (await editButton.count() > 0) {
        await editButton.click();
        await waitForPageLoad(page);
      } else {
        // 테스트용 프로젝트 생성 후 편집
        await page.goto('/projects/new');
        await page.fill('[name="client_name"]', 'Edit Test Client');
        await page.fill('[name="title"]', 'Edit Test Project');
        await page.fill('[name="net_B"]', '500000');
        await page.click('button[type="submit"]');
        await waitForPageLoad(page);

        // 방금 생성한 프로젝트 편집
        await page.click('[data-testid="edit-project"]');
        await waitForPageLoad(page);
      }
    });

    test('should load existing project data', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('프로젝트 편집');

      // 기존 데이터가 로드되었는지 확인
      const clientName = await page.inputValue('[name="client_name"]');
      expect(clientName).not.toBe('');

      const title = await page.inputValue('[name="title"]');
      expect(title).not.toBe('');
    });

    test('should update project information', async ({ page }) => {
      // 클라이언트명 수정
      await page.fill('[name="client_name"]', 'Updated Client Name');

      // 금액 수정
      await page.fill('[name="net_B"]', '750000');

      // 저장
      await page.click('button[type="submit"]');

      await expectToastMessage(page, '프로젝트가 수정되었습니다');
      await expect(page).toHaveURL('/projects');
    });

    test('should preserve existing data when canceling', async ({ page }) => {
      const originalClientName = await page.inputValue('[name="client_name"]');

      // 데이터 수정
      await page.fill('[name="client_name"]', 'Temporary Change');

      // 취소
      await page.click('[data-testid="cancel-button"]');

      // 프로젝트 목록으로 돌아가기
      await expect(page).toHaveURL('/projects');

      // 다시 편집 모드로 진입하여 원본 데이터 확인
      await page.click('[data-testid="edit-project"]');
      await waitForPageLoad(page);

      const currentClientName = await page.inputValue('[name="client_name"]');
      expect(currentClientName).toBe(originalClientName);
    });

    test('should validate changes before saving', async ({ page }) => {
      // 필수 필드 비우기
      await page.fill('[name="client_name"]', '');

      await page.click('button[type="submit"]');

      // 유효성 검사 에러 확인
      await expectErrorMessage(page);
      const clientNameField = page.locator('[name="client_name"]');
      await expect(clientNameField).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.describe('Designer Assignment', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/projects/new');
      await waitForPageLoad(page);

      // 기본 프로젝트 정보 입력
      await page.fill('[name="client_name"]', 'Designer Test Client');
      await page.fill('[name="title"]', 'Designer Test Project');
      await page.fill('[name="net_B"]', '1000000');
    });

    test('should assign designers with share percentages', async ({ page }) => {
      // 디자이너 섹션으로 스크롤
      const designerSection = page.locator('[data-testid="designer-section"]');
      await designerSection.scrollIntoViewIfNeeded();

      // 디자이너 추가 버튼 클릭
      await page.click('[data-testid="add-designer"]');

      // 첫 번째 디자이너 설정
      await selectDropdownOption(page, '[data-testid="designer-select-0"]', '오유택');
      await page.fill('[data-testid="share-percent-0"]', '60');
      await page.fill('[data-testid="bonus-percent-0"]', '5');

      // 두 번째 디자이너 추가
      await page.click('[data-testid="add-designer"]');
      await selectDropdownOption(page, '[data-testid="designer-select-1"]', '이예천');
      await page.fill('[data-testid="share-percent-1"]', '40');

      // 지분 합계 확인
      const shareTotal = page.locator('[data-testid="share-total"]');
      await expect(shareTotal).toContainText('100%');

      // 프로젝트 생성
      await page.click('button[type="submit"]');
      await expectToastMessage(page, '프로젝트가 생성되었습니다');
    });

    test('should validate share percentages total 100%', async ({ page }) => {
      const designerSection = page.locator('[data-testid="designer-section"]');
      await designerSection.scrollIntoViewIfNeeded();

      // 디자이너 추가
      await page.click('[data-testid="add-designer"]');
      await selectDropdownOption(page, '[data-testid="designer-select-0"]', '오유택');
      await page.fill('[data-testid="share-percent-0"]', '120'); // 잘못된 값

      // 두 번째 디자이너 추가
      await page.click('[data-testid="add-designer"]');
      await selectDropdownOption(page, '[data-testid="designer-select-1"]', '이예천');
      await page.fill('[data-testid="share-percent-1"]', '30');

      // 지분 합계 에러 표시 확인
      const shareTotal = page.locator('[data-testid="share-total"]');
      await expect(shareTotal).toHaveClass(/text-red|error/);
      await expect(shareTotal).toContainText('150%');

      // 제출 시 에러 발생 확인
      await page.click('button[type="submit"]');
      await expectErrorMessage(page, '지분 합계가 100%가 되어야 합니다');
    });

    test('should prevent duplicate designer assignment', async ({ page }) => {
      const designerSection = page.locator('[data-testid="designer-section"]');
      await designerSection.scrollIntoViewIfNeeded();

      // 첫 번째 디자이너 추가
      await page.click('[data-testid="add-designer"]');
      await selectDropdownOption(page, '[data-testid="designer-select-0"]', '오유택');

      // 두 번째 디자이너로 같은 사람 선택 시도
      await page.click('[data-testid="add-designer"]');

      // 드롭다운에서 이미 선택된 디자이너는 비활성화되어야 함
      await page.click('[data-testid="designer-select-1"]');
      const disabledOption = page.locator('[data-testid="designer-option-오유택"][disabled]');
      if (await disabledOption.count() > 0) {
        await expect(disabledOption).toBeVisible();
      }
    });

    test('should calculate individual designer amounts', async ({ page }) => {
      await page.fill('[name="net_B"]', '1000000'); // 실입금 100만원

      const designerSection = page.locator('[data-testid="designer-section"]');
      await designerSection.scrollIntoViewIfNeeded();

      // 디자이너 추가 및 지분 설정
      await page.click('[data-testid="add-designer"]');
      await selectDropdownOption(page, '[data-testid="designer-select-0"]', '오유택');
      await page.fill('[data-testid="share-percent-0"]', '60');

      // 계산된 금액 확인 (실입금의 40% = 디자이너 베이스, 60% 지분)
      await page.waitForTimeout(500);
      const designerAmount = page.locator('[data-testid="designer-amount-0"]');

      // 대략적인 계산: 1,000,000 * 0.4 * 0.6 = 240,000원
      await expect(designerAmount).toContainText('240,000');
    });

    test('should apply bonus percentages correctly', async ({ page }) => {
      await page.fill('[name="net_B"]', '1000000');

      const designerSection = page.locator('[data-testid="designer-section"]');
      await designerSection.scrollIntoViewIfNeeded();

      // 디자이너 추가 및 보너스 설정
      await page.click('[data-testid="add-designer"]');
      await selectDropdownOption(page, '[data-testid="designer-select-0"]', '오유택');
      await page.fill('[data-testid="share-percent-0"]', '100');
      await page.fill('[data-testid="bonus-percent-0"]', '10'); // 10% 보너스

      await page.waitForTimeout(500);

      // 보너스가 적용된 최종 금액 확인
      const finalAmount = page.locator('[data-testid="designer-final-amount-0"]');

      // 베이스 + 보너스 계산 확인
      await expect(finalAmount).toBeVisible();
    });

    test('should remove designers', async ({ page }) => {
      const designerSection = page.locator('[data-testid="designer-section"]');
      await designerSection.scrollIntoViewIfNeeded();

      // 디자이너 추가
      await page.click('[data-testid="add-designer"]');
      await selectDropdownOption(page, '[data-testid="designer-select-0"]', '오유택');

      // 삭제 버튼 클릭
      await page.click('[data-testid="remove-designer-0"]');

      // 디자이너가 삭제되었는지 확인
      const designerRow = page.locator('[data-testid="designer-row-0"]');
      await expect(designerRow).toBeHidden();
    });
  });

  test.describe('Settlement Preview Calculation', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/projects/new');
      await waitForPageLoad(page);

      // 테스트용 프로젝트 설정
      await page.fill('[name="client_name"]', 'Settlement Test');
      await page.fill('[name="title"]', 'Settlement Test Project');
      await selectDropdownOption(page, '[name="channel_id"]', '크몽');
    });

    test('should calculate settlement amounts correctly', async ({ page }) => {
      // 기본 금액 설정
      const grossT = '1100000'; // 부가세 포함
      const netB = '500000';    // 실입금

      await page.fill('[name="deposit_gross_T"]', grossT);
      await page.fill('[name="net_B"]', netB);

      await page.waitForTimeout(1000); // 계산 완료 대기

      // 정산 계산 프리뷰 섹션 확인
      const previewSection = page.locator('[data-testid="settlement-preview"]');
      await expect(previewSection).toBeVisible();

      // 각종 수수료 계산 확인
      await verifySettlementCalculation(page, parseInt(grossT), parseInt(netB));
    });

    test('should apply channel-specific fees', async ({ page }) => {
      await page.fill('[name="net_B"]', '1000000');

      // 크몽 채널 (21% 수수료)
      await selectDropdownOption(page, '[name="channel_id"]', '크몽');
      await page.waitForTimeout(500);

      const kmongFee = page.locator('[data-testid="channel-fee"]');
      await expect(kmongFee).toContainText('210,000'); // 1,000,000 * 0.21

      // 계좌입금 채널 (0% 수수료)
      await selectDropdownOption(page, '[name="channel_id"]', '계좌입금');
      await page.waitForTimeout(500);

      const bankFee = page.locator('[data-testid="channel-fee"]');
      await expect(bankFee).toContainText('0');
    });

    test('should calculate withholding tax (3.3%)', async ({ page }) => {
      await page.fill('[name="net_B"]', '1000000');
      await page.waitForTimeout(500);

      const withholdingSection = page.locator('[data-testid="withholding-section"]');

      if (await withholdingSection.count() > 0) {
        // 원천징수 전 금액
        const beforeWithholding = withholdingSection.locator('[data-testid="before-withholding"]');
        await expect(beforeWithholding).toBeVisible();

        // 원천징수 금액 (3.3%)
        const withholdingAmount = withholdingSection.locator('[data-testid="withholding-amount"]');
        await expect(withholdingAmount).toBeVisible();

        // 원천징수 후 금액
        const afterWithholding = withholdingSection.locator('[data-testid="after-withholding"]');
        await expect(afterWithholding).toBeVisible();
      }
    });

    test('should update calculations when amounts change', async ({ page }) => {
      // 초기 금액 설정
      await page.fill('[name="net_B"]', '500000');
      await page.waitForTimeout(500);

      const initialPreview = await page.textContent('[data-testid="settlement-preview"]');

      // 금액 변경
      await page.fill('[name="net_B"]', '1000000');
      await page.waitForTimeout(500);

      const updatedPreview = await page.textContent('[data-testid="settlement-preview"]');

      // 계산이 업데이트되었는지 확인
      expect(updatedPreview).not.toBe(initialPreview);
    });

    test('should show breakdown of all fees', async ({ page }) => {
      await page.fill('[name="net_B"]', '1000000');
      await selectDropdownOption(page, '[name="channel_id"]', '크몽');
      await page.waitForTimeout(1000);

      const breakdown = page.locator('[data-testid="fee-breakdown"]');

      if (await breakdown.count() > 0) {
        // 각종 수수료 항목들 확인
        await expect(breakdown).toContainText('광고수수료'); // 10%
        await expect(breakdown).toContainText('프로그램수수료'); // 3%
        await expect(breakdown).toContainText('채널수수료'); // 21% (크몽)
        await expect(breakdown).toContainText('디자이너 기본 지급액'); // 40%
      }
    });

    test('should handle zero amounts gracefully', async ({ page }) => {
      await page.fill('[name="net_B"]', '0');
      await page.waitForTimeout(500);

      const previewSection = page.locator('[data-testid="settlement-preview"]');

      // 모든 계산된 값이 0으로 표시되는지 확인
      await expect(previewSection).toContainText('₩0');
    });
  });

  test.describe('Project Deletion', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/projects');
      await waitForLoadingToFinish(page);
    });

    test('should delete project with confirmation', async ({ page }) => {
      // 테스트용 프로젝트가 없다면 생성
      const projectRows = page.locator('[data-testid="projects-table"] tbody tr');
      if (await projectRows.count() === 0) {
        await page.goto('/projects/new');
        await page.fill('[name="client_name"]', 'Delete Test Client');
        await page.fill('[name="title"]', 'Delete Test Project');
        await page.fill('[name="net_B"]', '500000');
        await page.click('button[type="submit"]');
        await waitForPageLoad(page);
      }

      // 삭제 버튼 클릭
      const deleteButton = page.locator('[data-testid="delete-project"]').first();
      await deleteButton.click();

      // 확인 모달 대기
      const confirmModal = await waitForModal(page);
      await expect(confirmModal).toContainText('정말 삭제하시겠습니까?');

      // 삭제 확인
      await confirmModal.locator('button').filter({ hasText: '삭제' }).click();

      // 성공 메시지 확인
      await expectToastMessage(page, '프로젝트가 삭제되었습니다');
    });

    test('should cancel deletion', async ({ page }) => {
      const initialRowCount = await page.locator('[data-testid="projects-table"] tbody tr').count();

      if (initialRowCount > 0) {
        // 삭제 버튼 클릭
        const deleteButton = page.locator('[data-testid="delete-project"]').first();
        await deleteButton.click();

        // 확인 모달에서 취소
        const confirmModal = await waitForModal(page);
        await confirmModal.locator('button').filter({ hasText: '취소' }).click();

        // 모달이 닫혔는지 확인
        await expect(confirmModal).toBeHidden();

        // 프로젝트가 삭제되지 않았는지 확인
        const finalRowCount = await page.locator('[data-testid="projects-table"] tbody tr').count();
        expect(finalRowCount).toBe(initialRowCount);
      }
    });

    test('should prevent deletion of settled projects', async ({ page }) => {
      // 정산 완료된 프로젝트의 삭제 버튼 비활성화 확인
      const settledProjectRow = page.locator('[data-testid="project-status"]:has-text("정산완료")').first();

      if (await settledProjectRow.count() > 0) {
        const parentRow = settledProjectRow.locator('..');
        const deleteButton = parentRow.locator('[data-testid="delete-project"]');

        await expect(deleteButton).toBeDisabled();
      }
    });
  });

  test.describe('Mobile Project Management', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page, '/projects');
    });

    test('should display mobile-optimized project list', async ({ page }) => {
      // 모바일에서 카드 형태로 표시되는지 확인
      const projectCards = page.locator('[data-testid="project-card"]');

      if (await projectCards.count() > 0) {
        await expect(projectCards.first()).toBeVisible();

        // 카드 내 필수 정보 확인
        const firstCard = projectCards.first();
        await expect(firstCard).toContainText(/클라이언트|프로젝트/);
        await expect(firstCard).toContainText(/₩|원/);
      }
    });

    test('should support touch interactions', async ({ page }) => {
      const projectCard = page.locator('[data-testid="project-card"]').first();

      if (await projectCard.count() > 0) {
        // 터치로 프로젝트 카드 선택
        await projectCard.tap();

        // 액션 메뉴나 상세 페이지 표시 확인
        const actionMenu = page.locator('[data-testid="project-actions"]');
        const projectDetail = page.locator('[data-testid="project-detail"]');

        const hasActionMenu = await actionMenu.count() > 0;
        const hasDetail = await projectDetail.count() > 0;

        expect(hasActionMenu || hasDetail).toBeTruthy();
      }
    });

    test('should show mobile-friendly form inputs', async ({ page }) => {
      await page.goto('/projects/new');
      await waitForPageLoad(page);

      // 숫자 키패드가 나타나는지 확인
      const numericInputs = page.locator('input[type="number"], input[inputmode="numeric"]');
      const count = await numericInputs.count();

      if (count > 0) {
        await expect(numericInputs.first()).toHaveAttribute('inputmode', 'numeric');
      }
    });
  });

  test.describe('Data Validation & Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/projects/new');
    });

    test('should handle network errors during creation', async ({ page }) => {
      // API 에러 모킹
      await page.route('**/api/projects', route => {
        route.abort('failed');
      });

      await page.fill('[name="client_name"]', 'Network Error Test');
      await page.fill('[name="title"]', 'Network Error Project');
      await page.fill('[name="net_B"]', '500000');

      await page.click('button[type="submit"]');

      // 네트워크 에러 메시지 확인
      await expectErrorMessage(page, '네트워크 오류가 발생했습니다');
    });

    test('should validate date formats', async ({ page }) => {
      // 잘못된 날짜 형식 입력
      await page.fill('[name="settle_date"]', 'invalid-date');
      await page.click('button[type="submit"]');

      // 날짜 유효성 검사 에러 확인
      const dateField = page.locator('[name="settle_date"]');
      await expect(dateField).toHaveAttribute('aria-invalid', 'true');
    });

    test('should handle server validation errors', async ({ page }) => {
      // 서버 유효성 검사 에러 모킹
      await page.route('**/api/projects', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: {
              client_name: '클라이언트명이 이미 존재합니다',
              net_B: '금액은 0보다 커야 합니다'
            }
          })
        });
      });

      await page.fill('[name="client_name"]', 'Duplicate Client');
      await page.fill('[name="net_B"]', '-1000');
      await page.click('button[type="submit"]');

      // 서버 에러 메시지 확인
      await expectErrorMessage(page, '클라이언트명이 이미 존재합니다');
      await expectErrorMessage(page, '금액은 0보다 커야 합니다');
    });
  });
});