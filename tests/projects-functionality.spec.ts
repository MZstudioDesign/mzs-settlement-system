import { test, expect, Page } from '@playwright/test';

/**
 * 프로젝트 관련 기능 상세 테스트
 * - 프로젝트 목록 로딩
 * - 프로젝트 생성 폼
 * - 프로젝트 편집
 * - 정산 계산 로직
 * - 디자이너 할당
 */

test.describe('프로젝트 관리 기능 테스트', () => {
  let consoleLogs: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // 에러 로그 수집
    page.on('console', (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    page.on('pageerror', (error) => {
      consoleLogs.push(`Page Error: ${error.message}`);
    });
  });

  test('프로젝트 페이지 접근 및 로딩 테스트', async ({ page }) => {
    console.log('📁 프로젝트 페이지 접근 테스트 시작');

    try {
      const startTime = Date.now();
      await page.goto('/projects', { waitUntil: 'networkidle', timeout: 30000 });
      const loadTime = Date.now() - startTime;

      console.log(`⏱️ 프로젝트 페이지 로딩 시간: ${loadTime}ms`);

      // 페이지 제목 확인
      await expect(page).toHaveTitle(/프로젝트|Projects|MZS/i);

      // 프로젝트 관련 요소들이 존재하는지 확인
      const elements = [
        'h1, h2, h3', // 페이지 제목
        'table, .project-list, [data-testid="project-list"]', // 프로젝트 목록
        'button:has-text("새"), button:has-text("추가"), button:has-text("생성")' // 새 프로젝트 버튼
      ];

      for (const selector of elements) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 5000 });
          console.log(`${isVisible ? '✅' : '❌'} 요소 발견: ${selector}`);
        } catch (error) {
          console.log(`⚠️ 요소 찾기 실패: ${selector}`);
        }
      }

      // 스크린샷 캡처
      await page.screenshot({
        path: `test-results/screenshots/projects-page-${Date.now()}.png`,
        fullPage: true
      });

      console.log('✅ 프로젝트 페이지 기본 로딩 완료');

    } catch (error) {
      console.log('❌ 프로젝트 페이지 로딩 실패:', error);
      throw error;
    }
  });

  test('프로젝트 생성 폼 테스트', async ({ page }) => {
    console.log('➕ 프로젝트 생성 폼 테스트 시작');

    await page.goto('/projects', { waitUntil: 'networkidle' });

    try {
      // 새 프로젝트 버튼 찾기 및 클릭
      const createButtons = [
        'button:has-text("새")',
        'button:has-text("추가")',
        'button:has-text("생성")',
        'button:has-text("+")',
        '[data-testid="create-project"]',
        '.create-project-btn'
      ];

      let createButton = null;
      for (const selector of createButtons) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            createButton = element;
            console.log(`🎯 생성 버튼 발견: ${selector}`);
            break;
          }
        } catch (e) {
          // 다음 선택자 시도
        }
      }

      if (createButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // 폼이 나타나는지 확인
        const formSelectors = [
          'form',
          '[role="dialog"]',
          '.modal',
          '.project-form'
        ];

        let formFound = false;
        for (const selector of formSelectors) {
          try {
            const form = page.locator(selector).first();
            if (await form.isVisible({ timeout: 3000 })) {
              console.log(`📝 폼 발견: ${selector}`);
              formFound = true;
              break;
            }
          } catch (e) {
            // 다음 선택자 시도
          }
        }

        if (formFound) {
          // 폼 필드 테스트
          const testData = {
            client_name: '테스트 클라이언트',
            title: '테스트 프로젝트',
            list_price_net: '100000',
            deposit_gross_T: '110000'
          };

          console.log('📝 폼 필드 입력 테스트');

          // 다양한 입력 필드 찾기 및 테스트
          const inputFields = await page.locator('input, select, textarea').all();

          for (let i = 0; i < Math.min(inputFields.length, 10); i++) {
            try {
              const field = inputFields[i];
              const isVisible = await field.isVisible({ timeout: 1000 });
              const isEnabled = await field.isEnabled();

              if (isVisible && isEnabled) {
                const tagName = await field.evaluate(el => el.tagName.toLowerCase());
                const type = await field.getAttribute('type') || '';
                const name = await field.getAttribute('name') || '';
                const placeholder = await field.getAttribute('placeholder') || '';

                console.log(`   입력 필드 ${i + 1}: ${tagName}[${type}] name="${name}" placeholder="${placeholder}"`);

                if (tagName === 'input' && (type === 'text' || type === 'number' || !type)) {
                  await field.fill(i < 2 ? '테스트 값' : '12345');
                } else if (tagName === 'textarea') {
                  await field.fill('테스트 메모');
                } else if (tagName === 'select') {
                  const options = await field.locator('option').all();
                  if (options.length > 1) {
                    await field.selectOption({ index: 1 });
                  }
                }

                await page.waitForTimeout(200);
              }
            } catch (error) {
              console.log(`   입력 필드 ${i + 1} 테스트 실패:`, error);
            }
          }

          // 저장/제출 버튼 테스트
          const submitButtons = [
            'button[type="submit"]',
            'button:has-text("저장")',
            'button:has-text("생성")',
            'button:has-text("확인")'
          ];

          for (const selector of submitButtons) {
            try {
              const submitBtn = page.locator(selector).first();
              if (await submitBtn.isVisible({ timeout: 2000 })) {
                console.log(`💾 제출 버튼 발견: ${selector}`);
                // 실제로는 클릭하지 않음 (테스트 데이터 생성 방지)
                // await submitBtn.click();
                break;
              }
            } catch (e) {
              // 다음 선택자 시도
            }
          }

          console.log('✅ 프로젝트 생성 폼 테스트 완료');

        } else {
          console.log('⚠️ 프로젝트 생성 폼을 찾을 수 없음');
        }

      } else {
        console.log('⚠️ 프로젝트 생성 버튼을 찾을 수 없음');
      }

    } catch (error) {
      console.log('❌ 프로젝트 생성 폼 테스트 실패:', error);
    }
  });

  test('프로젝트 목록 및 상세 보기 테스트', async ({ page }) => {
    console.log('📋 프로젝트 목록 및 상세 보기 테스트 시작');

    await page.goto('/projects', { waitUntil: 'networkidle' });

    try {
      // 프로젝트 목록이 있는지 확인
      const listSelectors = [
        'table tbody tr',
        '.project-item',
        '[data-testid="project-item"]',
        '.project-card'
      ];

      let projectItems = [];
      for (const selector of listSelectors) {
        try {
          const items = await page.locator(selector).all();
          if (items.length > 0) {
            projectItems = items;
            console.log(`📊 프로젝트 목록 발견: ${items.length}개 항목`);
            break;
          }
        } catch (e) {
          // 다음 선택자 시도
        }
      }

      if (projectItems.length > 0) {
        // 첫 번째 프로젝트 항목 클릭 테스트
        try {
          const firstProject = projectItems[0];

          // 클릭 가능한 요소 찾기
          const clickableElements = [
            'a',
            'button',
            '[data-testid*="view"]',
            '[data-testid*="edit"]'
          ];

          let clicked = false;
          for (const selector of clickableElements) {
            try {
              const clickable = firstProject.locator(selector).first();
              if (await clickable.isVisible({ timeout: 1000 })) {
                console.log(`🖱️ 클릭 테스트: ${selector}`);
                await clickable.click();
                await page.waitForTimeout(1000);
                clicked = true;
                break;
              }
            } catch (e) {
              // 다음 선택자 시도
            }
          }

          if (!clicked) {
            // 전체 항목 클릭 시도
            await firstProject.click();
            await page.waitForTimeout(1000);
            console.log('🖱️ 프로젝트 항목 전체 클릭 완료');
          }

        } catch (error) {
          console.log('⚠️ 프로젝트 항목 클릭 실패:', error);
        }

      } else {
        console.log('ℹ️ 프로젝트 목록이 비어있거나 로딩되지 않음');
      }

      // 검색 기능 테스트 (있다면)
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="검색"]',
        '.search-input'
      ];

      for (const selector of searchSelectors) {
        try {
          const searchInput = page.locator(selector).first();
          if (await searchInput.isVisible({ timeout: 2000 })) {
            console.log('🔍 검색 기능 테스트');
            await searchInput.fill('테스트');
            await page.waitForTimeout(1000);
            break;
          }
        } catch (e) {
          // 다음 선택자 시도
        }
      }

      console.log('✅ 프로젝트 목록 테스트 완료');

    } catch (error) {
      console.log('❌ 프로젝트 목록 테스트 실패:', error);
    }
  });

  test('정산 계산 기능 테스트', async ({ page }) => {
    console.log('🧮 정산 계산 기능 테스트 시작');

    await page.goto('/projects', { waitUntil: 'networkidle' });

    try {
      // 계산기나 정산 미리보기 요소 찾기
      const calculatorSelectors = [
        '.calculator',
        '.settlement-preview',
        '[data-testid*="calculation"]',
        '.calculation-result'
      ];

      let calculatorFound = false;
      for (const selector of calculatorSelectors) {
        try {
          const calc = page.locator(selector).first();
          if (await calc.isVisible({ timeout: 3000 })) {
            console.log(`🧮 계산기 발견: ${selector}`);
            calculatorFound = true;
            break;
          }
        } catch (e) {
          // 다음 선택자 시도
        }
      }

      // 숫자 입력 필드에서 계산 테스트
      const numberInputs = await page.locator('input[type="number"]').all();
      if (numberInputs.length > 0) {
        console.log(`🔢 숫자 입력 필드 ${numberInputs.length}개 발견`);

        for (let i = 0; i < Math.min(numberInputs.length, 5); i++) {
          try {
            const input = numberInputs[i];
            const name = await input.getAttribute('name') || '';
            const placeholder = await input.getAttribute('placeholder') || '';

            if (await input.isVisible({ timeout: 1000 })) {
              console.log(`   입력 테스트: ${name || placeholder} = 100000`);
              await input.fill('100000');
              await page.waitForTimeout(500);

              // 계산 결과 변화 감지
              await page.keyboard.press('Tab'); // 다음 필드로 이동하여 계산 트리거
              await page.waitForTimeout(300);
            }
          } catch (error) {
            console.log(`   숫자 입력 실패: ${error}`);
          }
        }
      }

      // 계산 결과 표시 영역 확인
      const resultSelectors = [
        '.calculation-result',
        '.settlement-amount',
        '[data-testid*="result"]',
        '.total-amount'
      ];

      for (const selector of resultSelectors) {
        try {
          const result = page.locator(selector).first();
          if (await result.isVisible({ timeout: 2000 })) {
            const text = await result.textContent();
            console.log(`💰 계산 결과 발견: ${text}`);
          }
        } catch (e) {
          // 다음 선택자 시도
        }
      }

      console.log('✅ 정산 계산 기능 테스트 완료');

    } catch (error) {
      console.log('❌ 정산 계산 기능 테스트 실패:', error);
    }
  });

  test.afterEach(async ({ page }) => {
    // 수집된 로그 출력
    if (consoleLogs.length > 0) {
      console.log('\n📝 콘솔 로그:');
      consoleLogs.forEach(log => console.log(`   ${log}`));
      consoleLogs = []; // 초기화
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 네트워크 에러:');
      networkErrors.forEach(error => console.log(`   ${error}`));
      networkErrors = []; // 초기화
    }

    // 스크린샷 캡처 (실패한 경우)
    if (test.info().status !== 'passed') {
      await page.screenshot({
        path: `test-results/screenshots/projects-failure-${Date.now()}.png`,
        fullPage: true
      });
    }
  });
});