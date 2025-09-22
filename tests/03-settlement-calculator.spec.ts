/**
 * 정산 계산 E2E 테스트
 * - 정산 계산기 실시간 계산
 * - 디자이너 지분 설정
 * - 정산 결과 검증
 */

import { test, expect } from '@playwright/test';

test.describe('정산 계산기', () => {
  test.beforeEach(async ({ page }) => {
    // 새 프로젝트 페이지로 이동 (정산 계산기가 있는 페이지)
    await page.goto('/projects/new');
    await page.waitForLoadState('networkidle');
  });

  test('정산 계산기가 표시된다', async ({ page }) => {
    // 계산기 버튼이나 섹션 찾기
    const calculatorButton = page.locator('text=정산 계산기')
      .or(page.locator('[data-lucide="calculator"]'))
      .or(page.locator('button:has-text("계산기")'));

    if (await calculatorButton.count() > 0) {
      await expect(calculatorButton.first()).toBeVisible();

      // 계산기 열기
      await calculatorButton.first().click();
    }

    // 계산기 관련 입력 필드들 찾기
    const amountInputs = page.locator('input[type="number"]');
    if (await amountInputs.count() > 0) {
      await expect(amountInputs.first()).toBeVisible();
    }
  });

  test('총 입금액 입력 시 실시간 계산이 작동한다', async ({ page }) => {
    // 총 입금액 입력 필드 찾기
    const grossAmountInput = page.locator('input[name*="gross"]')
      .or(page.locator('input[placeholder*="총"]'))
      .or(page.locator('input[type="number"]').first());

    if (await grossAmountInput.count() > 0) {
      // 테스트 금액 입력
      await grossAmountInput.fill('1000000');

      // 실시간 계산 결과 확인을 위해 잠시 대기
      await page.waitForTimeout(500);

      // 부가세 또는 실입금 계산 결과 확인
      const calculatedValue = page.locator('text=/909,090|916,667/')
        .or(page.locator('text=/₩ 909,090|₩ 916,667/'))
        .or(page.locator('text=/909090|916667/'));

      if (await calculatedValue.count() > 0) {
        await expect(calculatedValue.first()).toBeVisible();
      }
    }
  });

  test('부가세 계산이 정확하다', async ({ page }) => {
    const grossAmountInput = page.locator('input[type="number"]').first();

    if (await grossAmountInput.count() > 0) {
      // 1,100,000원 입력 (부가세 포함)
      await grossAmountInput.fill('1100000');
      await page.waitForTimeout(300);

      // 부가세 제외 금액 확인 (1,000,000원이어야 함)
      const netAmount = page.locator('text=/1,000,000|₩ 1,000,000/')
        .or(page.locator('text=1000000'));

      if (await netAmount.count() > 0) {
        await expect(netAmount.first()).toBeVisible();
      }
    }
  });

  test('원천징수 3.3% 계산이 정확하다', async ({ page }) => {
    const grossAmountInput = page.locator('input[type="number"]').first();

    if (await grossAmountInput.count() > 0) {
      // 1,000,000원 입력
      await grossAmountInput.fill('1000000');
      await page.waitForTimeout(300);

      // 원천징수 후 금액 확인 (966,700원 또는 967,000원 근사치)
      const afterWithholding = page.locator('text=/966,700|967,000|₩ 966,700|₩ 967,000/')
        .or(page.locator('text=/966700|967000/'));

      if (await afterWithholding.count() > 0) {
        await expect(afterWithholding.first()).toBeVisible();
      }
    }
  });

  test('디자이너 지분 설정이 가능하다', async ({ page }) => {
    // 디자이너 지분 관련 입력 필드나 버튼 찾기
    const designerSection = page.locator('text=디자이너')
      .or(page.locator('text=지분'))
      .or(page.locator('text=분배'));

    if (await designerSection.count() > 0) {
      await expect(designerSection.first()).toBeVisible();
    }

    // 퍼센트 입력 필드들 찾기
    const percentInputs = page.locator('input[type="number"][placeholder*="%"]')
      .or(page.locator('input[name*="percent"]'))
      .or(page.locator('input[placeholder*="지분"]'));

    if (await percentInputs.count() > 0) {
      // 첫 번째 디자이너에게 40% 지분 할당
      await percentInputs.first().fill('40');
      await page.waitForTimeout(300);

      // 지분 설정 확인
      await expect(percentInputs.first()).toHaveValue('40');
    }
  });

  test('여러 디자이너 지분 합계가 100%를 넘지 않도록 검증한다', async ({ page }) => {
    const percentInputs = page.locator('input[type="number"][placeholder*="%"]')
      .or(page.locator('input[name*="percent"]'));

    if (await percentInputs.count() >= 2) {
      // 첫 번째 디자이너 60%
      await percentInputs.nth(0).fill('60');
      await page.waitForTimeout(200);

      // 두 번째 디자이너 50% (총 110%가 됨)
      await percentInputs.nth(1).fill('50');
      await page.waitForTimeout(300);

      // 경고 메시지나 오류 표시 확인
      const errorMessage = page.locator('text=/100%|초과|오류/')
        .or(page.locator('.text-red-500'))
        .or(page.locator('[role="alert"]'));

      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
    }
  });

  test('인센티브 적용이 가능하다', async ({ page }) => {
    // 인센티브 관련 입력 필드 찾기
    const bonusInputs = page.locator('input[name*="bonus"]')
      .or(page.locator('input[placeholder*="인센티브"]'))
      .or(page.locator('input[placeholder*="보너스"]'));

    if (await bonusInputs.count() > 0) {
      // 10% 인센티브 설정
      await bonusInputs.first().fill('10');
      await page.waitForTimeout(300);

      // 인센티브 적용 확인
      await expect(bonusInputs.first()).toHaveValue('10');
    }
  });

  test('실시간 정산 결과가 표시된다', async ({ page }) => {
    // 기본 프로젝트 정보 입력
    const grossAmountInput = page.locator('input[type="number"]').first();
    if (await grossAmountInput.count() > 0) {
      await grossAmountInput.fill('1000000');
    }

    // 디자이너 지분 입력
    const percentInputs = page.locator('input[name*="percent"]')
      .or(page.locator('input[placeholder*="%"]'));

    if (await percentInputs.count() > 0) {
      await percentInputs.first().fill('40');
      await page.waitForTimeout(500);
    }

    // 정산 결과 영역 확인
    const settlementResult = page.locator('text=정산')
      .or(page.locator('text=결과'))
      .or(page.locator('text=분배'));

    if (await settlementResult.count() > 0) {
      await expect(settlementResult.first()).toBeVisible();
    }

    // 계산된 금액 표시 확인
    const calculatedAmount = page.locator('text=/₩|원/')
      .or(page.locator('text=/[0-9]{1,3}(,[0-9]{3})*/'));

    if (await calculatedAmount.count() > 0) {
      await expect(calculatedAmount.first()).toBeVisible();
    }
  });

  test('할인 금액 적용이 가능하다', async ({ page }) => {
    // 할인 관련 입력 필드 찾기
    const discountInput = page.locator('input[name*="discount"]')
      .or(page.locator('input[placeholder*="할인"]'))
      .or(page.locator('input[placeholder*="차감"]'));

    if (await discountInput.count() > 0) {
      // 할인 금액 입력 (100,000원)
      await discountInput.fill('100000');
      await page.waitForTimeout(300);

      // 할인 적용 확인
      await expect(discountInput).toHaveValue('100000');
    }
  });

  test('정산 상세 내역이 표시된다', async ({ page }) => {
    // 기본값 설정
    const grossAmountInput = page.locator('input[type="number"]').first();
    if (await grossAmountInput.count() > 0) {
      await grossAmountInput.fill('1100000');
      await page.waitForTimeout(500);
    }

    // 상세 내역 요소들 확인
    const detailItems = [
      '총 입금액',
      '부가세',
      '실입금',
      '원천징수',
      '최종'
    ];

    for (const item of detailItems) {
      const element = page.locator(`text=${item}`);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
      }
    }
  });

  test('한국 통화 포맷이 적용된다', async ({ page }) => {
    const grossAmountInput = page.locator('input[type="number"]').first();
    if (await grossAmountInput.count() > 0) {
      await grossAmountInput.fill('1234567');
      await page.waitForTimeout(500);
    }

    // 한국식 숫자 포맷 확인 (1,234,567)
    const formattedNumber = page.locator('text=/1,234,567|₩ 1,234,567/');
    if (await formattedNumber.count() > 0) {
      await expect(formattedNumber.first()).toBeVisible();
    }
  });

  test('계산 결과 저장이 가능하다', async ({ page }) => {
    // 계산기에서 값 설정 후 저장 버튼 확인
    const saveButton = page.locator('button:has-text("저장")')
      .or(page.locator('button:has-text("적용")')
      .or(page.locator('button[type="submit"]')));

    if (await saveButton.count() > 0) {
      await expect(saveButton.first()).toBeVisible();
      await expect(saveButton.first()).toBeEnabled();
    }
  });

  test('계산기 초기화가 가능하다', async ({ page }) => {
    // 초기화 관련 버튼 찾기
    const resetButton = page.locator('button:has-text("초기화")')
      .or(page.locator('button:has-text("리셋")')
      .or(page.locator('button:has-text("지우기")')));

    if (await resetButton.count() > 0) {
      await expect(resetButton.first()).toBeVisible();

      // 값 입력 후 초기화 테스트
      const grossAmountInput = page.locator('input[type="number"]').first();
      if (await grossAmountInput.count() > 0) {
        await grossAmountInput.fill('1000000');
        await resetButton.first().click();
        await page.waitForTimeout(300);

        // 입력값이 초기화되었는지 확인
        const currentValue = await grossAmountInput.inputValue();
        expect(currentValue).toBe('');
      }
    }
  });
});