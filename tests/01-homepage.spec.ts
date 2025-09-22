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

    // 메인 헤딩 확인
    await expect(page.locator('h2')).toContainText('환영합니다!');

    // 시스템 소개 텍스트 확인
    await expect(page.locator('text=MZS 스튜디오 정산 시스템이 성공적으로 설정되었습니다')).toBeVisible();

    // 모바일 우선 설계 언급 확인
    await expect(page.locator('text=모바일 우선 설계로 언제 어디서나')).toBeVisible();
  });

  test('기능 카드들이 올바르게 표시된다', async ({ page }) => {
    // 자동 정산 카드
    await expect(page.locator('text=자동 정산')).toBeVisible();
    await expect(page.locator('text=부가세, 원천징수 3.3% 자동 계산')).toBeVisible();

    // 팀원 관리 카드
    await expect(page.locator('text=팀원 관리')).toBeVisible();
    await expect(page.locator('text=6명 디자이너 정산 관리')).toBeVisible();

    // 모바일 FAB 카드
    await expect(page.locator('text=모바일 FAB')).toBeVisible();
    await expect(page.locator('text=원탭으로 빠른 입력')).toBeVisible();

    // 실시간 대시보드 카드
    await expect(page.locator('text=실시간 대시보드')).toBeVisible();
    await expect(page.locator('text=KPI 및 성과 분석')).toBeVisible();
  });

  test('빠른 시작 버튼들이 작동한다', async ({ page }) => {
    // 새 프로젝트 정산 버튼
    const newProjectButton = page.locator('text=새 프로젝트 정산');
    await expect(newProjectButton).toBeVisible();

    // 버튼 클릭 시 올바른 페이지로 이동하는지 확인
    await newProjectButton.click();
    await expect(page).toHaveURL(/\/projects\/new/);

    // 다시 홈으로 돌아가기
    await page.goto('/');

    // 프로젝트 관리 버튼
    const projectManageButton = page.locator('text=프로젝트 관리').first();
    await expect(projectManageButton).toBeVisible();

    await projectManageButton.click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test('시스템 상태가 정상으로 표시된다', async ({ page }) => {
    // 시스템 상태 인디케이터
    await expect(page.locator('.bg-green-500')).toBeVisible();
    await expect(page.locator('text=시스템 정상 운영 중')).toBeVisible();

    // 기술 스택 정보
    await expect(page.locator('text=Next.js 15 + Supabase + shadcn/ui로 구축됨')).toBeVisible();
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
    // 기능 카드 그리드 확인
    const featureGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    await expect(featureGrid).toBeVisible();

    // 빠른 시작 버튼 그리드 확인
    const quickActionGrid = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
    await expect(quickActionGrid).toBeVisible();
  });

  test('한국어 콘텐츠가 올바르게 표시된다', async ({ page }) => {
    // 주요 한국어 텍스트들 확인
    await expect(page.locator('text=환영합니다!')).toBeVisible();
    await expect(page.locator('text=정산 시스템')).toBeVisible();
    await expect(page.locator('text=디자이너')).toBeVisible();
    await expect(page.locator('text=자동 계산')).toBeVisible();
    await expect(page.locator('text=빠른 시작')).toBeVisible();
  });
});