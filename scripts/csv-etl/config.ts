/**
 * CSV ETL Configuration
 * Excel 시트 데이터 매핑 및 변환 설정
 */

import { ETLConfig } from './types';

export const ETL_CONFIG: ETLConfig = {
  // 멤버 매핑 (이름/코드 → member_id)
  memberMapping: {
    // 이름으로 매핑
    '오유택': 'OY',
    '이예천': 'LE',
    '김연지': 'KY',
    '김하늘': 'KH',
    '이정수': 'IJ',
    '박지윤': 'PJ',

    // 코드로도 매핑 지원
    'OY': 'OY',
    'LE': 'LE',
    'KY': 'KY',
    'KH': 'KH',
    'IJ': 'IJ',
    'PJ': 'PJ',

    // 영어 이름 매핑 (필요시)
    'Oh Yutaek': 'OY',
    'Lee Yecheon': 'LE',
    'Kim Yeonji': 'KY',
    'Kim Haneul': 'KH',
    'Lee Jungsu': 'IJ',
    'Park Jiyoon': 'PJ'
  },

  // 채널 매핑 (채널명 → channel_id)
  channelMapping: {
    '크몽': 'kmong',
    'KMONG': 'kmong',
    'Kmong': 'kmong',
    '계좌입금': 'direct',
    '직접입금': 'direct',
    '은행입금': 'direct',
    'DIRECT': 'direct',
    'Direct': 'direct'
  },

  // 카테고리 매핑 (카테고리명 → category_id)
  categoryMapping: {
    '카드뉴스': 'card_news',
    '포스터': 'poster',
    '현수막': 'banner',
    '배너': 'banner',
    '현수막/배너': 'banner',
    '메뉴판': 'menu',
    '블로그스킨': 'blog_skin',
    '블로그': 'blog_skin',
    '웹디자인': 'web_design',
    '로고': 'logo',
    '브랜딩': 'branding',
    '패키지디자인': 'package',
    'UI/UX': 'ui_ux',
    '앱디자인': 'app_design',
    '편집디자인': 'editorial',
    '인쇄물': 'print',
    '기타': 'others'
  },

  // 검증 규칙
  validation: {
    requiredFields: [
      'client_name', 'channel', 'category', 'title',
      'qty', 'list_price_net', 'net_B', 'settle_date'
    ],
    dateFormats: [
      'YYYY-MM-DD',
      'YYYY/MM/DD',
      'YYYY.MM.DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY'
    ],
    amountRange: [0, 100000000], // 0원 ~ 1억원
    memberCodes: ['OY', 'LE', 'KY', 'KH', 'IJ', 'PJ'],
    channelNames: ['크몽', 'KMONG', '계좌입금', '직접입금', '은행입금'],
    categoryNames: [
      '카드뉴스', '포스터', '현수막', '배너', '현수막/배너',
      '메뉴판', '블로그스킨', '웹디자인', '로고', '브랜딩',
      'UI/UX', '앱디자인', '편집디자인', '인쇄물', '기타'
    ]
  },

  // 변환 옵션
  options: {
    skipEmptyRows: true,
    trimWhitespace: true,
    convertDateFormat: true,
    validateForeignKeys: true,
    createMissingReferences: false // 존재하지 않는 참조는 오류로 처리
  }
};

