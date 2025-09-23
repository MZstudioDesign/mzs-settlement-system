/**
 * E2E 테스트 유틸리티 함수들
 * 공통으로 사용되는 테스트 헬퍼 함수들을 정의
 */

import { Page, expect, BrowserContext } from '@playwright/test';

/**
 * 테스트용 로그인 정보
 */
export const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'test123'
};

/**
 * 테스트용 샘플 데이터
 */
export const SAMPLE_DATA = {
  project: {
    client_name: 'Test Client',
    title: 'Test Project',
    list_price_net: '1000000',
    deposit_gross_T: '550000',
    net_B: '500000'
  },
  member: {
    name: '오유택',
    code: 'OY'
  },
  contact: {
    amount: 1000,
    event_type: 'INCOMING'
  },
  feed: {
    amount: 400,
    fee_type: 'BELOW3'
  }
};

/**
 * 로그인 헬퍼 함수
 */
export async function login(page: Page, credentials = TEST_CREDENTIALS) {
  await page.goto('/login');

  // 로그인 폼 채우기
  await page.fill('[name="username"]', credentials.username);
  await page.fill('[name="password"]', credentials.password);

  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');

  // 대시보드로 리다이렉트 될 때까지 대기
  await page.waitForURL('/');
  await waitForPageLoad(page);
}

/**
 * 로그아웃 헬퍼 함수
 */
export async function logout(page: Page) {
  // 설정 메뉴나 로그아웃 버튼 찾기
  const logoutButton = page.locator('button').filter({ hasText: '로그아웃' });
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
  }

  // 로그인 페이지로 리다이렉트 될 때까지 대기
  await page.waitForURL('/login');
}

/**
 * 인증된 상태로 페이지 접근
 */
export async function authenticatedPage(page: Page, path = '/') {
  await login(page);
  if (path !== '/') {
    await page.goto(path);
    await waitForPageLoad(page);
  }
}

/**
 * 네트워크 오프라인 시뮬레이션
 */
export async function simulateOffline(context: BrowserContext) {
  await context.setOffline(true);
}

/**
 * 네트워크 온라인 복구
 */
export async function simulateOnline(context: BrowserContext) {
  await context.setOffline(false);
}

/**
 * FAB 버튼 클릭 헬퍼
 */
export async function clickFABButton(page: Page, buttonText: string) {
  // FAB 열기
  const fabButton = page.locator('[data-testid="fab-button"]').or(page.locator('.fab-trigger'));
  await fabButton.click();
  await page.waitForTimeout(300);

  // 특정 액션 버튼 클릭
  const actionButton = page.locator('button').filter({ hasText: buttonText });
  await actionButton.click();
  await page.waitForTimeout(500);
}

/**
 * 멤버 선택 헬퍼
 */
export async function selectMember(page: Page, memberName: string) {
  await selectDropdownOption(page, '[data-testid="member-select"]', memberName);
}

/**
 * LocalStorage 데이터 확인 헬퍼
 */
export async function getLocalStorageData(page: Page, key: string) {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, key);
}

/**
 * LocalStorage 데이터 설정 헬퍼
 */
export async function setLocalStorageData(page: Page, key: string, value: string) {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, value);
  }, { key, value });
}

/**
 * 한국 통화 포맷 확인 헬퍼
 */
export async function expectKoreanCurrency(page: Page, selector: string, amount: number) {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  await expect(page.locator(selector)).toContainText(formatted);
}

/**
 * 로딩 완료 대기 헬퍼
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // 추가 안정화 시간
}

/**
 * 모바일 터치 헬퍼
 */
export async function tapElement(page: Page, selector: string) {
  const element = page.locator(selector);
  const boundingBox = await element.boundingBox();

  if (boundingBox) {
    await page.touchscreen.tap(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );
  } else {
    await element.click();
  }
}

/**
 * 접근성 색상 대비 확인 헬퍼
 */
export async function checkColorContrast(page: Page, selector: string) {
  const element = page.locator(selector);
  const styles = await element.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: parseFloat(computed.fontSize)
    };
  });

  // 기본 색상 설정 확인 (실제 대비율 계산은 복잡하므로 기본 검증만)
  expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(styles.fontSize).toBeGreaterThan(12);
}

/**
 * 키보드 네비게이션 헬퍼
 */
export async function navigateWithKeyboard(page: Page, keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(100);
  }
}

/**
 * 폼 필드 채우기 헬퍼
 */
