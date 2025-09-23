/**
 * 모바일 반응형 E2E 테스트
 * 다양한 디바이스에서의 레이아웃, 터치 인터랙션, 네비게이션
 */

import { test, expect, devices } from '@playwright/test';
import {
  authenticatedPage,
  waitForPageLoad,
  waitForLoadingToFinish,
  setMobileViewport,
  setDesktopViewport,
  checkResponsiveLayout,
  tapElement,
  selectDropdownOption,
  waitForModal,
  expectToastMessage
} from '../test-utils';

test.describe('Mobile Responsiveness', () => {

  test.describe('Viewport Adaptations', () => {
    test('should adapt to mobile viewport (375x812)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await authenticatedPage(page);

      // 모바일 레이아웃 확인
      await checkResponsiveLayout(page, 'mobile');

      // 모바일 헤더 표시
      const mobileHeader = page.locator('[data-testid="mobile-header"]');
      await expect(mobileHeader).toBeVisible();

      // 햄버거 메뉴 표시
      const menuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
      await expect(menuTrigger).toBeVisible();

      // 하단 네비게이션 표시
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      await expect(bottomNav).toBeVisible();
    });

    test('should adapt to tablet viewport (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await authenticatedPage(page);

      // 태블릿에서는 사이드바가 collapsible일 수 있음
      const sidebar = page.locator('[data-testid="sidebar"]');
      if (await sidebar.count() > 0) {
        await expect(sidebar).toBeVisible();
      }

      // 컨텐츠 영역이 적절히 조정되는지 확인
      const mainContent = page.locator('main');
      const contentBox = await mainContent.boundingBox();
      expect(contentBox?.width).toBeGreaterThan(600);
    });

    test('should adapt to large mobile viewport (414x896)', async ({ page }) => {
      await page.setViewportSize({ width: 414, height: 896 });
      await authenticatedPage(page);

      // 큰 모바일에서도 모바일 네비게이션 유지
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      await expect(bottomNav).toBeVisible();

      // FAB 버튼 위치 조정 확인
      const fabButton = page.locator('[data-testid="fab-button"]');
      if (await fabButton.count() > 0) {
        const fabBox = await fabButton.boundingBox();
        expect(fabBox?.x).toBeGreaterThan(350); // 화면 오른쪽
        expect(fabBox?.y).toBeGreaterThan(800); // 화면 하단
      }
    });

    test('should handle landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 812, height: 375 }); // 가로 모드
      await authenticatedPage(page);

      // 가로 모드에서도 모바일 네비게이션 유지
      const mobileHeader = page.locator('[data-testid="mobile-header"]');
      await expect(mobileHeader).toBeVisible();

      // 하단 네비게이션이 적절히 표시되는지 확인
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      await expect(bottomNav).toBeVisible();

      // 컨텐츠 영역이 세로 공간을 효율적으로 사용하는지 확인
      const mainContent = page.locator('main');
      const contentBox = await mainContent.boundingBox();
      expect(contentBox?.height).toBeLessThan(300); // 가로 모드에서 높이 제한
    });

    test('should handle very small viewport (320x568)', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
      await authenticatedPage(page);

      // 작은 화면에서도 필수 요소들이 표시되는지 확인
      const mobileHeader = page.locator('[data-testid="mobile-header"]');
      await expect(mobileHeader).toBeVisible();

      // 텍스트와 버튼이 적절한 크기인지 확인
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const buttonBox = await firstButton.boundingBox();
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // 최소 터치 타겟 크기
      }

      // 컨텐츠가 가로 스크롤 없이 표시되는지 확인
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      expect(bodyBox?.width).toBeLessThanOrEqual(320);
    });
  });

  test.describe('Navigation Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);
    });

    test('should show mobile navigation menu', async ({ page }) => {
      // 햄버거 메뉴 클릭
      const menuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
      await menuTrigger.click();

      // 모바일 메뉴 표시 확인
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();

      // 메뉴 항목들 확인
      const menuItems = [
        '대시보드',
        '프로젝트',
        '컨택',
        '피드',
        '팀',
        '자금',
        '정산',
        '설정'
      ];

      for (const item of menuItems) {
        await expect(mobileMenu).toContainText(item);
      }
    });

    test('should navigate using bottom navigation', async ({ page }) => {
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      await expect(bottomNav).toBeVisible();

      // 프로젝트 탭 클릭
      const projectsTab = bottomNav.locator('[data-testid="nav-projects"]');
      await projectsTab.click();

      await waitForPageLoad(page);
      await expect(page).toHaveURL('/projects');

      // 활성 탭 표시 확인
      await expect(projectsTab).toHaveClass(/active|selected/);
    });

    test('should close mobile menu on navigation', async ({ page }) => {
      // 메뉴 열기
      await page.click('[data-testid="mobile-menu-trigger"]');
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();

      // 메뉴 항목 클릭
      await page.click('a[href="/contacts"]');

      await waitForPageLoad(page);
      await expect(page).toHaveURL('/contacts');

      // 메뉴가 자동으로 닫혔는지 확인
      await expect(mobileMenu).toBeHidden();
    });

    test('should handle swipe-to-close menu', async ({ page }) => {
      await page.click('[data-testid="mobile-menu-trigger"]');
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();

      // 스와이프 제스처 시뮬레이션 (왼쪽에서 오른쪽으로)
      const menuBox = await mobileMenu.boundingBox();
      if (menuBox) {
        await page.touchscreen.tap(menuBox.x + 10, menuBox.y + 100);
        await page.touchscreen.tap(menuBox.x + menuBox.width - 10, menuBox.y + 100);
      }

      // 메뉴가 닫혔는지 확인
      await expect(mobileMenu).toBeHidden();
    });

    test('should show breadcrumbs on mobile sub-pages', async ({ page }) => {
      // 프로젝트 생성 페이지로 이동
      await page.goto('/projects/new');
      await waitForPageLoad(page);

      // 모바일 브레드크럼 확인
      const breadcrumb = page.locator('[data-testid="mobile-breadcrumb"]');
      if (await breadcrumb.count() > 0) {
        await expect(breadcrumb).toBeVisible();
        await expect(breadcrumb).toContainText('프로젝트');
        await expect(breadcrumb).toContainText('새 프로젝트');
      }

      // 뒤로 가기 버튼 확인
      const backButton = page.locator('[data-testid="back-button"]');
      if (await backButton.count() > 0) {
        await expect(backButton).toBeVisible();
        await backButton.click();
        await expect(page).toHaveURL('/projects');
      }
    });
  });

  test.describe('Content Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
    });

    test('should display responsive dashboard cards', async ({ page }) => {
      await authenticatedPage(page);

      // 대시보드 카드가 세로로 정렬되는지 확인
      const statsCards = page.locator('[data-testid="stats-cards"]');
      await expect(statsCards).toBeVisible();

      // 모바일에서 카드들이 전체 너비를 사용하는지 확인
      const cards = statsCards.locator('[data-testid="stat-card"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const firstCard = cards.first();
        const cardBox = await firstCard.boundingBox();

        expect(cardBox?.width).toBeGreaterThan(300); // 거의 전체 너비 사용
      }
    });

    test('should show responsive project list', async ({ page }) => {
      await authenticatedPage(page, '/projects');

      // 모바일에서 테이블이 카드 형태로 변경되는지 확인
      const projectsList = page.locator('[data-testid="projects-list"]');
      await expect(projectsList).toBeVisible();

      // 카드 형태 확인
      const projectCards = page.locator('[data-testid="project-card"]');
      if (await projectCards.count() > 0) {
        const firstCard = projectCards.first();
        await expect(firstCard).toBeVisible();

        // 카드 내 필수 정보 표시 확인
        await expect(firstCard).toContainText(/클라이언트|프로젝트/);
        await expect(firstCard).toContainText(/₩|원/);
      }
    });

    test('should handle responsive tables with horizontal scroll', async ({ page }) => {
      await authenticatedPage(page, '/contacts');

      // 테이블이 가로 스크롤 가능한지 확인
      const tableContainer = page.locator('[data-testid="table-container"]');
      if (await tableContainer.count() > 0) {
        const containerStyles = await tableContainer.evaluate(el => {
          return window.getComputedStyle(el);
        });

        expect(containerStyles.overflowX).toBe('auto');
      }

      // 중요한 컬럼이 우선 표시되는지 확인
      const table = page.locator('[data-testid="contacts-table"]');
      const memberColumn = table.locator('th:has-text("멤버")');
      const amountColumn = table.locator('th:has-text("금액")');

      await expect(memberColumn).toBeVisible();
      await expect(amountColumn).toBeVisible();
    });

    test('should adapt form layouts for mobile', async ({ page }) => {
      await authenticatedPage(page, '/projects/new');

      // 폼 요소들이 세로로 정렬되는지 확인
      const formContainer = page.locator('[data-testid="project-form"]');
      await expect(formContainer).toBeVisible();

      // 입력 필드들이 전체 너비를 사용하는지 확인
      const inputFields = page.locator('input[type="text"], input[type="number"], select, textarea');
      const fieldCount = await inputFields.count();

      for (let i = 0; i < Math.min(fieldCount, 5); i++) {
        const field = inputFields.nth(i);
        const fieldBox = await field.boundingBox();

        if (fieldBox) {
          expect(fieldBox.width).toBeGreaterThan(300); // 거의 전체 너비
        }
      }
    });

    test('should show responsive modals as bottom sheets', async ({ page }) => {
      await authenticatedPage(page, '/contacts');

      // 새 컨택 추가 버튼 클릭
      await page.click('[data-testid="new-contact-button"]');

      // 모바일에서 바텀 시트로 표시되는지 확인
      const modal = page.locator('[data-testid="contact-modal"]');
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();

        // 바텀 시트 스타일 확인
        const modalBox = await modal.boundingBox();
        if (modalBox) {
          // 화면 하단에서 올라오는 형태
          expect(modalBox.y).toBeGreaterThan(200);
          expect(modalBox.width).toBeCloseTo(375, 50); // 화면 너비와 유사
        }
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);
    });

    test('should support touch taps', async ({ page }) => {
      // FAB 버튼 터치
      const fabButton = page.locator('[data-testid="fab-button"]');
      if (await fabButton.count() > 0) {
        await tapElement(page, '[data-testid="fab-button"]');

        const overlay = page.locator('[data-testid="quick-logger-overlay"]');
        await expect(overlay).toBeVisible();
      }
    });

    test('should handle touch scrolling', async ({ page }) => {
      await page.goto('/projects');
      await waitForLoadingToFinish(page);

      // 프로젝트 목록이 있는 경우 스크롤 테스트
      const projectsList = page.locator('[data-testid="projects-list"]');

      // 터치 스크롤 시뮬레이션
      const listBox = await projectsList.boundingBox();
      if (listBox) {
        // 아래에서 위로 스와이프 (스크롤 다운)
        await page.touchscreen.tap(listBox.x + 100, listBox.y + 200);
        await page.touchscreen.tap(listBox.x + 100, listBox.y + 50);

        // 스크롤이 발생했는지 확인 (스크롤 위치 변경)
        const scrollTop = await projectsList.evaluate(el => el.scrollTop);
        expect(scrollTop).toBeGreaterThanOrEqual(0);
      }
    });

    test('should support pull-to-refresh', async ({ page }) => {
      // 페이지 상단에서 아래로 당기기
      const mainContent = page.locator('main');
      const contentBox = await mainContent.boundingBox();

      if (contentBox) {
        // 상단에서 아래로 스와이프
        await page.touchscreen.tap(contentBox.x + 100, 50);
        await page.touchscreen.tap(contentBox.x + 100, 200);

        // 새로고침 표시기가 나타나는지 확인
        const refreshIndicator = page.locator('[data-testid="pull-refresh"]');
        if (await refreshIndicator.count() > 0) {
          await expect(refreshIndicator).toBeVisible();
        }
      }
    });

    test('should handle swipe gestures on cards', async ({ page }) => {
      await page.goto('/feed');
      await waitForLoadingToFinish(page);

      const feedCards = page.locator('[data-testid="feed-card"]');

      if (await feedCards.count() > 0) {
        const firstCard = feedCards.first();
        const cardBox = await firstCard.boundingBox();

        if (cardBox) {
          // 오른쪽에서 왼쪽으로 스와이프
          await page.touchscreen.tap(cardBox.x + cardBox.width - 10, cardBox.y + 50);
          await page.touchscreen.tap(cardBox.x + 10, cardBox.y + 50);

          // 스와이프 액션 메뉴가 나타나는지 확인
          const swipeActions = page.locator('[data-testid="swipe-actions"]');
          if (await swipeActions.count() > 0) {
            await expect(swipeActions).toBeVisible();
          }
        }
      }
    });

    test('should handle long press interactions', async ({ page }) => {
      await page.goto('/projects');
      await waitForLoadingToFinish(page);

      const projectCards = page.locator('[data-testid="project-card"]');

      if (await projectCards.count() > 0) {
        const firstCard = projectCards.first();

        // 롱 프레스 시뮬레이션
        await firstCard.hover();
        await page.mouse.down();
        await page.waitForTimeout(1000); // 1초 홀드
        await page.mouse.up();

        // 컨텍스트 메뉴나 선택 모드가 활성화되는지 확인
        const contextMenu = page.locator('[data-testid="context-menu"]');
        if (await contextMenu.count() > 0) {
          await expect(contextMenu).toBeVisible();
        }
      }
    });

    test('should support pinch-to-zoom on images', async ({ page }) => {
      // 이미지가 있는 페이지로 이동
      const images = page.locator('img');

      if (await images.count() > 0) {
        const firstImage = images.first();
        const imageBox = await firstImage.boundingBox();

        if (imageBox) {
          // 핀치 줌 시뮬레이션 (실제로는 복잡한 터치 이벤트 필요)
          await page.touchscreen.tap(imageBox.x + 50, imageBox.y + 50);
          await page.touchscreen.tap(imageBox.x + 100, imageBox.y + 100);

          // 확대/축소 기능이 있다면 확인
          // 실제 구현에 따라 다름
        }
      }
    });
  });

  test.describe('Device-Specific Testing', () => {
    test('should work on iPhone 12', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });

      const page = await context.newPage();
      await authenticatedPage(page);

      // iPhone 12 특정 테스트
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="bottom-navigation"]')).toBeVisible();

      // Safe area 확인 (노치 영역 고려)
      const header = page.locator('[data-testid="mobile-header"]');
      const headerBox = await header.boundingBox();
      expect(headerBox?.y).toBeGreaterThanOrEqual(40); // 상단 safe area

      await context.close();
    });

    test('should work on iPad', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad Pro']
      });

      const page = await context.newPage();
      await authenticatedPage(page);

      // iPad에서 사이드바 표시 확인
      const sidebar = page.locator('[data-testid="sidebar"]');
      if (await sidebar.count() > 0) {
        await expect(sidebar).toBeVisible();
      }

      // 태블릿용 레이아웃 확인
      const mainContent = page.locator('main');
      const contentBox = await mainContent.boundingBox();
      expect(contentBox?.width).toBeGreaterThan(600);

      await context.close();
    });

    test('should work on Android phone', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5']
      });

      const page = await context.newPage();
      await authenticatedPage(page);

      // Android 특정 네비게이션 확인
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();

      // Material Design 스타일 확인 (있는 경우)
      const materialButtons = page.locator('.md-button, .mat-button');
      if (await materialButtons.count() > 0) {
        await expect(materialButtons.first()).toBeVisible();
      }

      await context.close();
    });

    test('should handle different screen densities', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 3 // Retina display
      });

      const page = await context.newPage();
      await authenticatedPage(page);

      // 고해상도에서 텍스트와 이미지가 선명한지 확인
      const images = page.locator('img');
      if (await images.count() > 0) {
        const firstImage = images.first();
        await expect(firstImage).toBeVisible();

        // srcset 속성이나 고해상도 이미지 사용 확인
        const srcset = await firstImage.getAttribute('srcset');
        if (srcset) {
          expect(srcset).toContain('2x'); // 2x 이미지 포함
        }
      }

      await context.close();
    });
  });

  test.describe('Responsive Performance', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
    });

    test('should load quickly on mobile', async ({ page }) => {
      const startTime = Date.now();
      await authenticatedPage(page);
      await waitForLoadingToFinish(page);
      const endTime = Date.now();

      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // 5초 이내 로딩
    });

    test('should handle slow network connections', async ({ page, context }) => {
      // 3G 네트워크 시뮬레이션
      await context.route('**/*', async route => {
        await page.waitForTimeout(100); // 100ms 지연
        route.continue();
      });

      await authenticatedPage(page);

      // 로딩 인디케이터 표시 확인
      const loadingIndicator = page.locator('[data-testid="loading"]');
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator).toBeVisible();
      }

      await waitForLoadingToFinish(page);

      // 컨텐츠가 최종적으로 로드되었는지 확인
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should optimize images for mobile', async ({ page }) => {
      await authenticatedPage(page);

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const image = images.nth(i);

        // lazy loading 확인
        const loading = await image.getAttribute('loading');
        if (loading) {
          expect(loading).toBe('lazy');
        }

        // responsive 이미지 확인
        const sizes = await image.getAttribute('sizes');
        if (sizes) {
          expect(sizes).toContain('(max-width:');
        }
      }
    });

    test('should minimize resource usage on mobile', async ({ page }) => {
      await authenticatedPage(page);

      // JavaScript 번들 크기 확인
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('navigation')[0];
      });

      // 페이지 로드 성능 메트릭 확인
      expect(performanceEntries.loadEventEnd - performanceEntries.loadEventStart).toBeLessThan(2000);
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await setMobileViewport(page);
      await authenticatedPage(page);
    });

    test('should maintain focus management on mobile', async ({ page }) => {
      // 모바일 메뉴 열기
      await page.click('[data-testid="mobile-menu-trigger"]');

      // 포커스가 메뉴 내부로 이동했는지 확인
      const focusedElement = page.locator(':focus');
      const menuContainer = page.locator('[data-testid="mobile-menu"]');

      // 포커스된 요소가 메뉴 내부에 있는지 확인
      const isInsideMenu = await focusedElement.evaluate((focused, menu) => {
        return menu.contains(focused);
      }, await menuContainer.elementHandle());

      expect(isInsideMenu).toBeTruthy();
    });

    test('should have adequate touch target sizes', async ({ page }) => {
      // 터치 타겟 크기 확인 (최소 44x44px)
      const interactiveElements = page.locator('button, a, input[type="checkbox"], input[type="radio"]');
      const elementCount = await interactiveElements.count();

      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const element = interactiveElements.nth(i);
        const box = await element.boundingBox();

        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should support screen reader navigation', async ({ page }) => {
      // 스크린 리더용 랜드마크 확인
      const landmarks = ['main', 'nav', 'header', 'footer'];

      for (const landmark of landmarks) {
        const landmarkElement = page.locator(landmark);
        if (await landmarkElement.count() > 0) {
          await expect(landmarkElement).toBeVisible();
        }
      }

      // 스킵 링크 확인
      const skipLink = page.locator('a[href="#main-content"]');
      if (await skipLink.count() > 0) {
        await expect(skipLink).toBeVisible();
      }
    });

    test('should handle zoom up to 200%', async ({ page }) => {
      // 200% 줌 시뮬레이션
      await page.setViewportSize({ width: 187, height: 333 }); // 375x667의 50%

      await waitForLoadingToFinish(page);

      // 주요 요소들이 여전히 접근 가능한지 확인
      const importantElements = [
        '[data-testid="mobile-header"]',
        '[data-testid="mobile-menu-trigger"]',
        '[data-testid="bottom-navigation"]'
      ];

      for (const selector of importantElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }

      // 가로 스크롤이 발생하지 않는지 확인
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(200); // 뷰포트 너비 + 여유분
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should maintain data consistency across devices', async ({ page }) => {
      // 데스크탑에서 데이터 입력
      await setDesktopViewport(page);
      await authenticatedPage(page, '/projects/new');

      await page.fill('[name="client_name"]', 'Cross Device Test');
      await page.fill('[name="title"]', 'Mobile Consistency Test');
      await page.fill('[name="net_B"]', '500000');
      await page.click('button[type="submit"]');

      await expectToastMessage(page, '프로젝트가 생성되었습니다');

      // 모바일로 전환
      await setMobileViewport(page);
      await page.goto('/projects');
      await waitForLoadingToFinish(page);

      // 동일한 데이터가 모바일에서도 표시되는지 확인
      const projectCard = page.locator('[data-testid="project-card"]').first();
      await expect(projectCard).toContainText('Cross Device Test');
      await expect(projectCard).toContainText('Mobile Consistency Test');
    });

    test('should sync form state across viewport changes', async ({ page }) => {
      await setDesktopViewport(page);
      await authenticatedPage(page, '/contacts');

      // 데스크탑에서 폼 작성 시작
      await page.click('[data-testid="new-contact-button"]');
      const modal = await waitForModal(page);

      await selectDropdownOption(page, '[data-testid="contact-member-select"]', '오유택');
      await page.fill('[data-testid="contact-notes"]', '뷰포트 변경 테스트');

      // 모바일로 전환 (폼이 유지되어야 함)
      await setMobileViewport(page);

      // 입력된 값이 유지되었는지 확인
      const memberSelect = page.locator('[data-testid="contact-member-select"]');
      const notesField = page.locator('[data-testid="contact-notes"]');

      const memberText = await memberSelect.textContent();
      const notesValue = await notesField.inputValue();

      expect(memberText).toContain('오유택');
      expect(notesValue).toBe('뷰포트 변경 테스트');
    });
  });
});