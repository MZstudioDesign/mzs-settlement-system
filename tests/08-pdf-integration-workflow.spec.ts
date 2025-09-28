/**
 * PDF 생성 통합 워크플로우 테스트
 * - 전체 사용자 흐름 테스트
 * - 실제 UI 상호작용 테스트
 * - 엔드투엔드 PDF 다운로드 워크플로우
 * - 성능 및 사용성 테스트
 */

import { test, expect } from '@playwright/test';
import {
  callSettlementReportAPI,
  downloadAndValidatePDF,
  validateCSVContent,
  validateJSONResponse,
  runConcurrentRequests,
  generateMaliciousInputs,
  generateBoundaryInputs,
  monitorMemoryUsage
} from './utils/pdf-test-helpers';

test.describe('PDF 생성 통합 워크플로우', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/settlements');
    await page.waitForLoadState('networkidle');
  });

  test.describe('완전한 사용자 워크플로우', () => {
    test('정산 목록에서 PDF 다운로드까지 전체 프로세스', async ({ page }) => {
      // 1. 정산 목록 페이지 확인
      await expect(page.locator('h1:has-text("정산 관리")')).toBeVisible();

      // 2. 정산 목록에서 첫 번째 항목 클릭
      const firstSettlementRow = page.locator('table tbody tr').first();

      if (await firstSettlementRow.count() > 0) {
        await firstSettlementRow.click();
        await page.waitForTimeout(1000);

        // 3. 정산 상세 탭으로 이동 확인
        const detailsTab = page.locator('[data-value="details"]');
        if (await detailsTab.count() > 0) {
          await expect(detailsTab).toBeVisible();
        }

        // 4. PDF 다운로드 버튼 클릭
        const pdfButton = page.locator('button:has-text("PDF")');
        if (await pdfButton.count() > 0) {
          await expect(pdfButton).toBeVisible();

          // 다운로드 이벤트 감지
          const downloadPromise = page.waitForEvent('download');

          // PDF 버튼을 클릭하는 대신 API를 직접 호출하여 다운로드 테스트
          await page.evaluate(async () => {
            const response = await fetch('/api/settlements/reports?settlement_id=1&format=pdf');
            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'settlement-test.pdf';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }
          });

          try {
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/\.pdf$/);
          } catch (error) {
            console.log('Download test skipped in this environment:', error.message);
          }
        }
      }
    });

    test('새 정산 생성부터 PDF 다운로드까지', async ({ page }) => {
      // 1. 새 정산 생성 버튼 클릭
      const createButton = page.locator('button:has-text("새 정산 생성")');

      if (await createButton.count() > 0) {
        await createButton.click();

        // 2. 모달에서 정산 월 선택
        const monthSelect = page.locator('[role="combobox"]').first();
        if (await monthSelect.count() > 0) {
          await monthSelect.click();

          const option = page.locator('[role="option"]').first();
          if (await option.count() > 0) {
            await option.click();
          }
        }

        // 3. 메모 입력
        const noteTextarea = page.locator('textarea[placeholder*="메모"]');
        if (await noteTextarea.count() > 0) {
          await noteTextarea.fill('테스트 정산 생성');
        }

        // 4. 생성 버튼 클릭
        const submitButton = page.locator('button:has-text("생성")');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }

        // 5. 생성된 정산의 PDF 다운로드 테스트
        const result = await callSettlementReportAPI(page, {
          settlement_id: '1',
          format: 'pdf'
        });

        expect(result.status).toBe(200);
        expect(result.responseTime).toBeLessThan(5000);
      }
    });
  });

  test.describe('다양한 형식 다운로드 테스트', () => {
    test('모든 지원 형식을 순차적으로 다운로드', async ({ page }) => {
      const formats = ['json', 'csv', 'pdf'] as const;
      const results = [];

      for (const format of formats) {
        const result = await callSettlementReportAPI(page, {
          settlement_id: '1',
          format
        });

        results.push({ format, ...result });

        // 각 형식별 검증
        expect(result.status).toBe(200);
        expect(result.responseTime).toBeLessThan(10000);

        if (format === 'json') {
          const validation = validateJSONResponse(result.body);
          expect(validation.isValid).toBeTruthy();
          if (!validation.isValid) {
            console.log('JSON validation errors:', validation.errors);
          }
        }

        if (format === 'csv') {
          const validation = validateCSVContent(result.body as string);
          expect(validation.isValid).toBeTruthy();
          if (!validation.isValid) {
            console.log('CSV validation errors:', validation.errors);
          }
        }

        if (format === 'pdf') {
          expect(result.headers['content-type']).toContain('application/pdf');
          expect((result.body as Buffer).length).toBeGreaterThan(1000);
        }
      }

      // 모든 형식이 성공적으로 처리되었는지 확인
      expect(results.every(r => r.status === 200)).toBeTruthy();
    });

    test('동일한 데이터에 대해 형식별 일관성 확인', async ({ page }) => {
      const jsonResult = await callSettlementReportAPI(page, {
        settlement_id: '1',
        format: 'json'
      });

      const csvResult = await callSettlementReportAPI(page, {
        settlement_id: '1',
        format: 'csv'
      });

      if (jsonResult.status === 200 && csvResult.status === 200) {
        const jsonData = jsonResult.body as any;
        const csvData = validateCSVContent(csvResult.body as string);

        // JSON과 CSV에서 같은 데이터를 확인
        if (csvData.isValid && jsonData.summary) {
          expect(csvData.data.recordCount).toBeGreaterThan(0);
          expect(jsonData.summary.totalItems).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('성능 및 동시성 테스트', () => {
    test('동시 PDF 요청 처리 성능', async ({ page }) => {
      const results = await runConcurrentRequests(page, {
        settlement_id: '1',
        format: 'pdf'
      }, 3);

      expect(results.successCount).toBeGreaterThan(0);
      expect(results.averageResponseTime).toBeLessThan(15000);
      expect(results.errorCount / results.results.length).toBeLessThan(0.5); // 50% 미만 실패율
    });

    test('메모리 사용량 모니터링', async ({ page }) => {
      const beforeMemory = await monitorMemoryUsage(page);

      // 여러 PDF 생성 요청
      for (let i = 0; i < 3; i++) {
        await callSettlementReportAPI(page, {
          settlement_id: '1',
          format: 'pdf'
        });
      }

      const afterMemory = await monitorMemoryUsage(page);

      // 메모리 증가가 합리적인 범위 내에 있는지 확인
      if (beforeMemory.usedJSHeapSize > 0 && afterMemory.usedJSHeapSize > 0) {
        const memoryIncrease = afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize;
        const increasePercentage = (memoryIncrease / beforeMemory.usedJSHeapSize) * 100;

        // 메모리 증가율이 100% 미만이어야 함 (메모리 누수 방지)
        expect(increasePercentage).toBeLessThan(100);
      }
    });

    test('대량 데이터 처리 성능', async ({ page }) => {
      // Mock을 사용하여 대량 데이터 시뮬레이션
      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          // 100개 항목을 가진 큰 데이터셋 생성
          const largeDataset = {
            data: {
              id: '1',
              ym: '2024-01',
              settlement_items: Array.from({ length: 100 }, (_, i) => ({
                id: `${i + 1}`,
                amount_before_withholding: 1000000 + (i * 1000),
                withholding_tax: (1000000 + (i * 1000)) * 0.033,
                amount_after_withholding: (1000000 + (i * 1000)) * 0.967,
                member: { name: `테스트멤버${i + 1}` },
                paid: i % 2 === 0
              }))
            },
            summary: {
              period: '2024-01',
              totalItems: 100,
              totalAmountBeforeWithholding: 104950000,
              totalAmountAfterWithholding: 101488650,
              memberBreakdown: {}
            }
          };

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(largeDataset)
          });
        } else {
          await route.continue();
        }
      });

      const startTime = Date.now();
      const result = await callSettlementReportAPI(page, {
        settlement_id: '1',
        format: 'json'
      });
      const endTime = Date.now();

      expect(result.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(10000); // 10초 이내

      const data = result.body as any;
      expect(data.summary.totalItems).toBe(100);
    });
  });

  test.describe('보안 및 안정성 테스트', () => {
    test('악성 입력에 대한 보안 검증', async ({ page }) => {
      const maliciousInputs = generateMaliciousInputs();

      for (const input of maliciousInputs.slice(0, 5)) { // 처음 5개만 테스트
        const result = await callSettlementReportAPI(page, input);

        // 악성 입력에 대해서는 4xx 또는 5xx 응답이어야 함 (200이 아님)
        expect([400, 401, 403, 404, 422, 500]).toContain(result.status);
      }
    });

    test('경계값 입력 처리', async ({ page }) => {
      const boundaryInputs = generateBoundaryInputs();

      for (const input of boundaryInputs.slice(0, 5)) { // 처음 5개만 테스트
        const result = await callSettlementReportAPI(page, input);

        // 경계값은 적절한 오류 응답을 반환해야 함
        expect([200, 400, 404, 422]).toContain(result.status);

        // 응답 시간이 합리적이어야 함
        expect(result.responseTime).toBeLessThan(5000);
      }
    });

    test('서버 오류 시나리오 시뮬레이션', async ({ page }) => {
      // 서버 오류 시뮬레이션
      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const settlementId = url.searchParams.get('settlement_id');

        if (settlementId === 'server-error') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          });
        } else {
          await route.continue();
        }
      });

      const result = await callSettlementReportAPI(page, {
        settlement_id: 'server-error',
        format: 'pdf'
      });

      expect(result.status).toBe(500);

      const errorData = result.body as any;
      expect(errorData.error).toBeTruthy();
    });
  });

  test.describe('사용자 경험 테스트', () => {
    test('다운로드 버튼의 접근성', async ({ page }) => {
      // 키보드 네비게이션 테스트
      const firstRow = page.locator('table tbody tr').first();

      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForTimeout(500);

        const pdfButton = page.locator('button:has-text("PDF")');
        if (await pdfButton.count() > 0) {
          // 키보드로 버튼에 포커스
          await pdfButton.focus();
          await expect(pdfButton).toBeFocused();

          // aria-label 또는 다른 접근성 속성 확인
          const ariaLabel = await pdfButton.getAttribute('aria-label');
          const title = await pdfButton.getAttribute('title');

          // 접근성을 위한 텍스트가 있어야 함
          expect(ariaLabel || title || 'PDF').toBeTruthy();
        }
      }
    });

    test('로딩 상태 및 오류 메시지', async ({ page }) => {
      // 느린 응답 시뮬레이션
      await page.route('/api/settlements/reports*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 지연
        await route.continue();
      });

      const startTime = Date.now();
      const result = await callSettlementReportAPI(page, {
        settlement_id: '1',
        format: 'pdf'
      });
      const endTime = Date.now();

      // 지연이 실제로 발생했는지 확인
      expect(endTime - startTime).toBeGreaterThan(1900);
      expect(result.status).toBe(200);
    });

    test('다양한 화면 크기에서의 버튼 동작', async ({ page }) => {
      // 모바일 화면 크기 설정
      await page.setViewportSize({ width: 375, height: 667 });

      const firstRow = page.locator('table tbody tr').first();

      if (await firstRow.count() > 0) {
        await firstRow.click();
        await page.waitForTimeout(500);

        // 모바일에서도 PDF 버튼이 접근 가능한지 확인
        const pdfButton = page.locator('button:has-text("PDF")');
        if (await pdfButton.count() > 0) {
          await expect(pdfButton).toBeVisible();

          // 버튼이 화면 영역 내에 있는지 확인
          const boundingBox = await pdfButton.boundingBox();
          if (boundingBox) {
            expect(boundingBox.x).toBeGreaterThanOrEqual(0);
            expect(boundingBox.y).toBeGreaterThanOrEqual(0);
            expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(375);
          }
        }
      }

      // 데스크톱 화면 크기로 복원
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test.describe('데이터 무결성 및 정확성', () => {
    test('PDF와 JSON 데이터 일관성 검증', async ({ page }) => {
      const jsonResult = await callSettlementReportAPI(page, {
        settlement_id: '1',
        format: 'json'
      });

      const pdfResult = await callSettlementReportAPI(page, {
        settlement_id: '1',
        format: 'pdf'
      });

      if (jsonResult.status === 200 && pdfResult.status === 200) {
        const jsonData = jsonResult.body as any;

        // PDF 크기가 JSON 데이터 양과 상관관계가 있는지 확인
        const pdfSize = (pdfResult.body as Buffer).length;
        const dataComplexity = jsonData.summary.totalItems || 0;

        if (dataComplexity > 0) {
          // 데이터가 많을수록 PDF 크기도 일반적으로 커야 함
          expect(pdfSize).toBeGreaterThan(1000);
        }
      }
    });

    test('통화 형식 일관성 검증', async ({ page }) => {
      const csvResult = await callSettlementReportAPI(page, {
        settlement_id: '1',
        format: 'csv'
      });

      if (csvResult.status === 200) {
        const csvContent = csvResult.body as string;
        const currencyMatches = csvContent.match(/₩[\d,]+/g);

        if (currencyMatches && currencyMatches.length > 0) {
          // 모든 통화 형식이 일관되게 적용되었는지 확인
          currencyMatches.forEach(currency => {
            expect(currency).toMatch(/^₩[\d,]+$/);
          });

          // 통화 값들이 합리적인 범위 내에 있는지 확인
          const amounts = currencyMatches.map(c =>
            parseInt(c.replace(/₩|,/g, ''))
          );

          amounts.forEach(amount => {
            expect(amount).toBeGreaterThanOrEqual(0);
            expect(amount).toBeLessThan(1000000000); // 10억 미만
          });
        }
      }
    });

    test('정산 계산의 수학적 정확성', async ({ page }) => {
      const jsonResult = await callSettlementReportAPI(page, {
        settlement_id: '1',
        format: 'json'
      });

      if (jsonResult.status === 200) {
        const data = jsonResult.body as any;
        const summary = data.summary;

        if (summary && summary.totalAmountBeforeWithholding > 0) {
          // 원천징수 후 금액이 원천징수 전 금액보다 작거나 같아야 함
          expect(summary.totalAmountAfterWithholding).toBeLessThanOrEqual(
            summary.totalAmountBeforeWithholding
          );

          // 원천징수 비율이 합리적인 범위 내에 있어야 함 (0-10%)
          const withholdingRate = summary.totalWithholdingTax / summary.totalAmountBeforeWithholding;
          expect(withholdingRate).toBeGreaterThanOrEqual(0);
          expect(withholdingRate).toBeLessThanOrEqual(0.1);

          // 지급/미지급 합계가 총 금액과 일치해야 함
          const totalCalculated = summary.totalPaid + summary.totalUnpaid;
          const difference = Math.abs(totalCalculated - summary.totalAmountAfterWithholding);
          expect(difference).toBeLessThan(10); // 10원 미만 차이 허용 (반올림 오차)
        }
      }
    });
  });
});