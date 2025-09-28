# PDF Generation E2E Tests

MZS 스튜디오 정산 시스템의 PDF 리포트 생성 기능에 대한 종합적인 E2E 테스트 모음입니다.

## 테스트 파일 구조

### 핵심 테스트 파일

1. **06-settlement-pdf-reports.spec.ts**
   - PDF 생성 API 엔드포인트 테스트
   - 다양한 형식(JSON, CSV, PDF) 다운로드 검증
   - 오류 처리 및 보안 테스트
   - 성능 및 경계값 테스트

2. **07-pdf-generation-unit.spec.ts**
   - jsPDF 통합 검증
   - 복잡한 데이터 처리 테스트
   - 메모리 효율성 및 성능 테스트
   - 국제화 및 로케일 테스트

3. **08-pdf-integration-workflow.spec.ts**
   - 완전한 사용자 워크플로우 테스트
   - UI 상호작용과 API 통합 테스트
   - 동시성 및 성능 테스트
   - 사용자 경험 및 접근성 테스트

4. **09-korean-pdf-validation.spec.ts**
   - 한국어 폰트 렌더링 검증
   - 한국어 날짜/통화 형식 테스트
   - 복잡한 한글 문자 처리
   - UTF-8 인코딩 검증

### 유틸리티 파일

5. **utils/pdf-test-helpers.ts**
   - PDF 검증 헬퍼 함수
   - API 테스트 유틸리티
   - 다운로드 검증 도구
   - 보안/경계값 테스트 데이터 생성기

## 테스트 실행

### 전체 PDF 테스트 실행
```bash
npx playwright test --grep "PDF|pdf|정산.*리포트"
```

### 개별 테스트 파일 실행
```bash
# API 기본 테스트
npx playwright test tests/06-settlement-pdf-reports.spec.ts

# 단위 테스트
npx playwright test tests/07-pdf-generation-unit.spec.ts

# 통합 워크플로우 테스트
npx playwright test tests/08-pdf-integration-workflow.spec.ts

# 한국어 검증 테스트
npx playwright test tests/09-korean-pdf-validation.spec.ts
```

### 특정 브라우저에서 실행
```bash
npx playwright test tests/06-settlement-pdf-reports.spec.ts --project=chromium
npx playwright test tests/07-pdf-generation-unit.spec.ts --project=firefox
```

## 테스트 범위

### API 엔드포인트 테스트
- ✅ PDF 생성 API 응답 검증
- ✅ CSV 생성 API 응답 검증
- ✅ JSON 형식 응답 검증
- ✅ 연도/월 파라미터 조회
- ✅ 오류 처리 (400, 404, 500 등)
- ✅ 지원하지 않는 형식 처리

### PDF 콘텐츠 검증
- ✅ PDF 파일 구조 검증
- ✅ 한국어 텍스트 렌더링
- ✅ 파일 크기 및 시그니처 확인
- ✅ 메타데이터 검증

### 데이터 무결성
- ✅ 통화 형식 검증 (₩ 기호, 쉼표 구분자)
- ✅ 날짜 형식 검증 (YYYY-MM)
- ✅ 계산 정확성 검증
- ✅ 멤버별/소스별 분석 일관성

### 성능 및 보안
- ✅ 응답 시간 제한 (PDF: 5초, CSV: 3초, JSON: 2초)
- ✅ 동시 요청 처리
- ✅ SQL 인젝션 방어
- ✅ XSS 공격 방어
- ✅ 경로 탐색 공격 방어

### 사용자 경험
- ✅ 다운로드 워크플로우
- ✅ 키보드 접근성
- ✅ 반응형 디자인 (모바일/데스크톱)
- ✅ 로딩 상태 처리

### 한국어 지원
- ✅ 한글 폰트 렌더링
- ✅ 복잡한 한글 조합 문자
- ✅ 한영 혼합 텍스트
- ✅ UTF-8 인코딩
- ✅ 한국 통화 형식 (원화)
- ✅ 한국 날짜 형식

## 테스트 데이터

### Mock 데이터 사용
테스트에서는 다음과 같은 Mock 데이터를 사용합니다:

- 한국어 멤버 이름: 김철수, 이영희, 박민수 등
- 다양한 금액: 100만원 ~ 1억원 범위
- 원천징수 계산: 3.3% 표준 세율
- 복잡한 한글 조합: 특수 문자 포함 이름

### 보안 테스트 데이터
- SQL 인젝션 패턴
- XSS 공격 패턴
- 경로 탐색 패턴
- 버퍼 오버플로우 패턴

## 환경 요구사항

### 필수 패키지
- Playwright
- Node.js 18+
- jsPDF (API에서 사용)

### 브라우저 지원
- Chrome/Chromium
- Firefox
- Safari/WebKit
- 모바일 브라우저 (iOS Safari, Android Chrome)

## 트러블슈팅

### 다운로드 테스트 실패
다운로드 테스트는 환경에 따라 실패할 수 있습니다. 이는 정상적인 동작이며, 테스트는 API 응답을 우선적으로 검증합니다.

### 한국어 폰트 이슈
PDF에서 한국어 텍스트가 제대로 표시되지 않는 경우, jsPDF의 한국어 폰트 지원을 확인하세요.

### 메모리 사용량
대량 데이터 테스트 시 메모리 사용량이 증가할 수 있습니다. 테스트는 메모리 누수를 감지하고 방지합니다.

## 참고 사항

- 모든 테스트는 실제 API 엔드포인트를 사용합니다
- Mock 데이터는 특정 시나리오 테스트에만 사용됩니다
- 테스트 완료 후 다운로드 파일은 자동으로 정리됩니다
- 테스트 결과는 HTML, JSON, JUnit 형식으로 저장됩니다