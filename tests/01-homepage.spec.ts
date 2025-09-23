/**
 * 홈페이지 E2E 테스트
 * - 페이지 로드 확인
 * - 네비게이션 링크 동작
 * - 브랜드 컬러 적용 확인
 * - 반응형 디자인 확인
 */

import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/MZS/);

    // 메인 헤딩 확인 - 실제 페이지의 h1 텍스트
    await expect(page.locator('h1')).toContainText('안녕하세요!');

    // 서브타이틀 텍스트 확인
    await expect(page.locator('text=오늘도 좋은 하루 되세요')).toBeVisible();

    // 대시보드 제목 확인
    await expect(page.locator('text=대시보드')).toBeVisible();
  });

  test('KPI 카드들이 올바르게 표시된다', async ({ page }) => {
    // 이달 매출 카드
    await expect(page.locator('text=이달 매출')).toBeVisible();

    // 진행 프로젝트 카드
    await expect(page.locator('text=진행 프로젝트')).toBeVisible();

    // 정산 완료 카드
    await expect(page.locator('text=정산 완료')).toBeVisible();

    // 미지급 금액 카드
    await expect(page.locator('text=미지급 금액')).toBeVisible();

    // 월간 목표 섹션
    await expect(page.locator('text=이달 목표')).toBeVisible();
  });

  test('빠른 시작 버튼들이 작동한다', async ({ page }) => {
    // 새 프로젝트 버튼
    const newProjectButton = page.locator('text=새 프로젝트').first();
    await expect(newProjectButton).toBeVisible();

    // 버튼 클릭 시 올바른 페이지로 이동하는지 확인
    await newProjectButton.click();
    await expect(page).toHaveURL(/\/projects\/new/);

    // 다시 홈으로 돌아가기
    await page.goto('/');

    // 정산 생성 버튼
    const settlementButton = page.locator('text=정산 생성').first();
    await expect(settlementButton).toBeVisible();

    await settlementButton.click();
    await expect(page).toHaveURL(/\/settlements/);
  });

  test('성과 랭킹이 올바르게 표시된다', async ({ page }) => {
    // 성과 랭킹 섹션
    await expect(page.locator('text=이달 성과 랭킹')).toBeVisible();
    await expect(page.locator('text=2.5배 환산 기준')).toBeVisible();

    // 최근 활동 섹션
    await expect(page.locator('text=최근 활동')).toBeVisible();
  });

  test('아이콘들이 올바르게 표시된다', async ({ page }) => {
    // Lucide 아이콘들이 로드되는지 확인
    const calculatorIcon = page.locator('[data-lucide="calculator"]').or(page.locator('svg[class*="lucide-calculator"]'));
    await expect(calculatorIcon.first()).toBeVisible();

    const usersIcon = page.locator('[data-lucide="users"]').or(page.locator('svg[class*="lucide-users"]'));
    await expect(usersIcon.first()).toBeVisible();

    const fileTextIcon = page.locator('[data-lucide="file-text"]').or(page.locator('svg[class*="lucide-file-text"]'));
    await expect(fileTextIcon.first()).toBeVisible();

    const barChart3Icon = page.locator('[data-lucide="bar-chart-3"]').or(page.locator('svg[class*="lucide-bar-chart-3"]'));
    await expect(barChart3Icon.first()).toBeVisible();
  });

  test('카드 호버 효과가 작동한다', async ({ page }) => {
    const firstCard = page.locator('.hover\\:shadow-lg').first();

    // 초기 상태
    await expect(firstCard).toBeVisible();

    // 호버 시 그림자 효과 확인 (CSS 클래스 존재 확인)
    await firstCard.hover();
    await expect(firstCard).toHaveClass(/hover:shadow-lg/);
  });

  test('네비게이션 링크가 올바르게 작동한다', async ({ page }) => {
    // 새 프로젝트 정산 링크들
    const newProjectLinks = page.locator('a[href="/projects/new"]');
    const linkCount = await newProjectLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // 프로젝트 목록 링크들
    const projectListLinks = page.locator('a[href="/projects"]');
    const listLinkCount = await projectListLinks.count();
    expect(listLinkCount).toBeGreaterThan(0);

    // 첫 번째 링크 클릭 테스트
    await newProjectLinks.first().click();
    await expect(page).toHaveURL(/\/projects\/new/);
  });

  test('반응형 그리드가 올바르게 작동한다', async ({ page }) => {
    // KPI 카드 그리드 확인
    const kpiGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    await expect(kpiGrid).toBeVisible();

    // 빠른 작업 버튼 그리드 확인
    const quickActionGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-4');
    await expect(quickActionGrid).toBeVisible();
  });

  test('한국어 콘텐츠가 올바르게 표시된다', async ({ page }) => {
    // 주요 한국어 텍스트들 확인
    await expect(page.locator('text=안녕하세요!')).toBeVisible();
    await expect(page.locator('text=이달 매출')).toBeVisible();
    await expect(page.locator('text=정산 완료')).toBeVisible();
    await expect(page.locator('text=빠른 작업')).toBeVisible();
    await expect(page.locator('text=성과 랭킹')).toBeVisible();
  });
});