/**
 * CSV ETL Utilities
 * 데이터 파싱, 검증, 변환을 위한 유틸리티 함수들
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import {
  ETLConfig,
  ETLResult,
  ExcelProject,
  TransformedProject,
  ExcelContact,
  TransformedContact,
  ExcelFeed,
  TransformedFeed,
  ExcelTeamTask,
  TransformedTeamTask,
  ExcelMileage,
  TransformedMileage,
  ExcelFunds,
  TransformedFundsCompany,
  TransformedFundsPersonal
} from './types';
import { ETL_CONFIG, COLUMN_MAPPINGS, SPECIAL_VALUES, DESIGNER_PATTERNS } from './config';

/**
 * CSV 파일 읽기 및 파싱
 */
export function parseCSVFile(filePath: string): any[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true, // 첫 번째 행을 헤더로 사용
      skip_empty_lines: true,
      trim: true,
      skip_lines_with_error: false,
      encoding: 'utf8'
    });

    return records;
  } catch (error) {
    throw new Error(`CSV 파일 읽기 실패: ${filePath} - ${error}`);
  }
}

/**
 * 날짜 문자열을 표준 형식으로 변환
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';

  // 다양한 날짜 형식 지원
  const dateFormats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
    /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/, // YYYY.MM.DD
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, // MM/DD/YY
  ];

  const trimmed = dateStr.trim();

  for (const formatRegex of dateFormats) {
    const match = trimmed.match(formatRegex);
    if (match) {
      let year, month, day;

      if (formatRegex === dateFormats[0] || formatRegex === dateFormats[1] || formatRegex === dateFormats[2]) {
        // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
        [, year, month, day] = match;
      } else if (formatRegex === dateFormats[3]) {
        // MM/DD/YYYY
        [, month, day, year] = match;
      } else if (formatRegex === dateFormats[4]) {
        // MM/DD/YY
        [, month, day, year] = match;
        year = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;
      }

      // 날짜 유효성 검사
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (dateObj.getFullYear() == parseInt(year) &&
          dateObj.getMonth() == parseInt(month) - 1 &&
          dateObj.getDate() == parseInt(day)) {
        return format(dateObj, 'yyyy-MM-dd');
      }
    }
  }

  throw new Error(`지원되지 않는 날짜 형식: ${dateStr}`);
}

/**
 * 금액 문자열을 숫자로 변환
 */
export function normalizeAmount(amountStr: string | number): number {
  if (typeof amountStr === 'number') return amountStr;
  if (!amountStr) return 0;

  // 문자열에서 숫자만 추출
  const cleanStr = amountStr.toString()
    .replace(/[^\d.-]/g, '') // 숫자, 점, 마이너스 외 제거
    .replace(/,/g, ''); // 쉼표 제거

  const amount = parseFloat(cleanStr);
  return isNaN(amount) ? 0 : amount;
}

/**
 * 멤버 코드/이름을 ID로 변환
 */
export function getMemberId(memberIdentifier: string): string {
  if (!memberIdentifier) {
    throw new Error('멤버 식별자가 없습니다');
  }

  const trimmed = memberIdentifier.trim();
  const memberId = ETL_CONFIG.memberMapping[trimmed];

  if (!memberId) {
    throw new Error(`알 수 없는 멤버: ${trimmed}`);
  }

  return memberId;
}

/**
 * 채널명을 ID로 변환
 */
export function getChannelId(channelName: string): string {
  if (!channelName) {
    throw new Error('채널명이 없습니다');
  }

  const trimmed = channelName.trim();
  const channelId = ETL_CONFIG.channelMapping[trimmed];

  if (!channelId) {
    throw new Error(`알 수 없는 채널: ${trimmed}`);
  }

  return channelId;
}

/**
 * 카테고리명을 ID로 변환
 */
export function getCategoryId(categoryName: string): string {
  if (!categoryName) {
    throw new Error('카테고리명이 없습니다');
  }

  const trimmed = categoryName.trim();
  const categoryId = ETL_CONFIG.categoryMapping[trimmed];

  if (!categoryId) {
    throw new Error(`알 수 없는 카테고리: ${trimmed}`);
  }

  return categoryId;
}

/**
 * boolean 값으로 변환
 */
export function normalizeBoolean(value: string, mapping: Record<string, boolean>): boolean {
  if (!value) return false;

  const trimmed = value.toString().trim();
  return mapping[trimmed] !== undefined ? mapping[trimmed] : false;
}

/**
 * 컬럼명을 표준 필드명으로 매핑
 */
