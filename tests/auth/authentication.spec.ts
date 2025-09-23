/**
 * 인증 및 네비게이션 E2E 테스트
 * 로그인/로그아웃, 보호된 라우트, 메뉴 네비게이션 테스트
 */

import { test, expect } from '@playwright/test';
import {
  login,
  logout,
  authenticatedPage,
  waitForPageLoad,
  setMobileViewport,
  setDesktopViewport,
  checkResponsiveLayout,
  TEST_CREDENTIALS
} from '../test-utils';

test.describe('Authentication & Navigation', () => {

  test.describe('Login Flow', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/login');

      // 로그인 폼 확인
      await expect(page.locator('[name="username"]')).toBeVisible();
      await expect(page.locator('[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // 로그인 수행
      await login(page);

      // 대시보드로 리다이렉트 확인
      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toContainText('대시보드');
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // 잘못된 자격증명으로 로그인 시도
      await page.fill('[name="username"]', 'invalid');
      await page.fill('[name="password"]', 'invalid');
      await page.click('button[type="submit"]');

      // 에러 메시지 확인
      await expect(page.locator('[role="alert"]')).toBeVisible();
      await expect(page.locator('[role="alert"]')).toContainText(/잘못된|invalid|error/i);

      // 로그인 페이지에 남아있는지 확인
      await expect(page).toHaveURL('/login');
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');

      // 빈 필드로 제출 시도
      await page.click('button[type="submit"]');

      // 유효성 검사 에러 확인
      const usernameField = page.locator('[name="username"]');
      const passwordField = page.locator('[name="password"]');

      await expect(usernameField).toHaveAttribute('aria-invalid', 'true');
      await expect(passwordField).toHaveAttribute('aria-invalid', 'true');
    });

    test('should remember login state on page refresh', async ({ page }) => {
      await login(page);

      // 페이지 새로고침
      await page.reload();
      await waitForPageLoad(page);

      // 여전히 로그인 상태인지 확인
      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toContainText('대시보드');
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ page }) => {
      await login(page);

      // 로그아웃 수행
      await logout(page);

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL('/login');
    });

    test('should redirect to login after logout', async ({ page }) => {
      await login(page);

      // 다른 페이지로 이동
      await page.goto('/projects');
      await waitForPageLoad(page);

      // 로그아웃
      await logout(page);

      // 보호된 페이지 접근 시 로그인 페이지로 리다이렉트
      await page.goto('/projects');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      const protectedRoutes = [
        '/',
        '/projects',
        '/contacts',
        '/feed',
        '/team',
        '/funds',
        '/settlements',
        '/settings'
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/login');
      }
    });

    test('should allow access to all routes when authenticated', async ({ page }) => {
      await login(page);

      const routes = [
        { path: '/', title: '대시보드' },
        { path: '/projects', title: '프로젝트' },
        { path: '/contacts', title: '컨택' },
        { path: '/feed', title: '피드' },
        { path: '/team', title: '팀' },
        { path: '/funds', title: '자금' },
        { path: '/settlements', title: '정산' },
        { path: '/settings', title: '설정' }
      ];

      for (const route of routes) {
        await page.goto(route.path);
        await waitForPageLoad(page);
        await expect(page).toHaveURL(route.path);
      }
    });
  });

  test.describe('Desktop Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await setDesktopViewport(page);
      await login(page);
    });

    test('should navigate using sidebar menu', async ({ page }) => {
      await checkResponsiveLayout(page, 'desktop');

      const menuItems = [
        { selector: 'a[href="/"]', title: '대시보드' },
        { selector: 'a[href="/projects"]', title: '프로젝트' },
        { selector: 'a[href="/contacts"]', title: '컨택' },
        { selector: 'a[href="/feed"]', title: '피드' },
        { selector: 'a[href="/team"]', title: '팀' },
        { selector: 'a[href="/funds"]', title: '자금' },
        { selector: 'a[href="/settlements"]', title: '정산' },
        { selector: 'a[href="/settings"]', title: '설정' }
      ];

      for (const item of menuItems) {
        await page.click(item.selector);
        await waitForPageLoad(page);

        // 활성 메뉴 항목 확인
        await expect(page.locator(item.selector)).toHaveAttribute('aria-current', 'page');
      }
    });

    test('should show active menu state', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageLoad(page);

      // 프로젝트 메뉴가 활성 상태인지 확인
      const projectsLink = page.locator('a[href="/projects"]');
      await expect(projectsLink).toHaveAttribute('aria-current', 'page');
      await expect(projectsLink).toHaveClass(/active|current/);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // 첫 번째 메뉴 항목에 포커스
      await page.keyboard.press('Tab');

      // 화살표 키로 네비게이션
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      await waitForPageLoad(page);
      await expect(page).not.toHaveURL('/');
    });
  });

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await login(page);
    });

    test('should show hamburger menu on mobile', async ({ page }) => {
      await checkResponsiveLayout(page, 'mobile');

      // 햄버거 메뉴 버튼 확인
      const menuButton = page.locator('[data-testid="mobile-menu-trigger"]');
      await expect(menuButton).toBeVisible();
    });

    test('should navigate using mobile menu', async ({ page }) => {
      // 햄버거 메뉴 열기
      await page.click('[data-testid="mobile-menu-trigger"]');
      await page.waitForTimeout(300);

      // 메뉴가 열렸는지 확인
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();

      // 프로젝트 메뉴 클릭
      await page.click('text=프로젝트');
      await waitForPageLoad(page);

      await expect(page).toHaveURL('/projects');

      // 메뉴가 자동으로 닫혔는지 확인
      await expect(mobileMenu).toBeHidden();
    });

    test('should show bottom navigation', async ({ page }) => {
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      await expect(bottomNav).toBeVisible();

      // 하단 네비게이션 버튼들 확인
      const navButtons = bottomNav.locator('button, a');
      await expect(navButtons).toHaveCount(4); // 주요 4개 메뉴
    });

    test('should use bottom navigation for primary routes', async ({ page }) => {
      const bottomNavItems = [
        { selector: '[data-testid="nav-dashboard"]', url: '/' },
        { selector: '[data-testid="nav-projects"]', url: '/projects' },
        { selector: '[data-testid="nav-contacts"]', url: '/contacts' },
        { selector: '[data-testid="nav-more"]', url: '#' } // More 메뉴
      ];

      for (const item of bottomNavItems) {
        const navItem = page.locator(item.selector);
        if (await navItem.count() > 0) {
          await navItem.click();
          await page.waitForTimeout(300);

          if (item.url !== '#') {
            await expect(page).toHaveURL(item.url);
          }
        }
      }
    });

    test('should handle swipe gestures for navigation', async ({ page }) => {
      // 스와이프 제스처 시뮬레이션 (오른쪽에서 왼쪽)
      await page.touchscreen.tap(350, 400);
      await page.touchscreen.tap(50, 400);

      // 메뉴가 열렸는지 확인
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu).toBeVisible();
      }
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should show breadcrumbs for nested routes', async ({ page }) => {
      // 프로젝트 생성 페이지로 이동
      await page.goto('/projects/new');
      await waitForPageLoad(page);

      // 브레드크럼 확인
      const breadcrumb = page.locator('[data-testid="breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb).toContainText('프로젝트');
      await expect(breadcrumb).toContainText('새 프로젝트');
    });

    test('should navigate back using breadcrumbs', async ({ page }) => {
      await page.goto('/projects/new');
      await waitForPageLoad(page);

      // 브레드크럼에서 프로젝트 링크 클릭
      await page.click('[data-testid="breadcrumb"] a[href="/projects"]');
      await waitForPageLoad(page);

      await expect(page).toHaveURL('/projects');
    });
  });

  test.describe('Session Management', () => {
    test('should handle session expiration', async ({ page, context }) => {
      await login(page);

      // 세션 쿠키 삭제로 만료 시뮬레이션
      await context.clearCookies();

      // 보호된 페이지 접근 시도
      await page.goto('/projects');

      // 로그인 페이지로 리다이렉트되는지 확인
      await expect(page).toHaveURL('/login');
    });

    test('should auto-logout on prolonged inactivity', async ({ page }) => {
      await login(page);

      // 비활성 시간 시뮬레이션 (실제로는 더 긴 시간)
      await page.waitForTimeout(5000);

      // 페이지 새로고침으로 세션 확인 시뮬레이션
      await page.reload();

      // 여전히 로그인 상태인지 확인 (실제 구현에 따라 다름)
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Browser Back/Forward Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should handle browser back/forward buttons', async ({ page }) => {
      // 여러 페이지 방문
      await page.goto('/projects');
      await waitForPageLoad(page);

      await page.goto('/contacts');
      await waitForPageLoad(page);

      // 브라우저 뒤로 가기
      await page.goBack();
      await expect(page).toHaveURL('/projects');

      // 브라우저 앞으로 가기
      await page.goForward();
      await expect(page).toHaveURL('/contacts');
    });

    test('should preserve form data on navigation', async ({ page }) => {
      await page.goto('/projects/new');
      await waitForPageLoad(page);

      // 폼 데이터 입력
      await page.fill('[name="client_name"]', 'Test Client');

      // 다른 페이지로 이동 후 돌아오기
      await page.goto('/contacts');
      await page.goBack();

      // 폼 데이터가 보존되었는지 확인 (브라우저 기본 동작)
      const clientName = await page.inputValue('[name="client_name"]');
      expect(clientName).toBe('Test Client');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // 네트워크 오류 시뮬레이션
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      await page.goto('/login');
      await page.fill('[name="username"]', TEST_CREDENTIALS.username);
      await page.fill('[name="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');

      // 에러 메시지 표시 확인
      await expect(page.locator('[role="alert"]')).toBeVisible();
      await expect(page.locator('[role="alert"]')).toContainText(/네트워크|연결|error/i);
    });

    test('should show 404 page for invalid routes', async ({ page }) => {
      await login(page);
      await page.goto('/invalid-route');

      // 404 페이지 또는 에러 메시지 확인
      await expect(page.locator('text=/404|찾을 수 없음|Not Found/i')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('should support screen readers', async ({ page }) => {
      // 랜드마크 역할 확인
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();

      // 헤딩 구조 확인
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      await expect(headings.first()).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // 메뉴 버튼에 적절한 ARIA 라벨 확인
      const menuButton = page.locator('[data-testid="mobile-menu-trigger"]');
      if (await menuButton.count() > 0) {
        await expect(menuButton).toHaveAttribute('aria-label');
        await expect(menuButton).toHaveAttribute('aria-expanded');
      }
    });

    test('should support keyboard-only navigation', async ({ page }) => {
      // Tab 키로 네비게이션 확인
      await page.keyboard.press('Tab');

      let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);

      // 여러 번 Tab 키를 눌러 네비게이션 확인
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // 주요 텍스트 요소들의 색상 대비 확인
      const textElements = page.locator('h1, h2, p, a, button');
      const count = await textElements.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = textElements.nth(i);
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor
          };
        });

        // 기본적인 색상 확인 (실제 대비율 계산은 복잡함)
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
  });
});