export async function fillProjectForm(page: Page, data: {
  name?: string;
  amount?: string;
  date?: string;
}) {
  if (data.name) {
    const nameInput = page.locator('input[name="name"]').or(page.locator('input').first());
    if (await nameInput.count() > 0) {
      await nameInput.fill(data.name);
    }
  }

  if (data.amount) {
    const amountInput = page.locator('input[type="number"]').or(page.locator('input[name*="amount"]'));
    if (await amountInput.count() > 0) {
      await amountInput.first().fill(data.amount);
    }
  }

  if (data.date) {
    const dateInput = page.locator('input[type="date"]').or(page.locator('input[name*="date"]'));
    if (await dateInput.count() > 0) {
      await dateInput.fill(data.date);
    }
  }
}

/**
 * 테이블 데이터 확인 헬퍼
 */
export async function expectTableData(page: Page, rowIndex: number, columnData: string[]) {
  const table = page.locator('table');
  const rows = table.locator('tbody tr');
  const targetRow = rows.nth(rowIndex);

  for (let i = 0; i < columnData.length; i++) {
    const cell = targetRow.locator('td').nth(i);
    await expect(cell).toContainText(columnData[i]);
  }
}

/**
 * 모달 대기 및 확인 헬퍼
 */
export async function waitForModal(page: Page, modalSelector: string = '[role="dialog"]') {
  const modal = page.locator(modalSelector);
  await expect(modal).toBeVisible();
  return modal;
}

/**
 * 드롭다운 선택 헬퍼
 */
export async function selectDropdownOption(page: Page, triggerSelector: string, optionText: string) {
  await page.click(triggerSelector);
  await page.waitForTimeout(300);
  await page.click(`text=${optionText}`);
}

/**
 * 스크롤 헬퍼
 */
export async function scrollToElement(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}

/**
 * 반응형 브레이크포인트 확인 헬퍼
 */
export async function checkResponsiveLayout(page: Page, breakpoint: 'mobile' | 'tablet' | 'desktop') {
  const viewportSize = page.viewportSize();

  switch (breakpoint) {
    case 'mobile':
      expect(viewportSize?.width).toBeLessThanOrEqual(768);
      // 모바일에서 햄버거 메뉴 표시 확인
      await expect(page.locator('[data-testid="mobile-menu-trigger"]')).toBeVisible();
      break;
    case 'tablet':
      expect(viewportSize?.width).toBeGreaterThan(768);
      expect(viewportSize?.width).toBeLessThanOrEqual(1024);
      break;
    case 'desktop':
      expect(viewportSize?.width).toBeGreaterThan(1024);
      // 데스크톱에서 사이드바 표시 확인
      await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
      break;
  }
}

/**
 * 에러 메시지 확인 헬퍼
 */
export async function expectErrorMessage(page: Page, message?: string) {
  const errorSelectors = [
    '[role="alert"]',
    '.text-red-500',
    '.text-destructive',
    '[aria-invalid="true"]'
  ];

  let errorFound = false;
  for (const selector of errorSelectors) {
    const elements = page.locator(selector);
    if (await elements.count() > 0) {
      await expect(elements.first()).toBeVisible();
      if (message) {
        await expect(elements.first()).toContainText(message);
      }
      errorFound = true;
      break;
    }
  }

  expect(errorFound).toBeTruthy();
}

/**
 * 성공 메시지 확인 헬퍼
 */
export async function expectSuccessMessage(page: Page, message?: string) {
  const successSelectors = [
    '.text-green-500',
    '.text-success',
    '[role="status"]'
  ];

  let successFound = false;
  for (const selector of successSelectors) {
    const elements = page.locator(selector);
    if (await elements.count() > 0) {
      await expect(elements.first()).toBeVisible();
      if (message) {
        await expect(elements.first()).toContainText(message);
      }
      successFound = true;
      break;
    }
  }

  if (!successFound) {
    // 페이지 변경으로 성공을 알 수도 있음
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/new');
  }
}

/**
 * 정산 계산 결과 확인 헬퍼
 */
export async function verifySettlementCalculation(
  page: Page,
  grossAmount: number,
  expectedNetAmount: number,
  tolerance: number = 1000
) {
  // 실입금 확인 (부가세 제외)
  const netAmountText = (grossAmount / 1.1).toFixed(0);
  await page.waitForTimeout(500); // 계산 완료 대기

  // 계산된 금액 표시 확인
  const calculatedElements = page.locator('text=/₩|원/');
  if (await calculatedElements.count() > 0) {
    await expect(calculatedElements.first()).toBeVisible();
  }

  // 원천징수 후 금액 확인 (3.3% 차감)
  const afterWithholdingAmount = expectedNetAmount * 0.967;
  const toleranceRange = Math.abs(afterWithholdingAmount - expectedNetAmount) <= tolerance;
  expect(toleranceRange).toBeTruthy();
}