export function mapColumnNames(row: any, mappings: Record<string, string>): any {
  const mapped: any = {};

  for (const [excelColumn, dbField] of Object.entries(mappings)) {
    // 정확히 일치하는 컬럼 찾기
    let value = row[excelColumn];

    // 정확히 일치하지 않으면 유사한 컬럼 찾기
    if (value === undefined) {
      const similarColumn = Object.keys(row).find(col =>
        col.trim().toLowerCase() === excelColumn.toLowerCase() ||
        col.includes(excelColumn) ||
        excelColumn.includes(col.trim())
      );

      if (similarColumn) {
        value = row[similarColumn];
      }
    }

    mapped[dbField] = value;
  }

  return mapped;
}

/**
 * 디자이너 정보 추출 (동적 컬럼)
 */
export function extractDesignerInfo(row: any): Array<{ member_id: string; percent: number; bonus_pct: number }> {
  const designers: Array<{ member_id: string; percent: number; bonus_pct: number }> = [];
  const designerData: Record<string, { percent?: number; bonus_pct?: number }> = {};

  // 모든 컬럼을 검사하여 디자이너 관련 컬럼 찾기
  for (const [column, value] of Object.entries(row)) {
    if (!value || value === '') continue;

    // 지분 컬럼 매칭
    const shareMatch = column.match(DESIGNER_PATTERNS.shareColumns);
    if (shareMatch) {
      const memberName = shareMatch[1] || shareMatch[2];
      try {
        const memberId = getMemberId(memberName);
        if (!designerData[memberId]) designerData[memberId] = {};
        designerData[memberId].percent = normalizeAmount(value as string);
      } catch (error) {
        console.warn(`디자이너 지분 파싱 실패: ${memberName}`, error);
      }
    }

    // 인센티브 컬럼 매칭
    const bonusMatch = column.match(DESIGNER_PATTERNS.bonusColumns);
    if (bonusMatch) {
      const memberName = bonusMatch[1] || bonusMatch[2];
      try {
        const memberId = getMemberId(memberName);
        if (!designerData[memberId]) designerData[memberId] = {};
        designerData[memberId].bonus_pct = normalizeAmount(value as string);
      } catch (error) {
        console.warn(`디자이너 인센티브 파싱 실패: ${memberName}`, error);
      }
    }
  }

  // 디자이너 배열 생성
  for (const [memberId, data] of Object.entries(designerData)) {
    if (data.percent && data.percent > 0) {
      designers.push({
        member_id: memberId,
        percent: data.percent || 0,
        bonus_pct: data.bonus_pct || 0
      });
    }
  }

  return designers;
}

/**
 * 프로젝트 데이터 변환
 */
export function transformProject(row: ExcelProject): TransformedProject {
  const mapped = mapColumnNames(row, COLUMN_MAPPINGS.projects);
  const designers = extractDesignerInfo(row);

  return {
    client_name: mapped.client_name || '',
    channel_id: getChannelId(mapped.channel),
    category_id: getCategoryId(mapped.category),
    title: mapped.title || '',
    qty: normalizeAmount(mapped.qty) || 1,
    list_price_net: normalizeAmount(mapped.list_price_net) || 0,
    discount_net: normalizeAmount(mapped.discount_net) || 0,
    deposit_gross_T: normalizeAmount(mapped.deposit_gross_T) || 0,
    net_B: normalizeAmount(mapped.net_B) || 0,
    settle_date: normalizeDate(mapped.settle_date),
    work_date: normalizeDate(mapped.work_date),
    invoice_requested: normalizeBoolean(mapped.invoice_requested, SPECIAL_VALUES.invoiceRequested),
    designers,
    notes: mapped.notes || '',
    status: SPECIAL_VALUES.status[mapped.status] || 'pending'
  };
}

/**
 * 컨택 데이터 변환
 */
export function transformContact(row: ExcelContact): TransformedContact {
  const mapped = mapColumnNames(row, COLUMN_MAPPINGS.contacts);

  return {
    member_id: getMemberId(mapped.member),
    date: normalizeDate(mapped.date),
    event_type: SPECIAL_VALUES.eventTypes[mapped.event_type] || 'INCOMING',
    amount: normalizeAmount(mapped.amount) || 0,
    project_id: mapped.project || undefined, // 나중에 프로젝트명으로 ID 조회
    notes: mapped.notes || ''
  };
}

/**
 * 피드 데이터 변환
 */
export function transformFeed(row: ExcelFeed): TransformedFeed {
  const mapped = mapColumnNames(row, COLUMN_MAPPINGS.feed);

  return {
    member_id: getMemberId(mapped.member),
    date: normalizeDate(mapped.date),
    fee_type: SPECIAL_VALUES.feedTypes[mapped.fee_type] || 'BELOW3',
    amount: normalizeAmount(mapped.amount) || 0,
    notes: mapped.notes || ''
  };
}

