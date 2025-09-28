/**
 * PDF 테스트 유틸리티
 * PDF 파일 다운로드, 검증, 파싱을 위한 헬퍼 함수들
 */

import { Page, expect } from '@playwright/test';
import { existsSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

export interface PDFValidationOptions {
  minSize?: number;
  maxSize?: number;
  validateStructure?: boolean;
  validateKoreanText?: boolean;
  expectedFilename?: string;
}

export interface SettlementReportParams {
  settlement_id?: string;
  year?: string;
  month?: string;
  format: 'pdf' | 'csv' | 'json' | 'excel';
}

export interface APITestResult {
  status: number;
  headers: Record<string, string>;
  body: Buffer | string | object;
  responseTime: number;
}

/**
 * PDF 파일의 기본 구조를 검증합니다
 */
export function validatePDFStructure(buffer: Buffer): boolean {
  const content = buffer.toString('latin1');

  // PDF 파일 시그니처 확인
  if (!content.startsWith('%PDF-')) {
    return false;
  }

  // PDF 종료 마커 확인
  if (!content.includes('%%EOF')) {
    return false;
  }

  // 기본 PDF 객체 확인
  const hasBasicObjects = [
    '/Type /Catalog',
    '/Type /Pages',
    '/Type /Page'
  ].some(obj => content.includes(obj));

  return hasBasicObjects;
}

/**
 * PDF 파일에 한국어 텍스트가 포함되어 있는지 확인합니다
 */
export function validateKoreanTextInPDF(buffer: Buffer): boolean {
  const content = buffer.toString('utf8');

  // 한국어 유니코드 범위 확인
  const koreanRegex = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;

  return koreanRegex.test(content);
}

/**
 * 정산 리포트 API를 호출하고 결과를 검증합니다
 */
export async function callSettlementReportAPI(
  page: Page,
  params: SettlementReportParams
): Promise<APITestResult> {
  const startTime = Date.now();

  const response = await page.request.get('/api/settlements/reports', {
    params: params as Record<string, string>
  });

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  let body: Buffer | string | object;

  if (params.format === 'json') {
    body = await response.json();
  } else if (params.format === 'csv') {
    body = await response.text();
  } else {
    body = await response.body();
  }

  return {
    status: response.status(),
    headers: response.headers(),
    body,
    responseTime
  };
}

/**
 * PDF 다운로드를 트리거하고 파일을 검증합니다
 */
export async function downloadAndValidatePDF(
  page: Page,
  params: SettlementReportParams,
  options: PDFValidationOptions = {}
): Promise<{
  isValid: boolean;
  filePath?: string;
  errors: string[];
}> {
  const errors: string[] = [];
  const downloadPath = join(__dirname, '..', 'downloads');

  try {
    // 다운로드 이벤트 대기
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // API 호출로 다운로드 트리거
    await page.evaluate(async (apiParams) => {
      const queryString = new URLSearchParams(apiParams).toString();
      const response = await fetch(`/api/settlements/reports?${queryString}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settlement-${apiParams.format}.${apiParams.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    }, params);

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // 파일명 검증
    if (options.expectedFilename && !filename.includes(options.expectedFilename)) {
      errors.push(`Expected filename to contain '${options.expectedFilename}', got '${filename}'`);
    }

    // 파일 저장
    const filePath = join(downloadPath, filename);
    await download.saveAs(filePath);

    if (!existsSync(filePath)) {
      errors.push('Downloaded file does not exist');
      return { isValid: false, errors };
    }

    // 파일 크기 검증
    const stats = statSync(filePath);
    if (options.minSize && stats.size < options.minSize) {
      errors.push(`File size ${stats.size} is less than minimum ${options.minSize}`);
    }

    if (options.maxSize && stats.size > options.maxSize) {
      errors.push(`File size ${stats.size} exceeds maximum ${options.maxSize}`);
    }

    // PDF 구조 검증
    if (params.format === 'pdf' && options.validateStructure) {
      const fs = require('fs');
      const buffer = fs.readFileSync(filePath);

      if (!validatePDFStructure(buffer)) {
        errors.push('PDF structure validation failed');
      }

      if (options.validateKoreanText && !validateKoreanTextInPDF(buffer)) {
        errors.push('Korean text validation failed');
      }
    }

    // 테스트 후 파일 정리
    try {
      unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup downloaded file:', cleanupError);
    }

    return {
      isValid: errors.length === 0,
      filePath,
      errors
    };

  } catch (error) {
    errors.push(`Download failed: ${error.message}`);
    return { isValid: false, errors };
  }
}

/**
 * CSV 내용의 구조와 데이터를 검증합니다
 */
export function validateCSVContent(csvContent: string): {
  isValid: boolean;
  errors: string[];
  data: {
    headers: string[];
    rows: string[][];
    recordCount: number;
  };
} {
  const errors: string[] = [];

  try {
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      errors.push('CSV must have at least header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.replace(/"/g, '')));

    // 필수 헤더 확인
    const requiredHeaders = [
      'Settlement Period',
      'Member Name',
      'Amount Before Withholding',
      'Amount After Withholding'
    ];

    requiredHeaders.forEach(requiredHeader => {
      if (!headers.includes(requiredHeader)) {
        errors.push(`Missing required header: ${requiredHeader}`);
      }
    });

    // 데이터 일관성 확인
    rows.forEach((row, index) => {
      if (row.length !== headers.length) {
        errors.push(`Row ${index + 1} has ${row.length} columns, expected ${headers.length}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      data: {
        headers,
        rows,
        recordCount: rows.length
      }
    };

  } catch (error) {
    errors.push(`CSV parsing failed: ${error.message}`);
    return {
      isValid: false,
      errors,
      data: { headers: [], rows: [], recordCount: 0 }
    };
  }
}

/**
 * JSON 응답의 구조와 데이터를 검증합니다
 */
export function validateJSONResponse(jsonData: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 최상위 구조 확인
  if (!jsonData.data) {
    errors.push('Missing data property');
  }

  if (!jsonData.summary) {
    errors.push('Missing summary property');
  }

  // summary 구조 확인
  if (jsonData.summary) {
    const requiredSummaryFields = [
      'period',
      'totalItems',
      'totalAmountBeforeWithholding',
      'totalAmountAfterWithholding',
      'memberBreakdown'
    ];

    requiredSummaryFields.forEach(field => {
      if (!(field in jsonData.summary)) {
        errors.push(`Missing summary field: ${field}`);
      }
    });

    // 금액 검증
    if (jsonData.summary.totalAmountAfterWithholding > jsonData.summary.totalAmountBeforeWithholding) {
      errors.push('Amount after withholding cannot be greater than amount before withholding');
    }

    // 멤버별 분석 구조 확인
    if (jsonData.summary.memberBreakdown) {
      Object.values(jsonData.summary.memberBreakdown).forEach((member: any, index) => {
        if (!member.name) {
          errors.push(`Member ${index} missing name`);
        }
        if (typeof member.totalAmount !== 'number') {
          errors.push(`Member ${index} totalAmount is not a number`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 성능 테스트를 위한 동시 요청 실행
 */
export async function runConcurrentRequests(
  page: Page,
  params: SettlementReportParams,
  concurrency: number = 5
): Promise<{
  results: APITestResult[];
  averageResponseTime: number;
  successCount: number;
  errorCount: number;
}> {
  const requests = Array.from({ length: concurrency }, () =>
    callSettlementReportAPI(page, params)
  );

  const results = await Promise.all(requests);

  const successCount = results.filter(r => r.status === 200).length;
  const errorCount = results.length - successCount;
  const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  return {
    results,
    averageResponseTime,
    successCount,
    errorCount
  };
}

/**
 * 메모리 사용량 모니터링 (브라우저 성능 API 사용)
 */
export async function monitorMemoryUsage(page: Page): Promise<{
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}> {
  return await page.evaluate(() => {
    const performance = window.performance as any;

    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }

    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
  });
}

/**
 * 보안 테스트를 위한 악성 입력 생성
 */
export function generateMaliciousInputs(): SettlementReportParams[] {
  return [
    // SQL Injection 시도
    { settlement_id: "1' OR 1=1 --", format: 'pdf' },
    { settlement_id: "1; DROP TABLE settlements; --", format: 'pdf' },

    // XSS 시도
    { settlement_id: '<script>alert("xss")</script>', format: 'pdf' },
    { settlement_id: 'javascript:alert("xss")', format: 'pdf' },

    // Path Traversal 시도
    { settlement_id: '../../../etc/passwd', format: 'pdf' },
    { settlement_id: '..\\..\\..\\windows\\system32\\config\\sam', format: 'pdf' },

    // Command Injection 시도
    { settlement_id: '1; ls -la', format: 'pdf' },
    { settlement_id: '1 && cat /etc/passwd', format: 'pdf' },

    // Buffer Overflow 시도
    { settlement_id: 'A'.repeat(10000), format: 'pdf' },

    // Format String 시도
    { settlement_id: '%x%x%x%x', format: 'pdf' },

    // NULL 바이트 삽입
    { settlement_id: '1\x00malicious', format: 'pdf' },

    // 잘못된 형식
    { settlement_id: '1', format: 'malicious' as any }
  ];
}

/**
 * 경계값 테스트를 위한 입력 생성
 */
export function generateBoundaryInputs(): SettlementReportParams[] {
  return [
    // 빈 값
    { settlement_id: '', format: 'pdf' },

    // 매우 긴 ID
    { settlement_id: '1'.repeat(1000), format: 'pdf' },

    // 숫자가 아닌 ID
    { settlement_id: 'not-a-number', format: 'pdf' },

    // 특수 문자
    { settlement_id: '!@#$%^&*()', format: 'pdf' },

    // 유니코드 문자
    { settlement_id: '한글테스트', format: 'pdf' },

    // 날짜 경계값
    { year: '1900', month: '1', format: 'pdf' },
    { year: '3000', month: '12', format: 'pdf' },
    { year: '2024', month: '0', format: 'pdf' },
    { year: '2024', month: '13', format: 'pdf' },

    // 음수 값
    { year: '-1', month: '1', format: 'pdf' },
    { settlement_id: '-1', format: 'pdf' }
  ];
}