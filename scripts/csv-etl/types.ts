/**
 * CSV ETL Types
 * Excel 시트 데이터를 Supabase로 이관하기 위한 타입 정의
 */

// 공통 매핑 인터페이스
export interface EntityMapping {
  code: string;
  name: string;
  id: string;
}

// 멤버 매핑
export interface MemberMapping extends EntityMapping {
  active: boolean;
}

// 채널 매핑
export interface ChannelMapping extends EntityMapping {
  ad_rate: number;
  program_rate: number;
  market_fee_rate: number;
  fee_base: string;
}

// 카테고리 매핑
export interface CategoryMapping extends EntityMapping {}

// Excel 원본 데이터 구조
export interface ExcelProject {
  // 기본 정보
  클라이언트명: string;
  채널: string;
  카테고리: string;
  프로젝트명: string;
  수량: number;
  정가_net: number;
  할인_net: number;
  입금액_T: number;
  실입금_B: number;
  정산일: string;
  작업일: string;
  세금계산서: string;

  // 디자이너 정보 (동적 컬럼)
  [key: string]: any; // 디자이너별 지분, 인센티브 등

  비고: string;
  상태: string;
}

export interface ExcelContact {
  날짜: string;
  멤버: string;
  이벤트타입: string; // INCOMING/CHAT/GUIDE
  금액: number;
  프로젝트: string;
  비고: string;
}

export interface ExcelFeed {
  날짜: string;
  멤버: string;
  피드타입: string; // BELOW3/GTE3
  금액: number;
  비고: string;
}

export interface ExcelTeamTask {
  날짜: string;
  멤버: string;
  프로젝트: string;
  업무내용: string;
  금액: number;
}

export interface ExcelMileage {
  날짜: string;
  멤버: string;
  사유: string;
  마일리지: number;
  금액: number;
  현금화: string; // Y/N
  비고: string;
}

export interface ExcelFunds {
  날짜: string;
  항목: string;
  금액: number;
  메모: string;
  타입?: string; // 회사/개인 구분
  멤버?: string; // 개인 보조금의 경우
}

// 변환된 Supabase 데이터 구조
export interface TransformedProject {
  client_name: string;
  channel_id: string;
  category_id: string;
  title: string;
  qty: number;
  list_price_net: number;
  discount_net: number;
  deposit_gross_T: number;
  net_B: number;
  settle_date: string;
  work_date: string;
  invoice_requested: boolean;
  designers: Array<{
    member_id: string;
    percent: number;
    bonus_pct: number;
  }>;
  notes: string;
  status: string;
}

export interface TransformedContact {
  member_id: string;
  date: string;
  event_type: 'INCOMING' | 'CHAT' | 'GUIDE';
  amount: number;
  project_id?: string;
  notes: string;
}

export interface TransformedFeed {
  member_id: string;
  date: string;
  fee_type: 'BELOW3' | 'GTE3';
  amount: number;
  notes: string;
}

export interface TransformedTeamTask {
  member_id: string;
  project_id?: string;
  date: string;
  notes: string;
  amount: number;
}

export interface TransformedMileage {
  member_id: string;
  date: string;
  reason: string;
  points: number;
  amount: number;
  consumed_now_boolean: boolean;
  notes: string;
}

export interface TransformedFundsCompany {
  date: string;
  item: string;
  amount: number;
  memo: string;
}

export interface TransformedFundsPersonal {
  member_id: string;
  date: string;
  item: string;
  amount: number;
  memo: string;
}

// ETL 설정
export interface ETLConfig {
  // 매핑 설정
  memberMapping: Record<string, string>; // 이름/코드 → member_id
  channelMapping: Record<string, string>; // 채널명 → channel_id
  categoryMapping: Record<string, string>; // 카테고리명 → category_id

  // 검증 규칙
  validation: {
    requiredFields: string[];
    dateFormats: string[];
    amountRange: [number, number];
    memberCodes: string[];
    channelNames: string[];
    categoryNames: string[];
  };

  // 변환 옵션
  options: {
    skipEmptyRows: boolean;
    trimWhitespace: boolean;
    convertDateFormat: boolean;
    validateForeignKeys: boolean;
    createMissingReferences: boolean;
  };
}

// ETL 결과
export interface ETLResult<T> {
  success: boolean;
  data: T[];
  errors: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
  }>;
  summary: {
    totalRows: number;
    successRows: number;
    errorRows: number;
    warningRows: number;
    skippedRows: number;
  };
}

// 배치 삽입 결과
export interface BatchInsertResult {
  tableName: string;
  success: boolean;
  insertedCount: number;
  errors: Array<{
    index: number;
    data: any;
    error: string;
  }>;
}