/**
 * 팀업무 데이터 변환
 */
export function transformTeamTask(row: ExcelTeamTask): TransformedTeamTask {
  const mapped = mapColumnNames(row, COLUMN_MAPPINGS.teamTasks);

  return {
    member_id: getMemberId(mapped.member),
    project_id: mapped.project || undefined, // 나중에 프로젝트명으로 ID 조회
    date: normalizeDate(mapped.date),
    notes: mapped.notes || '',
    amount: normalizeAmount(mapped.amount) || 0
  };
}

/**
 * 마일리지 데이터 변환
 */
export function transformMileage(row: ExcelMileage): TransformedMileage {
  const mapped = mapColumnNames(row, COLUMN_MAPPINGS.mileage);

  return {
    member_id: getMemberId(mapped.member),
    date: normalizeDate(mapped.date),
    reason: mapped.reason || '',
    points: normalizeAmount(mapped.points) || 0,
    amount: normalizeAmount(mapped.amount) || 0,
    consumed_now_boolean: normalizeBoolean(mapped.consumed_now, SPECIAL_VALUES.consumed),
    notes: mapped.notes || ''
  };
}

/**
 * 공금 데이터 변환 (회사/개인 구분)
 */
export function transformFunds(row: ExcelFunds): TransformedFundsCompany | TransformedFundsPersonal {
  const mapped = mapColumnNames(row, COLUMN_MAPPINGS.funds);

  const baseData = {
    date: normalizeDate(mapped.date),
    item: mapped.item || '',
    amount: normalizeAmount(mapped.amount) || 0,
    memo: mapped.memo || ''
  };

  // 멤버 정보가 있으면 개인 보조금, 없으면 회사 고정비
  if (mapped.member) {
    return {
      ...baseData,
      member_id: getMemberId(mapped.member)
    } as TransformedFundsPersonal;
  } else {
    return baseData as TransformedFundsCompany;
  }
}

/**
 * 데이터 검증
 */
export function validateData<T>(data: T[], validationRules: any): ETLResult<T> {
  const errors: any[] = [];
  const warnings: any[] = [];
  const validData: T[] = [];

  data.forEach((row, index) => {
    try {
      // 필수 필드 검증
      for (const field of validationRules.requiredFields || []) {
        if (!row[field as keyof T]) {
          errors.push({
            row: index + 1,
            field,
            value: row[field as keyof T],
            message: `필수 필드가 누락되었습니다: ${field}`
          });
        }
      }

      // 금액 범위 검증
      if (validationRules.amountRange && row['amount' as keyof T]) {
        const amount = normalizeAmount(row['amount' as keyof T] as any);
        const [min, max] = validationRules.amountRange;
        if (amount < min || amount > max) {
          warnings.push({
            row: index + 1,
            field: 'amount',
            value: amount,
            message: `금액이 예상 범위를 벗어남: ${amount} (범위: ${min}~${max})`
          });
        }
      }

      validData.push(row);
    } catch (error) {
      errors.push({
        row: index + 1,
        field: 'general',
        value: row,
        message: `데이터 검증 실패: ${error}`
      });
    }
  });

  return {
    success: errors.length === 0,
    data: validData,
    errors,
    warnings,
    summary: {
      totalRows: data.length,
      successRows: validData.length,
      errorRows: errors.length,
      warningRows: warnings.length,
      skippedRows: data.length - validData.length
    }
  };
}

/**
 * 결과 리포트 생성
 */
export function generateReport<T>(result: ETLResult<T>, outputPath?: string): string {
  const report = `
=== CSV ETL 처리 결과 ===
처리 시간: ${new Date().toLocaleString('ko-KR')}

[요약]
- 전체 행 수: ${result.summary.totalRows}
- 성공 행 수: ${result.summary.successRows}
- 오류 행 수: ${result.summary.errorRows}
- 경고 행 수: ${result.summary.warningRows}
- 건너뛴 행 수: ${result.summary.skippedRows}

[오류 상세]
${result.errors.map(err =>
  `행 ${err.row}: ${err.field} = "${err.value}" - ${err.message}`
).join('\n')}

[경고 상세]
${result.warnings.map(warn =>
  `행 ${warn.row}: ${warn.field} = "${warn.value}" - ${warn.message}`
).join('\n')}
`;

  if (outputPath) {
    fs.writeFileSync(outputPath, report, 'utf-8');
  }

  return report;
}