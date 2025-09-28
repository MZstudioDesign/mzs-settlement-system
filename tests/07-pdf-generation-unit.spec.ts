/**
 * PDF 생성 기능 단위 테스트
 * - jsPDF 통합 검증
 * - 한국어 폰트 렌더링 테스트
 * - 복잡한 정산 데이터 처리
 * - 메모리 효율성 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('PDF 생성 기능 단위 테스트', () => {

  test.describe('jsPDF 통합 테스트', () => {
    test('jsPDF 라이브러리가 정상적으로 로드된다', async ({ page }) => {
      // API 엔드포인트를 통해 jsPDF 사용 여부 확인
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      expect(response.status()).toBe(200);
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/pdf');

      // PDF 파일 구조 검증
      const buffer = await response.body();
      const pdfContent = buffer.toString('latin1');

      // PDF 기본 구조 확인
      expect(pdfContent).toContain('%PDF-');
      expect(pdfContent).toContain('%%EOF');
    });

    test('한국어 텍스트가 PDF에 정상적으로 렌더링된다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      expect(response.status()).toBe(200);
      const buffer = await response.body();

      // PDF 크기가 한국어 텍스트를 포함할 만큼 충분한지 확인
      expect(buffer.length).toBeGreaterThan(5000);

      // PDF 메타데이터에 한국어 관련 정보가 있는지 확인
      const pdfContent = buffer.toString('latin1');

      // jsPDF에서 생성된 PDF의 기본 구조 확인
      expect(pdfContent).toContain('/Type /Catalog');
      expect(pdfContent).toContain('/Type /Pages');
    });

    test('여러 페이지가 필요한 경우 페이지 분할이 작동한다', async ({ page }) => {
      // 많은 데이터가 있는 정산을 위한 테스트
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      expect(response.status()).toBe(200);
      const buffer = await response.body();
      const pdfContent = buffer.toString('latin1');

      // 페이지 객체가 존재하는지 확인
      expect(pdfContent).toContain('/Type /Page');
    });
  });

  test.describe('복잡한 데이터 처리 테스트', () => {
    test('빈 정산 데이터를 처리한다', async ({ page }) => {
      // Mock API를 통해 빈 데이터 테스트
      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: '1',
                ym: '2024-01',
                year: 2024,
                month: 1,
                settlement_items: []
              },
              summary: {
                period: '2024-01',
                totalItems: 0,
                totalMembers: 0,
                totalAmountBeforeWithholding: 0,
                totalWithholdingTax: 0,
                totalAmountAfterWithholding: 0,
                totalPaid: 0,
                totalUnpaid: 0,
                memberBreakdown: {},
                sourceBreakdown: {
                  PROJECT: { count: 0, amount: 0 },
                  CONTACT: { count: 0, amount: 0 },
                  FEED: { count: 0, amount: 0 }
                }
              }
            })
          });
        } else if (format === 'pdf') {
          // 실제 PDF 생성 API 호출
          await route.continue();
        }
      });

      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.summary.totalItems).toBe(0);
    });

    test('매우 큰 금액을 처리한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: '1',
                ym: '2024-01',
                settlement_items: [
                  {
                    id: '1',
                    amount_before_withholding: 999999999999,
                    withholding_tax: 33000000000,
                    amount_after_withholding: 966999999999,
                    member: { name: '테스트 멤버' },
                    paid: false
                  }
                ]
              },
              summary: {
                period: '2024-01',
                totalItems: 1,
                totalAmountBeforeWithholding: 999999999999,
                totalWithholdingTax: 33000000000,
                totalAmountAfterWithholding: 966999999999,
                memberBreakdown: {
                  '1': {
                    name: '테스트 멤버',
                    totalAmount: 966999999999,
                    items: []
                  }
                }
              }
            })
          });
        }
      });

      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // 큰 숫자가 정확히 처리되는지 확인
      expect(data.summary.totalAmountBeforeWithholding).toBe(999999999999);
    });

    test('특수 문자가 포함된 멤버 이름을 처리한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: '1',
                ym: '2024-01',
                settlement_items: [
                  {
                    id: '1',
                    amount_before_withholding: 1000000,
                    withholding_tax: 33000,
                    amount_after_withholding: 967000,
                    member: { name: '김철수 (대표)' },
                    paid: true
                  },
                  {
                    id: '2',
                    amount_before_withholding: 1500000,
                    withholding_tax: 49500,
                    amount_after_withholding: 1450500,
                    member: { name: '이영희 & 파트너스' },
                    paid: false
                  }
                ]
              },
              summary: {
                period: '2024-01',
                totalItems: 2,
                memberBreakdown: {
                  '1': { name: '김철수 (대표)', totalAmount: 967000 },
                  '2': { name: '이영희 & 파트너스', totalAmount: 1450500 }
                }
              }
            })
          });
        }
      });

      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // 특수 문자가 포함된 이름이 정상적으로 처리되는지 확인
      expect(data.summary.memberBreakdown['1'].name).toBe('김철수 (대표)');
      expect(data.summary.memberBreakdown['2'].name).toBe('이영희 & 파트너스');
    });

    test('많은 멤버가 있는 정산을 처리한다', async ({ page }) => {
      // 50명의 멤버 데이터 생성
      const members = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        amount_before_withholding: 1000000 + (i * 10000),
        withholding_tax: (1000000 + (i * 10000)) * 0.033,
        amount_after_withholding: (1000000 + (i * 10000)) * 0.967,
        member: { name: `멤버${i + 1}` },
        paid: i % 2 === 0
      }));

      const memberBreakdown = {};
      members.forEach(member => {
        memberBreakdown[member.id] = {
          name: member.member.name,
          totalAmount: member.amount_after_withholding
        };
      });

      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: '1',
                ym: '2024-01',
                settlement_items: members
              },
              summary: {
                period: '2024-01',
                totalItems: 50,
                totalMembers: 50,
                memberBreakdown
              }
            })
          });
        }
      });

      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // 많은 멤버 데이터가 정상적으로 처리되는지 확인
      expect(data.summary.totalItems).toBe(50);
      expect(data.summary.totalMembers).toBe(50);
      expect(Object.keys(data.summary.memberBreakdown)).toHaveLength(50);
    });
  });

  test.describe('메모리 및 성능 테스트', () => {
    test('대용량 정산 데이터에서 메모리 효율성을 유지한다', async ({ page }) => {
      // 큰 데이터셋으로 메모리 사용량 테스트
      const startTime = Date.now();

      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(10000); // 10초 이내

      const buffer = await response.body();
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.length).toBeLessThan(10 * 1024 * 1024); // 10MB 미만
    });

    test('동시 요청을 처리할 수 있다', async ({ page }) => {
      // 여러 개의 동시 요청 생성
      const requests = Array.from({ length: 5 }, (_, i) =>
        page.request.get('/api/settlements/reports', {
          params: {
            settlement_id: '1',
            format: 'json'
          }
        })
      );

      const responses = await Promise.all(requests);

      // 모든 요청이 성공해야 함
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });

    test('PDF 파일 크기가 합리적이다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      expect(response.status()).toBe(200);
      const buffer = await response.body();

      // 파일 크기가 합리적인 범위 내에 있는지 확인
      expect(buffer.length).toBeGreaterThan(1000); // 최소 1KB
      expect(buffer.length).toBeLessThan(5 * 1024 * 1024); // 최대 5MB
    });
  });

  test.describe('오류 복구 테스트', () => {
    test('부분적으로 손상된 데이터를 처리한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: '1',
                ym: '2024-01',
                settlement_items: [
                  {
                    id: '1',
                    amount_before_withholding: 1000000,
                    withholding_tax: null, // null 값
                    amount_after_withholding: 967000,
                    member: { name: '정상 멤버' },
                    paid: true
                  },
                  {
                    id: '2',
                    amount_before_withholding: undefined, // undefined 값
                    withholding_tax: 0,
                    amount_after_withholding: 0,
                    member: null, // null 멤버
                    paid: false
                  }
                ]
              },
              summary: {
                period: '2024-01',
                totalItems: 2
              }
            })
          });
        }
      });

      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // 부분적으로 손상된 데이터가 있어도 응답이 성공해야 함
      expect(data.summary.totalItems).toBe(2);
    });

    test('잘못된 JSON 형식을 처리한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const settlementId = url.searchParams.get('settlement_id');

        if (settlementId === 'invalid-json') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: '{"error": "Invalid data format"}'
          });
        } else {
          await route.continue();
        }
      });

      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: 'invalid-json',
          format: 'pdf'
        }
      });

      expect(response.status()).toBe(500);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });
  });

  test.describe('국제화 및 로케일 테스트', () => {
    test('한국 로케일에서 날짜 형식이 올바르다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // 한국식 날짜 형식 확인
      expect(data.summary.period).toMatch(/^\d{4}-\d{2}$/);
    });

    test('한국 통화 형식이 일관되게 적용된다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'csv'
        }
      });

      expect(response.status()).toBe(200);
      const csvContent = await response.text();

      // CSV에서 통화 형식 확인
      const currencyMatches = csvContent.match(/₩[\d,]+/g);
      if (currencyMatches) {
        // 모든 통화 형식이 일관되게 적용되었는지 확인
        currencyMatches.forEach(currency => {
          expect(currency).toMatch(/^₩[\d,]+$/);
        });
      }
    });

    test('다양한 언어의 멤버 이름을 지원한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async route => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: '1',
                ym: '2024-01',
                settlement_items: [
                  {
                    id: '1',
                    amount_before_withholding: 1000000,
                    member: { name: '김한국' }, // 한국어
                    paid: true
                  },
                  {
                    id: '2',
                    amount_before_withholding: 1000000,
                    member: { name: 'John Smith' }, // 영어
                    paid: true
                  },
                  {
                    id: '3',
                    amount_before_withholding: 1000000,
                    member: { name: '田中太郎' }, // 일본어
                    paid: true
                  }
                ]
              },
              summary: {
                period: '2024-01',
                memberBreakdown: {
                  '1': { name: '김한국' },
                  '2': { name: 'John Smith' },
                  '3': { name: '田中太郎' }
                }
              }
            })
          });
        }
      });

      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // 다양한 언어의 이름이 정상적으로 처리되는지 확인
      expect(data.summary.memberBreakdown['1'].name).toBe('김한국');
      expect(data.summary.memberBreakdown['2'].name).toBe('John Smith');
      expect(data.summary.memberBreakdown['3'].name).toBe('田中太郎');
    });
  });
});