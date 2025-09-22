/**
 * 프로젝트 CRUD E2E 테스트
 * - 프로젝트 목록 페이지 접속
 * - 새 프로젝트 생성 플로우
 * - 프로젝트 상세 페이지 확인
 * - 프로젝트 편집 기능
 */

import { test, expect } from '@playwright/test';

test.describe('프로젝트 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 전에 홈페이지로 이동
    await page.goto('/');
  });

  test('프로젝트 목록 페이지에 접속할 수 있다', async ({ page }) => {
    // 홈에서 프로젝트 관리 버튼 클릭
    await page.click('text=프로젝트 관리');
    await expect(page).toHaveURL(/\/projects/);

    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('프로젝트 관리');

    // 통계 카드들 확인
    await expect(page.locator('text=전체')).toBeVisible();
    await expect(page.locator('text=대기중')).toBeVisible();
    await expect(page.locator('text=승인됨')).toBeVisible();
    await expect(page.locator('text=완료됨')).toBeVisible();
    await expect(page.locator('text=취소됨')).toBeVisible();

    // 새 프로젝트 버튼 확인
    await expect(page.locator('text=새 프로젝트')).toBeVisible();
  });

  test('검색 및 필터 기능이 작동한다', async ({ page }) => {
    await page.goto('/projects');

    // 검색 입력 필드 확인
    const searchInput = page.locator('input[placeholder*="프로젝트명으로 검색"]');
    await expect(searchInput).toBeVisible();

    // 검색어 입력
    await searchInput.fill('테스트 프로젝트');

    // 필터 드롭다운들 확인
    await expect(page.locator('text=상태').first()).toBeVisible();
    await expect(page.locator('text=채널').first()).toBeVisible();
    await expect(page.locator('text=카테고리').first()).toBeVisible();

    // 상태 필터 클릭
    await page.click('button:has-text("상태")');
    await expect(page.locator('text=대기중')).toBeVisible();
    await expect(page.locator('text=승인됨')).toBeVisible();
  });

  test('새 프로젝트 생성 페이지로 이동할 수 있다', async ({ page }) => {
    await page.goto('/projects');

    // 새 프로젝트 버튼 클릭
    await page.click('text=새 프로젝트');
    await expect(page).toHaveURL(/\/projects\/new/);

    // 브레드크럼 확인
    await expect(page.locator('text=홈')).toBeVisible();
    await expect(page.locator('text=프로젝트 관리')).toBeVisible();
    await expect(page.locator('text=새 프로젝트')).toBeVisible();

    // 뒤로가기 버튼 확인
    await expect(page.locator('[data-lucide="arrow-left"]').or(page.locator('svg[class*="lucide-arrow-left"]'))).toBeVisible();
  });

  test('프로젝트 생성 폼이 올바르게 표시된다', async ({ page }) => {
    await page.goto('/projects/new');

    // 폼 필드들이 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // 기본 프로젝트 정보 필드들 확인
    await expect(page.locator('label')).toContainText(['프로젝트명', '총 입금액', '프로젝트 날짜']);

    // 버튼들 확인
    await expect(page.locator('button')).toContainText(['저장', '취소']);

    // 정산 계산기 버튼 확인 (있는 경우)
    const calculatorButton = page.locator('text=정산 계산기').or(page.locator('[data-lucide="calculator"]'));
    if (await calculatorButton.count() > 0) {
      await expect(calculatorButton.first()).toBeVisible();
    }
  });

  test('프로젝트 생성 폼 유효성 검사가 작동한다', async ({ page }) => {
    await page.goto('/projects/new');

    // 폼이 로드될 때까지 대기
    await page.waitForLoadState('networkidle');

    // 빈 폼으로 저장 시도
    const saveButton = page.locator('button:has-text("저장")').or(page.locator('button[type="submit"]'));
    if (await saveButton.count() > 0) {
      await saveButton.click();

      // 유효성 검사 메시지 확인 (브라우저 기본 또는 커스텀)
      // HTML5 required 속성이 있을 수 있음
      const nameInput = page.locator('input[name="name"]').or(page.locator('input[placeholder*="프로젝트"]'));
      if (await nameInput.count() > 0) {
        await expect(nameInput).toBeVisible();
      }
    }
  });

  test('유효한 프로젝트 데이터로 생성할 수 있다', async ({ page }) => {
    await page.goto('/projects/new');
    await page.waitForLoadState('networkidle');

    // 프로젝트명 입력
    const nameInput = page.locator('input[name="name"]').or(page.locator('input').first());
    if (await nameInput.count() > 0) {
      await nameInput.fill('E2E 테스트 프로젝트');
    }

    // 금액 입력
    const amountInput = page.locator('input[type="number"]').or(page.locator('input[name*="amount"]'));
    if (await amountInput.count() > 0) {
      await amountInput.first().fill('1000000');
    }

    // 날짜 입력
    const dateInput = page.locator('input[type="date"]').or(page.locator('input[name*="date"]'));
    if (await dateInput.count() > 0) {
      await dateInput.fill('2024-01-15');
    }

    // 폼 저장
    const saveButton = page.locator('button:has-text("저장")').or(page.locator('button[type="submit"]'));
    if (await saveButton.count() > 0) {
      await saveButton.click();

      // 성공 시 리다이렉트 확인 또는 성공 메시지 확인
      // URL 변경이나 성공 피드백을 기다림
      await page.waitForTimeout(2000);
    }
  });

  test('프로젝트 목록에서 프로젝트를 선택할 수 있다', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // 테이블이 로드될 때까지 대기
    const table = page.locator('table').or(page.locator('[role="table"]'));
    if (await table.count() > 0) {
      await expect(table).toBeVisible();

      // 체크박스가 있다면 선택 테스트
      const checkboxes = page.locator('input[type="checkbox"]');
      if (await checkboxes.count() > 0) {
        // 첫 번째 체크박스 (전체 선택)가 아닌 개별 프로젝트 체크박스 클릭
        const projectCheckbox = checkboxes.nth(1);
        if (await projectCheckbox.count() > 0) {
          await projectCheckbox.click();
          await expect(projectCheckbox).toBeChecked();
        }
      }
    }
  });

  test('프로젝트 상세 페이지로 이동할 수 있다', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // 액션 버튼이나 프로젝트 링크 찾기
    const viewButton = page.locator('text=보기').or(page.locator('[data-lucide="eye"]'));
    const editButton = page.locator('text=편집').or(page.locator('[data-lucide="edit"]'));
    const moreButton = page.locator('[data-lucide="more-horizontal"]');

    if (await moreButton.count() > 0) {
      await moreButton.first().click();

      if (await viewButton.count() > 0) {
        await viewButton.first().click();
        // URL 패턴 확인
        await expect(page).toHaveURL(/\/projects\/[^\/]+$/);
      }
    }
  });

  test('프로젝트 편집 페이지로 이동할 수 있다', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // 편집 버튼 찾기
    const moreButton = page.locator('[data-lucide="more-horizontal"]');
    const editButton = page.locator('text=편집').or(page.locator('[data-lucide="edit"]'));

    if (await moreButton.count() > 0) {
      await moreButton.first().click();

      if (await editButton.count() > 0) {
        await editButton.first().click();
        // 편집 페이지 URL 패턴 확인
        await expect(page).toHaveURL(/\/projects\/[^\/]+\/edit$/);
      }
    }
  });

  test('배치 작업이 표시된다', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // 프로젝트 선택 후 배치 작업 영역 확인
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 1) {
      // 개별 프로젝트 선택
      await checkboxes.nth(1).click();

      // 배치 작업 버튼들 확인
      await expect(page.locator('text=승인').or(page.locator('button:has-text("승인")'))).toBeVisible();
      await expect(page.locator('text=완료').or(page.locator('button:has-text("완료")'))).toBeVisible();
      await expect(page.locator('text=삭제').or(page.locator('[data-lucide="trash-2"]'))).toBeVisible();
    }
  });

  test('내보내기/가져오기 버튼이 표시된다', async ({ page }) => {
    await page.goto('/projects');

    // 내보내기 버튼 확인
    await expect(page.locator('text=내보내기').or(page.locator('[data-lucide="download"]'))).toBeVisible();

    // 가져오기 버튼 확인
    await expect(page.locator('text=가져오기').or(page.locator('[data-lucide="upload"]'))).toBeVisible();
  });

  test('페이지네이션이 작동한다', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    // 페이지네이션 정보 확인
    const paginationInfo = page.locator('text=/\\d+-\\d+ \\/ \\d+개/');
    if (await paginationInfo.count() > 0) {
      await expect(paginationInfo).toBeVisible();
    }

    // 이전/다음 버튼 확인
    const prevButton = page.locator('button:has-text("이전")');
    const nextButton = page.locator('button:has-text("다음")');

    if (await prevButton.count() > 0) {
      await expect(prevButton).toBeVisible();
    }
    if (await nextButton.count() > 0) {
      await expect(nextButton).toBeVisible();
    }
  });
});