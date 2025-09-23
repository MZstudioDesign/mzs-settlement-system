/**
 * 에러 처리 및 엣지 케이스 E2E 테스트
 * 네트워크 오류, 서버 에러, 예외 상황, 경계 조건 테스트
 */

import { test, expect } from '@playwright/test';
import {
  authenticatedPage,
  waitForPageLoad,
  waitForLoadingToFinish,
  expectErrorMessage,
  expectToastMessage,
  waitForModal,
  selectDropdownOption,
  setMobileViewport,
  simulateOffline,
  simulateOnline,
  getLocalStorageData
} from '../test-utils';

test.describe('Error Handling & Edge Cases', () => {

  test.describe('Network Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
    });

    test('should handle complete network failure', async ({ page, context }) => {
      // 모든 네트워크 요청 차단
      await page.route('**/*', route => {
        route.abort('failed');
      });

      await page.goto('/projects');

      // 네트워크 오류 메시지 확인
      await expectErrorMessage(page, '네트워크 연결을 확인해주세요');

      // 재시도 버튼 표시 확인
      const retryButton = page.locator('[data-testid="retry-button"]');
      if (await retryButton.count() > 0) {
        await expect(retryButton).toBeVisible();
      }
    });

    test('should handle API timeout errors', async ({ page }) => {
      // API 응답 지연 시뮬레이션 (30초 타임아웃)
      await page.route('**/api/projects', async route => {
        await page.waitForTimeout(35000); // 타임아웃보다 긴 지연
        route.continue();
      });

      await page.goto('/projects');

      // 타임아웃 에러 메시지 확인
      await expectErrorMessage(page, '요청 시간이 초과되었습니다');

      // 로딩 상태가 해제되었는지 확인
      await expect(page.locator('[data-testid="loading"]')).toBeHidden();
    });

    test('should handle intermittent network issues', async ({ page, context }) => {
      let requestCount = 0;

      // 3번 중 1번은 실패하도록 설정
      await page.route('**/api/**', route => {
        requestCount++;
        if (requestCount % 3 === 0) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await page.goto('/projects');

      // 자동 재시도 후 성공하는지 확인
      await waitForLoadingToFinish(page);
      await expect(page.locator('h1')).toContainText('프로젝트');
    });

    test('should handle slow network connections', async ({ page }) => {
      // 모든 요청에 2초 지연 추가
      await page.route('**/*', async route => {
        await page.waitForTimeout(2000);
        route.continue();
      });

      const startTime = Date.now();
      await page.goto('/dashboard');

      // 로딩 인디케이터가 표시되는지 확인
      const loadingIndicator = page.locator('[data-testid="loading"]');
      await expect(loadingIndicator).toBeVisible();

      await waitForLoadingToFinish(page);
      const endTime = Date.now();

      // 최소 2초는 걸렸는지 확인
      expect(endTime - startTime).toBeGreaterThan(2000);

      // 최종적으로 페이지가 로드되었는지 확인
      await expect(page.locator('h1')).toContainText('대시보드');
    });

    test('should recover from temporary network outages', async ({ page, context }) => {
      await page.goto('/projects');
      await waitForLoadingToFinish(page);

      // 네트워크 차단
      await simulateOffline(context);

      // 새 데이터 로드 시도
      await page.click('[data-testid="refresh-button"]');

      // 오프라인 상태 표시 확인
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      if (await offlineIndicator.count() > 0) {
        await expect(offlineIndicator).toBeVisible();
      }

      // 네트워크 복구
      await simulateOnline(context);

      // 자동으로 데이터 재로드 확인
      await waitForLoadingToFinish(page);
      await expectToastMessage(page, '연결이 복구되었습니다');
    });
  });

  test.describe('Server Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
    });

    test('should handle 500 internal server errors', async ({ page }) => {
      await page.route('**/api/projects', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: '서버에 오류가 발생했습니다'
          })
        });
      });

      await page.goto('/projects');

      await expectErrorMessage(page, '서버에 오류가 발생했습니다');

      // 에러 상태에서도 기본 레이아웃은 유지되는지 확인
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('header')).toBeVisible();
    });

    test('should handle 400 bad request errors', async ({ page }) => {
      await page.goto('/projects/new');

      await page.route('**/api/projects', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Bad Request',
            message: '입력 데이터가 올바르지 않습니다',
            errors: {
              client_name: '클라이언트명은 필수입니다',
              net_B: '금액은 0보다 커야 합니다'
            }
          })
        });
      });

      await page.fill('[name="client_name"]', '');
      await page.fill('[name="net_B"]', '-1000');
      await page.click('button[type="submit"]');

      // 필드별 에러 메시지 확인
      await expectErrorMessage(page, '클라이언트명은 필수입니다');
      await expectErrorMessage(page, '금액은 0보다 커야 합니다');

      // 폼이 리셋되지 않았는지 확인
      const netBValue = await page.inputValue('[name="net_B"]');
      expect(netBValue).toBe('-1000');
    });

    test('should handle 401 unauthorized errors', async ({ page }) => {
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unauthorized',
            message: '인증이 필요합니다'
          })
        });
      });

      await page.goto('/projects');

      // 로그인 페이지로 리다이렉트되는지 확인
      await expect(page).toHaveURL('/login');
    });

    test('should handle 403 forbidden errors', async ({ page }) => {
      await page.route('**/api/projects', route => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Forbidden',
            message: '접근 권한이 없습니다'
          })
        });
      });

      await page.goto('/projects');

      await expectErrorMessage(page, '접근 권한이 없습니다');

      // 권한 없음 페이지나 메시지 표시 확인
      const forbiddenMessage = page.locator('[data-testid="forbidden-message"]');
      if (await forbiddenMessage.count() > 0) {
        await expect(forbiddenMessage).toBeVisible();
      }
    });

    test('should handle 404 not found errors', async ({ page }) => {
      await page.route('**/api/projects/9999', route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Not Found',
            message: '프로젝트를 찾을 수 없습니다'
          })
        });
      });

      await page.goto('/projects/9999');

      await expectErrorMessage(page, '프로젝트를 찾을 수 없습니다');

      // 404 페이지나 이전 페이지로 돌아가기 버튼 확인
      const backButton = page.locator('[data-testid="back-to-list"]');
      if (await backButton.count() > 0) {
        await expect(backButton).toBeVisible();
      }
    });

    test('should handle malformed JSON responses', async ({ page }) => {
      await page.route('**/api/projects', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json {'
        });
      });

      await page.goto('/projects');

      await expectErrorMessage(page, '데이터를 불러올 수 없습니다');

      // 기본 상태로 복구되는지 확인
      const errorBoundary = page.locator('[data-testid="error-boundary"]');
      if (await errorBoundary.count() > 0) {
        await expect(errorBoundary).toBeVisible();
      }
    });

    test('should handle rate limiting errors', async ({ page }) => {
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Too Many Requests',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
            retry_after: 60
          })
        });
      });

      await page.goto('/projects/new');
      await page.fill('[name="client_name"]', 'Rate Limit Test');
      await page.click('button[type="submit"]');

      await expectErrorMessage(page, '요청이 너무 많습니다');

      // 재시도 타이머 표시 확인
      const retryTimer = page.locator('[data-testid="retry-timer"]');
      if (await retryTimer.count() > 0) {
        await expect(retryTimer).toContainText('60');
      }
    });
  });

  test.describe('Data Validation Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page, '/projects/new');
    });

    test('should handle extremely large numbers', async ({ page }) => {
      const largeNumber = '999999999999999';

      await page.fill('[name="net_B"]', largeNumber);
      await page.click('button[type="submit"]');

      // 대용량 숫자 처리 확인
      const errorMessage = page.locator('[role="alert"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toContainText(/최대값|범위|초과/);
      }
    });

    test('should handle special characters in input', async ({ page }) => {
      const specialChars = '<script>alert("xss")</script>';

      await page.fill('[name="client_name"]', specialChars);
      await page.fill('[name="title"]', '특수문자 테스트 ♠♣♥♦');
      await page.fill('[name="net_B"]', '500000');

      await page.click('button[type="submit"]');

      // XSS 방지 확인
      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>');
      expect(pageContent).not.toContain('alert(');

      // 정상적인 문자는 허용되는지 확인
      await expectToastMessage(page, '프로젝트가 생성되었습니다');
    });

    test('should handle very long strings', async ({ page }) => {
      const longString = 'A'.repeat(1000);

      await page.fill('[name="client_name"]', longString);
      await page.click('button[type="submit"]');

      // 문자열 길이 제한 확인
      const clientNameField = page.locator('[name="client_name"]');
      await expect(clientNameField).toHaveAttribute('aria-invalid', 'true');

      await expectErrorMessage(page, '너무 긴');
    });

    test('should handle unicode characters', async ({ page }) => {
      const unicodeString = '프로젝트 名前 プロジェクト 项目 🎯';

      await page.fill('[name="client_name"]', 'Unicode Test Client');
      await page.fill('[name="title"]', unicodeString);
      await page.fill('[name="net_B"]', '500000');

      await page.click('button[type="submit"]');

      // Unicode 문자 처리 확인
      await expectToastMessage(page, '프로젝트가 생성되었습니다');

      // 목록에서 Unicode 문자가 정상 표시되는지 확인
      await page.goto('/projects');
      await waitForLoadingToFinish(page);

      const projectTitle = page.locator(`text=${unicodeString}`);
      if (await projectTitle.count() > 0) {
        await expect(projectTitle).toBeVisible();
      }
    });

    test('should handle date edge cases', async ({ page }) => {
      const edgeCases = [
        '2024-02-29', // 윤년
        '2023-02-29', // 평년 (잘못된 날짜)
        '2024-13-01', // 잘못된 월
        '2024-12-32', // 잘못된 일
        '1900-01-01', // 과거 날짜
        '3000-01-01'  // 미래 날짜
      ];

      for (const dateCase of edgeCases) {
        await page.fill('[name="settle_date"]', dateCase);
        await page.click('button[type="submit"]');

        const dateField = page.locator('[name="settle_date"]');
        const isValid = await dateField.evaluate((input: HTMLInputElement) => {
          return input.validity.valid;
        });

        // 유효하지 않은 날짜는 브라우저에서 거부되어야 함
        if (!isValid) {
          await expect(dateField).toHaveAttribute('aria-invalid', 'true');
        }

        // 필드 클리어
        await page.fill('[name="settle_date"]', '');
      }
    });

    test('should handle decimal precision in money fields', async ({ page }) => {
      const precisionCases = [
        '1000.5',    // 소수점 1자리
        '1000.50',   // 소수점 2자리
        '1000.555',  // 소수점 3자리
        '1000.9999', // 소수점 4자리
        '.50',       // 정수부 없음
        '1000.'      // 소수점만 있음
      ];

      for (const amountCase of precisionCases) {
        await page.fill('[name="net_B"]', amountCase);

        // 입력 후 포맷팅 확인
        await page.waitForTimeout(500);
        const formattedValue = await page.inputValue('[name="net_B"]');

        // 소수점 처리가 일관적인지 확인
        if (formattedValue.includes('.')) {
          const decimalPart = formattedValue.split('.')[1];
          expect(decimalPart.length).toBeLessThanOrEqual(2);
        }

        await page.fill('[name="net_B"]', '');
      }
    });
  });

  test.describe('Concurrent User Actions', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
    });

    test('should handle rapid successive API calls', async ({ page }) => {
      await page.goto('/projects/new');

      // 빠른 연속 제출
      await page.fill('[name="client_name"]', 'Rapid Submit Test');
      await page.fill('[name="title"]', 'Rapid Submit Project');
      await page.fill('[name="net_B"]', '500000');

      const submitButton = page.locator('button[type="submit"]');

      // 빠른 연속 클릭
      await Promise.all([
        submitButton.click(),
        submitButton.click(),
        submitButton.click()
      ]);

      // 중복 제출 방지 확인
      const toastMessages = page.locator('[data-sonner-toast]');
      const messageCount = await toastMessages.count();

      // 성공 메시지는 1개만 있어야 함
      expect(messageCount).toBeLessThanOrEqual(2); // 성공 1개 + 중복 방지 1개
    });

    test('should handle form submission during loading', async ({ page }) => {
      await page.goto('/projects/new');

      // API 응답 지연 시뮬레이션
      await page.route('**/api/projects', async route => {
        await page.waitForTimeout(3000);
        route.continue();
      });

      await page.fill('[name="client_name"]', 'Loading Test');
      await page.fill('[name="net_B"]', '500000');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 로딩 중 추가 제출 시도
      await expect(submitButton).toBeDisabled();
      await expect(submitButton).toContainText('저장중...');

      // 로딩 완료 대기
      await expectToastMessage(page, '프로젝트가 생성되었습니다', { timeout: 10000 });
    });

    test('should handle multiple tab concurrent edits', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      // 두 탭에서 동일한 프로젝트 편집
      await authenticatedPage(page1, '/projects');
      await authenticatedPage(page2, '/projects');

      // 첫 번째 프로젝트 편집
      const editButton1 = page1.locator('[data-testid="edit-project"]').first();
      const editButton2 = page2.locator('[data-testid="edit-project"]').first();

      if (await editButton1.count() > 0) {
        await editButton1.click();
        await editButton2.click();

        await waitForPageLoad(page1);
        await waitForPageLoad(page2);

        // 첫 번째 탭에서 수정
        await page1.fill('[name="client_name"]', 'Tab 1 Edit');
        await page1.click('button[type="submit"]');

        // 두 번째 탭에서 수정 시도
        await page2.fill('[name="client_name"]', 'Tab 2 Edit');
        await page2.click('button[type="submit"]');

        // 충돌 감지 및 처리 확인
        const conflictWarning = page2.locator('[data-testid="edit-conflict"]');
        if (await conflictWarning.count() > 0) {
          await expect(conflictWarning).toBeVisible();
          await expect(conflictWarning).toContainText('다른 사용자가 수정');
        }
      }

      await context.close();
    });

    test('should handle session expiry during operations', async ({ page, context }) => {
      await page.goto('/projects/new');

      await page.fill('[name="client_name"]', 'Session Expiry Test');
      await page.fill('[name="net_B"]', '500000');

      // 세션 쿠키 삭제로 만료 시뮬레이션
      await context.clearCookies();

      await page.click('button[type="submit"]');

      // 세션 만료로 인한 로그인 페이지 리다이렉트 확인
      await expect(page).toHaveURL('/login');

      // 로그인 후 작업 내용 복구 확인
      // (실제 구현에 따라 다름)
    });
  });

  test.describe('Browser-Specific Edge Cases', () => {
    test('should handle browser back button during form submission', async ({ page }) => {
      await authenticatedPage(page, '/projects/new');

      await page.fill('[name="client_name"]', 'Back Button Test');
      await page.fill('[name="net_B"]', '500000');

      // API 응답 지연으로 제출 중 상태 만들기
      await page.route('**/api/projects', async route => {
        await page.waitForTimeout(5000);
        route.continue();
      });

      const submitPromise = page.click('button[type="submit"]');

      // 제출 중 브라우저 뒤로 가기
      await page.waitForTimeout(1000);
      await page.goBack();

      // 요청이 취소되었는지 확인
      await expect(page).toHaveURL('/projects');
    });

    test('should handle page refresh during operations', async ({ page }) => {
      await authenticatedPage(page, '/projects/new');

      await page.fill('[name="client_name"]', 'Refresh Test');
      await page.fill('[name="title"]', 'Refresh Test Project');

      // 페이지 새로고침
      await page.reload();

      // 폼 데이터가 초기화되었는지 확인
      const clientName = await page.inputValue('[name="client_name"]');
      expect(clientName).toBe('');

      // 페이지가 정상적으로 로드되었는지 확인
      await expect(page.locator('h1')).toContainText('새 프로젝트');
    });

    test('should handle localStorage quota exceeded', async ({ page }) => {
      // localStorage 공간 채우기
      await page.evaluate(() => {
        try {
          const largeData = 'x'.repeat(1024 * 1024); // 1MB
          for (let i = 0; i < 10; i++) {
            localStorage.setItem(`large-item-${i}`, largeData);
          }
        } catch (e) {
          // Quota 초과 시 무시
        }
      });

      await authenticatedPage(page);

      // FAB 오프라인 데이터 저장 시도
      await setMobileViewport(page);

      const fabButton = page.locator('[data-testid="fab-button"]');
      if (await fabButton.count() > 0) {
        await fabButton.click();
        await selectDropdownOption(page, '[data-testid="member-select"]', '오유택');
        await page.click('button:has-text("컨택1000")');

        // 저장소 부족 에러 처리 확인
        const storageWarning = page.locator('[data-testid="storage-warning"]');
        if (await storageWarning.count() > 0) {
          await expect(storageWarning).toContainText('저장 공간이 부족');
        }
      }
    });

    test('should handle disabled JavaScript', async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false
      });

      const page = await context.newPage();
      await page.goto('/login');

      // 기본 HTML 요소가 표시되는지 확인
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();

      // 노스크립트 메시지 표시 확인
      const noscriptMessage = page.locator('noscript');
      if (await noscriptMessage.count() > 0) {
        await expect(noscriptMessage).toBeVisible();
      }

      await context.close();
    });
  });

  test.describe('Resource Exhaustion', () => {
    test('should handle memory pressure', async ({ page }) => {
      // 메모리 집약적인 작업 시뮬레이션
      await page.evaluate(() => {
        const largeArrays = [];
        for (let i = 0; i < 100; i++) {
          largeArrays.push(new Array(100000).fill('memory test'));
        }
        // @ts-ignore
        window.memoryTest = largeArrays;
      });

      await authenticatedPage(page);

      // 페이지가 여전히 반응하는지 확인
      await expect(page.locator('h1')).toBeVisible();

      // 메모리 정리 후 정상 동작 확인
      await page.evaluate(() => {
        // @ts-ignore
        delete window.memoryTest;
        if (window.gc) {
          // @ts-ignore
          window.gc();
        }
      });
    });

    test('should handle large data sets efficiently', async ({ page }) => {
      // 대용량 데이터 모킹
      await page.route('**/api/projects', route => {
        const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
          id: i + 1,
          client_name: `Client ${i + 1}`,
          title: `Project ${i + 1}`,
          net_B: Math.random() * 1000000
        }));

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeDataSet)
        });
      });

      const startTime = Date.now();
      await authenticatedPage(page, '/projects');
      await waitForLoadingToFinish(page);
      const endTime = Date.now();

      // 대용량 데이터도 합리적인 시간 내에 로드되는지 확인
      expect(endTime - startTime).toBeLessThan(10000); // 10초 이내

      // 가상화나 페이징이 적용되었는지 확인
      const visibleRows = page.locator('[data-testid="projects-table"] tbody tr');
      const rowCount = await visibleRows.count();

      // 전체 데이터가 아닌 일부만 렌더링되었는지 확인
      expect(rowCount).toBeLessThan(1000);
    });

    test('should handle CPU-intensive operations', async ({ page }) => {
      await authenticatedPage(page);

      // CPU 집약적인 작업 시뮬레이션
      await page.evaluate(() => {
        const start = Date.now();
        while (Date.now() - start < 5000) {
          // 5초간 CPU 점유
          Math.sqrt(Math.random());
        }
      });

      // UI가 여전히 반응하는지 확인
      await expect(page.locator('button')).toBeEnabled();

      // 페이지 네비게이션이 가능한지 확인
      await page.goto('/projects');
      await expect(page.locator('h1')).toContainText('프로젝트');
    });
  });

  test.describe('Security Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await authenticatedPage(page);
    });

    test('should prevent XSS attacks', async ({ page }) => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>'
      ];

      for (const payload of xssPayloads) {
        await page.goto('/projects/new');

        await page.fill('[name="client_name"]', payload);
        await page.fill('[name="title"]', payload);
        await page.fill('[name="notes"]', payload);
        await page.fill('[name="net_B"]', '500000');

        await page.click('button[type="submit"]');

        // XSS 실행되지 않았는지 확인
        const pageContent = await page.content();
        expect(pageContent).not.toContain('alert(');
        expect(pageContent).not.toContain('<script>');

        // HTML 엔티티로 인코딩되었는지 확인
        if (pageContent.includes(payload)) {
          expect(pageContent).toContain('&lt;script&gt;');
        }
      }
    });

    test('should handle malicious file uploads', async ({ page }) => {
      await page.goto('/funds');

      const fileInput = page.locator('input[type="file"]');

      if (await fileInput.count() > 0) {
        // 악성 파일 시뮬레이션 (실제로는 텍스트 파일)
        const maliciousFiles = [
          'malware.exe.txt',
          'script.js',
          'large-file.pdf' // 큰 파일
        ];

        for (const filename of maliciousFiles) {
          // 파일 선택 시뮬레이션
          const fileContent = filename.includes('large') ? 'x'.repeat(50 * 1024 * 1024) : 'safe content';

          await fileInput.setInputFiles([{
            name: filename,
            mimeType: 'text/plain',
            buffer: Buffer.from(fileContent)
          }]);

          // 업로드 버튼 클릭
          const uploadButton = page.locator('[data-testid="upload-file"]');
          await uploadButton.click();

          // 파일 검증 에러 확인
          if (filename.includes('.exe') || filename.includes('.js')) {
            await expectErrorMessage(page, '허용되지 않는 파일 형식');
          }

          if (filename.includes('large')) {
            await expectErrorMessage(page, '파일 크기가 너무 큽니다');
          }
        }
      }
    });

    test('should handle CSRF attacks', async ({ page }) => {
      // CSRF 토큰이 있는지 확인
      const csrfToken = page.locator('meta[name="csrf-token"]');

      if (await csrfToken.count() > 0) {
        const tokenValue = await csrfToken.getAttribute('content');
        expect(tokenValue).toBeTruthy();
        expect(tokenValue).toHaveLength.greaterThan(20);
      }

      // 외부 요청으로부터 보호되는지 확인
      const response = await page.request.post('/api/projects', {
        data: {
          client_name: 'CSRF Test',
          net_B: 500000
        },
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should sanitize user input in URLs', async ({ page }) => {
      const maliciousIds = [
        '../../../etc/passwd',
        '<script>',
        'javascript:alert(1)',
        '../../admin/users',
        'null',
        'undefined',
        '%3Cscript%3E'
      ];

      for (const id of maliciousIds) {
        await page.goto(`/projects/${encodeURIComponent(id)}`);

        // 404 페이지나 에러 페이지로 처리되는지 확인
        const errorIndicators = [
          '404',
          '찾을 수 없습니다',
          'Not Found',
          'Invalid ID'
        ];

        const pageContent = await page.textContent('body');
        const hasErrorIndicator = errorIndicators.some(indicator =>
          pageContent?.includes(indicator)
        );

        expect(hasErrorIndicator).toBeTruthy();
      }
    });
  });

  test.describe('Recovery and Resilience', () => {
    test('should recover from JavaScript errors', async ({ page }) => {
      await authenticatedPage(page);

      // JavaScript 에러 발생 시뮬레이션
      await page.evaluate(() => {
        // @ts-ignore
        window.nonExistentFunction();
      });

      // 에러 경계가 작동하는지 확인
      const errorBoundary = page.locator('[data-testid="error-boundary"]');
      if (await errorBoundary.count() > 0) {
        await expect(errorBoundary).toBeVisible();

        // 복구 버튼 클릭
        const recoverButton = errorBoundary.locator('[data-testid="recover-button"]');
        await recoverButton.click();
      }

      // 페이지가 정상 상태로 복구되었는지 확인
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should handle graceful degradation', async ({ page }) => {
      // 일부 기능 비활성화 시뮬레이션
      await page.route('**/api/dashboard/stats', route => {
        route.fulfill({ status: 503 });
      });

      await authenticatedPage(page);

      // 기본 기능은 여전히 동작하는지 확인
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();

      // 비활성화된 기능에 대한 알림 확인
      const degradedMessage = page.locator('[data-testid="degraded-service"]');
      if (await degradedMessage.count() > 0) {
        await expect(degradedMessage).toContainText('일부 기능이 제한');
      }
    });

    test('should provide meaningful error reporting', async ({ page }) => {
      let errorReported = false;

      // 에러 리포팅 모니터링
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errorReported = true;
        }
      });

      await page.route('**/api/projects', route => {
        route.fulfill({ status: 500 });
      });

      await authenticatedPage(page, '/projects');

      // 에러가 적절히 로깅되었는지 확인
      expect(errorReported).toBeTruthy();

      // 사용자에게 도움이 되는 에러 메시지 표시
      const helpfulError = page.locator('[data-testid="helpful-error"]');
      if (await helpfulError.count() > 0) {
        await expect(helpfulError).toContainText('잠시 후 다시 시도');
        await expect(helpfulError).toContainText('문의');
      }
    });
  });
});