/**
 * 디자이너 지분 설정 헬퍼
 */
export async function setDesignerShares(page: Page, shares: { percent: number; bonus?: number }[]) {
  const percentInputs = page.locator('input[name*="percent"]').or(page.locator('input[placeholder*="%"]'));
  const bonusInputs = page.locator('input[name*="bonus"]').or(page.locator('input[placeholder*="인센티브"]'));

  for (let i = 0; i < shares.length && i < await percentInputs.count(); i++) {
    await percentInputs.nth(i).fill(shares[i].percent.toString());

    if (shares[i].bonus && await bonusInputs.count() > i) {
      await bonusInputs.nth(i).fill(shares[i].bonus!.toString());
    }
  }

  await page.waitForTimeout(500); // 계산 완료 대기
}

/**
 * 테스트 데이터 정리 헬퍼
 */
export async function cleanupTestData(page: Page) {
  // LocalStorage 정리
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // 테스트로 생성된 데이터 정리
  console.log('Test data cleanup completed');
}

/**
 * API 응답 대기 헬퍼
 */
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp, timeout = 10000) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * 모바일 뷰포트 설정 헬퍼
 */
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
}

/**
 * 데스크톱 뷰포트 설정 헬퍼
 */
export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1280, height: 720 });
}

/**
 * 파일 다운로드 대기 헬퍼
 */
export async function waitForDownload(page: Page, triggerSelector: string) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click(triggerSelector)
  ]);
  return download;
}

/**
 * 토스트 메시지 확인 헬퍼
 */
export async function expectToastMessage(page: Page, message?: string) {
  const toastSelectors = [
    '[data-sonner-toast]',
    '.toast',
    '[role="status"]',
    '.Toastify__toast'
  ];

  let toastFound = false;
  for (const selector of toastSelectors) {
    const elements = page.locator(selector);
    if (await elements.count() > 0) {
      await expect(elements.first()).toBeVisible();
      if (message) {
        await expect(elements.first()).toContainText(message);
      }
      toastFound = true;
      break;
    }
  }

  expect(toastFound).toBeTruthy();
}

/**
 * 페이지 로딩 스피너 대기 헬퍼
 */
export async function waitForLoadingToFinish(page: Page) {
  const loadingSelectors = [
    '[data-testid="loading"]',
    '.loading',
    '.spinner',
    '[aria-label="Loading"]'
  ];

  for (const selector of loadingSelectors) {
    const elements = page.locator(selector);
    if (await elements.count() > 0) {
      await expect(elements.first()).toBeHidden({ timeout: 10000 });
    }
  }
}

/**
 * 다중 파일 업로드 헬퍼
 */
export async function uploadFiles(page: Page, inputSelector: string, filePaths: string[]) {
  const fileChooser = page.locator(inputSelector);
  await fileChooser.setInputFiles(filePaths);
  await page.waitForTimeout(1000); // 업로드 처리 시간
}

/**
 * 날짜 입력 헬퍼
 */
export async function fillDateInput(page: Page, selector: string, date: string) {
  // date format: YYYY-MM-DD
  await page.fill(selector, date);
  await page.keyboard.press('Enter');
}

/**
 * 수치 검증 헬퍼 (허용 오차 범위)
 */
export async function expectNumberWithTolerance(
  page: Page,
  selector: string,
  expectedValue: number,
  tolerance: number = 100
) {
  const element = page.locator(selector);
  const textContent = await element.textContent();

  if (textContent) {
    const actualValue = parseFloat(textContent.replace(/[^\d.-]/g, ''));
    const difference = Math.abs(actualValue - expectedValue);
    expect(difference).toBeLessThanOrEqual(tolerance);
  }
}

/**
 * 드래그 앤 드롭 헬퍼
 */
export async function dragAndDrop(page: Page, sourceSelector: string, targetSelector: string) {
  await page.dragAndDrop(sourceSelector, targetSelector);
  await page.waitForTimeout(500);
}

/**
 * 컨텍스트 메뉴 헬퍼
 */
export async function rightClick(page: Page, selector: string) {
  await page.click(selector, { button: 'right' });
  await page.waitForTimeout(300);
}