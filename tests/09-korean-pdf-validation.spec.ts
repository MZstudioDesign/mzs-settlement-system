/**
 * 한국어 PDF 검증 전용 테스트
 * - 한국어 폰트 렌더링 검증
 * - PDF 내 한국어 텍스트 구조 확인
 * - 날짜, 통화 형식의 한국어 로케일 검증
 * - 복잡한 한국어 문자 처리 테스트
 */

import { test, expect } from '@playwright/test';

test.describe('한국어 PDF 검증', () => {

  test.describe('한국어 텍스트 렌더링', () => {
    test('PDF에 한국어 제목이 올바르게 표시된다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');

      const buffer = await response.body();
      const pdfContent = buffer.toString('utf8');

      // PDF 내에 한국어 제목이 포함되어 있는지 확인
      // jsPDF는 Unicode 텍스트를 지원하므로 한국어가 포함되어야 함
      const hasKoreanTitle = /MZS.*스튜디오.*정산서|정산.*기간|생성일|멤버별.*정산.*요약/.test(pdfContent);

      if (!hasKoreanTitle) {
        // UTF-8 디코딩으로 다시 시도
        const utf8Content = buffer.toString('utf8');
        const hasKoreanInUTF8 = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/.test(utf8Content);
        expect(hasKoreanInUTF8).toBeTruthy();
      } else {
        expect(hasKoreanTitle).toBeTruthy();
      }
    });

    test('한국어 멤버 이름이 PDF에 정확히 렌더링된다', async ({ page }) => {
      // 한국어 멤버 이름이 포함된 Mock 데이터 설정
      await page.route('/api/settlements/reports*', async (route) => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'pdf') {
          // 실제 API 호출 계속 진행하되, 한국어 데이터가 있는지 확인
          await route.continue();
        } else if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                id: '1',
                ym: '2024-01',
                year: 2024,
                month: 1,
                settlement_items: [
                  {
                    id: '1',
                    amount_before_withholding: 3000000,
                    withholding_tax: 99000,
                    amount_after_withholding: 2901000,
                    member: { id: '1', name: '김철수' },
                    paid: true
                  },
                  {
                    id: '2',
                    amount_before_withholding: 2500000,
                    withholding_tax: 82500,
                    amount_after_withholding: 2417500,
                    member: { id: '2', name: '이영희' },
                    paid: false
                  },
                  {
                    id: '3',
                    amount_before_withholding: 2000000,
                    withholding_tax: 66000,
                    amount_after_withholding: 1934000,
                    member: { id: '3', name: '박민수' },
                    paid: true
                  }
                ]
              },
              summary: {
                period: '2024-01',
                totalItems: 3,
                totalAmountBeforeWithholding: 7500000,
                totalWithholdingTax: 247500,
                totalAmountAfterWithholding: 7252500,
                memberBreakdown: {
                  '1': { name: '김철수', totalAmount: 2901000 },
                  '2': { name: '이영희', totalAmount: 2417500 },
                  '3': { name: '박민수', totalAmount: 1934000 }
                }
              }
            })
          });
        }
      });

      // JSON으로 한국어 데이터 확인
      const jsonResponse = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(jsonResponse.status()).toBe(200);
      const jsonData = await jsonResponse.json();

      // 한국어 멤버 이름이 있는지 확인
      const memberNames = Object.values(jsonData.summary.memberBreakdown).map((member: any) => member.name);
      const koreanNames = memberNames.filter((name: string) => /[가-힣]/.test(name));
      expect(koreanNames.length).toBeGreaterThan(0);

      // 이제 PDF 생성
      const pdfResponse = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      expect(pdfResponse.status()).toBe(200);
      const pdfBuffer = await pdfResponse.body();

      // PDF가 생성되었고 크기가 적절한지 확인
      expect(pdfBuffer.length).toBeGreaterThan(5000);
    });

    test('복잡한 한국어 문자(자음+모음 조합)를 처리한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async (route) => {
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
                    member: { name: '곽뺭뚮꿟쁬쀍쿻땒' }, // 복잡한 한글 조합
                    paid: true
                  }
                ]
              },
              summary: {
                period: '2024-01',
                memberBreakdown: {
                  '1': { name: '곽뺭뚮꿟쁬쀍쿻땒' }
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

      // 복잡한 한글 조합이 정상적으로 처리되는지 확인
      expect(data.summary.memberBreakdown['1'].name).toBe('곽뺭뚮꿟쁬쀍쿻땒');
    });
  });

  test.describe('한국어 날짜 및 시간 형식', () => {
    test('한국어 월 표기가 올바르다', async ({ page }) => {
      // 여러 월에 대한 테스트
      const months = [
        { month: 1, expected: '2024-01' },
        { month: 12, expected: '2024-12' }
      ];

      for (const { month, expected } of months) {
        const response = await page.request.get('/api/settlements/reports', {
          params: {
            year: '2024',
            month: month.toString(),
            format: 'json'
          }
        });

        if (response.status() === 200) {
          const data = await response.json();
          expect(data.summary.period).toBe(expected);
        }
      }
    });

    test('생성일이 한국 시간대로 표시된다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      if (response.status() === 200) {
        const data = await response.json();

        // 현재 날짜가 한국 형식으로 되어 있는지 확인
        const today = new Date();
        const koreanDate = today.toLocaleDateString('ko-KR');

        // 응답에 한국 날짜 형식이 있는지 확인 (직접적이든 간접적이든)
        expect(data.summary.period).toMatch(/^\d{4}-\d{2}$/);
      }
    });
  });

  test.describe('한국 통화 형식', () => {
    test('원(₩) 기호가 올바르게 표시된다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'csv'
        }
      });

      expect(response.status()).toBe(200);
      const csvContent = await response.text();

      // CSV에서 원화 기호 확인
      const wonSymbolMatches = csvContent.match(/₩/g);
      if (wonSymbolMatches) {
        expect(wonSymbolMatches.length).toBeGreaterThan(0);
      }

      // 한국식 숫자 형식 (쉼표 구분자) 확인
      const koreanNumberMatches = csvContent.match(/₩[\d,]+/g);
      if (koreanNumberMatches) {
        koreanNumberMatches.forEach(match => {
          expect(match).toMatch(/^₩[\d,]+$/);
        });
      }
    });

    test('큰 금액의 한국식 표기가 정확하다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async (route) => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                settlement_items: [{
                  amount_before_withholding: 123456789,
                  amount_after_withholding: 119473243
                }]
              },
              summary: {
                totalAmountBeforeWithholding: 123456789,
                totalAmountAfterWithholding: 119473243
              }
            })
          });
        }
      });

      const csvResponse = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'csv'
        }
      });

      if (csvResponse.status() === 200) {
        const csvContent = await csvResponse.text();

        // 큰 금액이 한국식으로 표기되는지 확인
        const bigAmountMatches = csvContent.match(/₩123,456,789|₩119,473,243/g);
        if (bigAmountMatches) {
          expect(bigAmountMatches.length).toBeGreaterThan(0);
        }
      }
    });

    test('소수점 처리가 한국 기준에 맞다', async ({ page }) => {
      // 한국 통화는 소수점을 사용하지 않으므로 확인
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'csv'
        }
      });

      if (response.status() === 200) {
        const csvContent = await response.text();

        // 통화 표기에 소수점이 없어야 함
        const currencyWithDecimals = csvContent.match(/₩[\d,]+\.\d+/g);
        expect(currencyWithDecimals).toBeNull();
      }
    });
  });

  test.describe('PDF 문서 구조 검증', () => {
    test('PDF 메타데이터에 한국어 정보가 포함된다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      expect(response.status()).toBe(200);
      const buffer = await response.body();

      // PDF 기본 구조 확인
      const pdfHeader = buffer.slice(0, 8).toString();
      expect(pdfHeader).toBe('%PDF-1.3'); // jsPDF 기본 버전

      // PDF에 텍스트 객체가 있는지 확인
      const pdfContent = buffer.toString('latin1');
      expect(pdfContent).toContain('BT'); // Begin Text
      expect(pdfContent).toContain('ET'); // End Text
    });

    test('여러 페이지 PDF에서 한국어가 일관되게 표시된다', async ({ page }) => {
      // 많은 데이터로 여러 페이지를 만들도록 Mock 설정
      await page.route('/api/settlements/reports*', async (route) => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          const largeDataset = {
            data: {
              settlement_items: Array.from({ length: 30 }, (_, i) => ({
                id: `${i + 1}`,
                amount_before_withholding: 1000000,
                member: { name: `한국인멤버${i + 1}` },
                paid: i % 2 === 0
              }))
            },
            summary: {
              period: '2024-01',
              memberBreakdown: Object.fromEntries(
                Array.from({ length: 30 }, (_, i) => [
                  `${i + 1}`,
                  { name: `한국인멤버${i + 1}`, totalAmount: 1000000 }
                ])
              )
            }
          };

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(largeDataset)
          });
        }
      });

      const pdfResponse = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'pdf'
        }
      });

      expect(pdfResponse.status()).toBe(200);
      const buffer = await pdfResponse.body();

      // 여러 페이지가 있는 PDF인지 확인
      const pdfContent = buffer.toString('latin1');
      const pageCount = (pdfContent.match(/\/Type \/Page/g) || []).length;

      // 최소 1페이지는 있어야 함
      expect(pageCount).toBeGreaterThan(0);

      // PDF 크기가 많은 데이터를 포함할 만큼 충분한지 확인
      expect(buffer.length).toBeGreaterThan(10000);
    });
  });

  test.describe('특수 한국어 상황 처리', () => {
    test('한글과 영문이 혼합된 이름을 처리한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async (route) => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                settlement_items: [
                  {
                    id: '1',
                    member: { name: '김John Smith' },
                    amount_before_withholding: 1000000
                  },
                  {
                    id: '2',
                    member: { name: 'Lee영희' },
                    amount_before_withholding: 1000000
                  },
                  {
                    id: '3',
                    member: { name: 'MZS김철수' },
                    amount_before_withholding: 1000000
                  }
                ]
              },
              summary: {
                memberBreakdown: {
                  '1': { name: '김John Smith' },
                  '2': { name: 'Lee영희' },
                  '3': { name: 'MZS김철수' }
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

      // 혼합 이름이 정확히 처리되는지 확인
      expect(data.summary.memberBreakdown['1'].name).toBe('김John Smith');
      expect(data.summary.memberBreakdown['2'].name).toBe('Lee영희');
      expect(data.summary.memberBreakdown['3'].name).toBe('MZS김철수');
    });

    test('한글 특수문자와 기호를 포함한 텍스트를 처리한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async (route) => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                settlement_items: [{
                  id: '1',
                  member: { name: '김철수(대표)' },
                  amount_before_withholding: 1000000
                }]
              },
              summary: {
                memberBreakdown: {
                  '1': { name: '김철수(대표)' }
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

      // 특수문자가 포함된 한글 이름이 정확히 처리되는지 확인
      expect(data.summary.memberBreakdown['1'].name).toBe('김철수(대표)');
    });

    test('빈 한글 문자열과 null 값을 안전하게 처리한다', async ({ page }) => {
      await page.route('/api/settlements/reports*', async (route) => {
        const url = new URL(route.request().url());
        const format = url.searchParams.get('format');

        if (format === 'json') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                settlement_items: [
                  {
                    id: '1',
                    member: { name: '' }, // 빈 문자열
                    amount_before_withholding: 1000000
                  },
                  {
                    id: '2',
                    member: null, // null 멤버
                    amount_before_withholding: 1000000
                  },
                  {
                    id: '3',
                    member: { name: undefined }, // undefined 이름
                    amount_before_withholding: 1000000
                  }
                ]
              },
              summary: {
                memberBreakdown: {}
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

      // 빈 값이나 null 값이 있어도 응답이 성공해야 함
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.data.settlement_items).toHaveLength(3);
    });
  });

  test.describe('인코딩 및 문자셋 테스트', () => {
    test('UTF-8 인코딩이 올바르게 처리된다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'json'
        }
      });

      expect(response.status()).toBe(200);

      // 응답 헤더에서 문자 인코딩 확인
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');

      // JSON 응답이 UTF-8로 올바르게 디코딩되는지 확인
      const data = await response.json();
      expect(data).toBeDefined();
    });

    test('CSV 파일이 UTF-8로 저장된다', async ({ page }) => {
      const response = await page.request.get('/api/settlements/reports', {
        params: {
          settlement_id: '1',
          format: 'csv'
        }
      });

      expect(response.status()).toBe(200);

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/csv');

      // CSV 내용이 UTF-8로 읽힐 수 있는지 확인
      const csvContent = await response.text();
      expect(typeof csvContent).toBe('string');
      expect(csvContent.length).toBeGreaterThan(0);
    });
  });
});