// 예상되는 Excel 컬럼 헤더와 DB 필드 매핑
export const COLUMN_MAPPINGS = {
  // 프로젝트 컬럼 매핑
  projects: {
    '클라이언트명': 'client_name',
    '클라이언트': 'client_name',
    '고객명': 'client_name',
    '채널': 'channel',
    '카테고리': 'category',
    '프로젝트명': 'title',
    '제목': 'title',
    '프로젝트': 'title',
    '수량': 'qty',
    '개수': 'qty',
    '정가_net': 'list_price_net',
    '정가': 'list_price_net',
    '할인_net': 'discount_net',
    '할인': 'discount_net',
    '할인금액': 'discount_net',
    '입금액_T': 'deposit_gross_T',
    '입금액': 'deposit_gross_T',
    '실입금_B': 'net_B',
    '실입금': 'net_B',
    '정산일': 'settle_date',
    '정산날짜': 'settle_date',
    '작업일': 'work_date',
    '작업날짜': 'work_date',
    '세금계산서': 'invoice_requested',
    '세금계산서요청': 'invoice_requested',
    '비고': 'notes',
    '메모': 'notes',
    '상태': 'status'
  },

  // 컨택 컬럼 매핑
  contacts: {
    '날짜': 'date',
    '일자': 'date',
    '멤버': 'member',
    '담당자': 'member',
    '이벤트타입': 'event_type',
    '이벤트': 'event_type',
    '타입': 'event_type',
    '금액': 'amount',
    '단가': 'amount',
    '프로젝트': 'project',
    '연관프로젝트': 'project',
    '비고': 'notes',
    '메모': 'notes'
  },

  // 피드 컬럼 매핑
  feed: {
    '날짜': 'date',
    '일자': 'date',
    '멤버': 'member',
    '담당자': 'member',
    '피드타입': 'fee_type',
    '피드유형': 'fee_type',
    '타입': 'fee_type',
    '금액': 'amount',
    '단가': 'amount',
    '비고': 'notes',
    '메모': 'notes'
  },

  // 팀업무 컬럼 매핑
  teamTasks: {
    '날짜': 'date',
    '일자': 'date',
    '멤버': 'member',
    '담당자': 'member',
    '프로젝트': 'project',
    '연관프로젝트': 'project',
    '업무내용': 'notes',
    '내용': 'notes',
    '업무': 'notes',
    '금액': 'amount'
  },

  // 마일리지 컬럼 매핑
  mileage: {
    '날짜': 'date',
    '일자': 'date',
    '멤버': 'member',
    '담당자': 'member',
    '사유': 'reason',
    '내용': 'reason',
    '마일리지': 'points',
    '포인트': 'points',
    '금액': 'amount',
    '현금화': 'consumed_now',
    '사용여부': 'consumed_now',
    '비고': 'notes',
    '메모': 'notes'
  },

  // 공금 컬럼 매핑
  funds: {
    '날짜': 'date',
    '일자': 'date',
    '항목': 'item',
    '내용': 'item',
    '금액': 'amount',
    '메모': 'memo',
    '비고': 'memo',
    '타입': 'type',
    '구분': 'type',
    '멤버': 'member',
    '담당자': 'member'
  }
};

// 특수 값 매핑
export const SPECIAL_VALUES = {
  // 세금계산서 요청 여부
  invoiceRequested: {
    'Y': true,
    'YES': true,
    '네': true,
    '예': true,
    '요청': true,
    '1': true,
    'true': true,
    'N': false,
    'NO': false,
    '아니오': false,
    '아니요': false,
    '미요청': false,
    '0': false,
    'false': false,
    '': false
  },

  // 현금화 여부
  consumed: {
    'Y': true,
    'YES': true,
    '네': true,
    '예': true,
    '사용': true,
    '현금화': true,
    '1': true,
    'true': true,
    'N': false,
    'NO': false,
    '아니오': false,
    '아니요': false,
    '미사용': false,
    '0': false,
    'false': false,
    '': false
  },

  // 이벤트 타입 매핑
  eventTypes: {
    '인바운드': 'INCOMING',
    '인커밍': 'INCOMING',
    'INCOMING': 'INCOMING',
    '상담': 'CHAT',
    '채팅': 'CHAT',
    'CHAT': 'CHAT',
    '가이드': 'GUIDE',
    'GUIDE': 'GUIDE'
  },

  // 피드 타입 매핑
  feedTypes: {
    '3개미만': 'BELOW3',
    '피드3개미만': 'BELOW3',
    'BELOW3': 'BELOW3',
    '3개이상': 'GTE3',
    '피드3개이상': 'GTE3',
    'GTE3': 'GTE3'
  },

  // 상태 매핱
  status: {
    '진행중': 'in_progress',
    '완료': 'completed',
    '대기': 'pending',
    '취소': 'cancelled',
    '보류': 'on_hold'
  }
};

// 디자이너 관련 컬럼 패턴 (동적 감지)
export const DESIGNER_PATTERNS = {
  shareColumns: /^(.+)_지분$|^(.+)지분$|^(.+)_share$|^(.+)_percent$/i,
  bonusColumns: /^(.+)_인센티브$|^(.+)인센티브$|^(.+)_bonus$|^(.+)_bonus_pct$/i
};