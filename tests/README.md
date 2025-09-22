# MZS 정산 시스템 E2E 테스트

MZS 스튜디오 정산 시스템을 위한 포괄적인 End-to-End 테스트 스위트입니다.

## 🧪 테스트 구조

### 테스트 파일 구성

1. **01-homepage.spec.ts** - 홈페이지 테스트
   - 페이지 로드 및 기본 요소 확인
   - 네비게이션 링크 동작
   - 기능 카드 표시 확인
   - 시스템 상태 확인

2. **02-projects-crud.spec.ts** - 프로젝트 CRUD 테스트
   - 프로젝트 목록 페이지 기능
   - 새 프로젝트 생성 플로우
   - 프로젝트 편집 및 상세 보기
   - 검색 및 필터링 기능

3. **03-settlement-calculator.spec.ts** - 정산 계산 테스트
   - 실시간 정산 계산 검증
   - 디자이너 지분 설정
   - 부가세 및 원천징수 계산
   - 인센티브 적용 테스트

4. **04-responsive-mobile.spec.ts** - 모바일 반응형 테스트
   - 다양한 뷰포트에서의 레이아웃
   - 터치 타겟 크기 검증
   - 모바일 네비게이션
   - 반응형 그리드 확인

5. **05-accessibility.spec.ts** - 접근성 테스트
   - 키보드 네비게이션
   - ARIA 속성 및 시맨틱 마크업
   - 스크린 리더 호환성
   - 색상 대비 및 포커스 표시

## 🚀 테스트 실행

### 사전 준비

```bash
# 의존성 설치
npm install

# Playwright 브라우저 설치
npm run test:install

# 또는
npx playwright install
```

### 개발 서버 시작

```bash
# 개발 서버 시작 (포트 3001)
npm run dev
```

### 테스트 실행 명령어

```bash
# 모든 E2E 테스트 실행 (헤드리스 모드)
npm run test:e2e

# UI 모드로 테스트 실행 (테스트 선택 및 디버깅)
npm run test:e2e:ui

# 디버그 모드로 테스트 실행
npm run test:e2e:debug

# 브라우저를 보면서 테스트 실행
npm run test:e2e:headed

# 테스트 결과 리포트 보기
npm run test:e2e:report
```

### 특정 테스트 실행

```bash
# 특정 파일만 실행
npx playwright test 01-homepage.spec.ts

# 특정 브라우저에서만 실행
npx playwright test --project=chromium

# 특정 테스트 이름 패턴으로 실행
npx playwright test --grep "홈페이지"
```

## 🛠️ 설정

### Playwright 설정 (playwright.config.ts)

- **베이스 URL**: `http://localhost:3001`
- **브라우저**: Chromium, Firefox, WebKit
- **모바일 디바이스**: iPhone 12, Pixel 5, iPad Pro
- **스크린샷**: 실패 시에만 캡처
- **비디오**: 실패 시에만 녹화
- **리포트**: HTML, JSON, JUnit 형식

### 환경 변수

```bash
# .env.local 파일에서 설정
BASE_URL=http://localhost:3001
```

## 📊 테스트 시나리오

### 1. 홈페이지 기능 테스트

- **페이지 로드**: 메인 헤딩, 소개 텍스트 확인
- **기능 카드**: 4개 주요 기능 카드 표시
- **빠른 시작**: 네비게이션 버튼 동작
- **시스템 상태**: 정상 운영 상태 표시
- **반응형**: 다양한 화면 크기에서 레이아웃

### 2. 프로젝트 관리 기능

- **목록 표시**: 프로젝트 테이블, 통계 카드
- **검색/필터**: 프로젝트명, 상태, 채널별 필터링
- **CRUD 작업**: 생성, 읽기, 수정, 삭제
- **배치 작업**: 다중 선택 및 상태 변경
- **페이지네이션**: 목록 페이징 처리

### 3. 정산 계산 검증

- **실시간 계산**: 입력값 변경 시 즉시 반영
- **세금 계산**: 부가세(10%) 및 원천징수(3.3%)
- **지분 분배**: 디자이너별 지분 설정
- **인센티브**: 추가 보너스 계산
- **유효성 검사**: 100% 초과 방지

### 4. 모바일 사용성

- **터치 타겟**: 최소 44px × 44px 크기
- **뷰포트 대응**: 320px~1440px 범위
- **터치 제스처**: 탭, 스와이프 지원
- **키보드**: 가상 키보드 최적화
- **성능**: 모바일 환경 최적화

### 5. 웹 접근성

- **키보드 네비게이션**: Tab, Enter, Space, Escape
- **스크린 리더**: ARIA 레이블, 역할, 상태
- **시각적 접근성**: 색상 대비, 포커스 표시
- **폼 접근성**: 레이블 연결, 오류 처리
- **시맨틱 마크업**: 적절한 HTML 구조

## 🔍 디버깅

### 실패한 테스트 분석

1. **스크린샷 확인**: `test-results/` 폴더의 실패 스크린샷
2. **비디오 재생**: 실패 과정 동영상 확인
3. **로그 분석**: 콘솔 출력 및 네트워크 요청
4. **HTML 리포트**: 상세 테스트 결과 보고서

### 일반적인 문제 해결

```bash
# 브라우저 재설치
npx playwright install --force

# 캐시 클리어
rm -rf test-results/
rm -rf playwright-report/

# 개발 서버 재시작
npm run dev
```

## 🚦 CI/CD 통합

### GitHub Actions

`.github/workflows/e2e-tests.yml` 파일로 자동화된 테스트 실행:

- **트리거**: main/develop 브랜치 푸시, PR 생성
- **환경**: Ubuntu 최신 버전, Node.js 18
- **브라우저**: 모든 지원 브라우저 설치
- **결과 업로드**: 테스트 리포트 및 아티팩트

### 로컬 CI 테스트

```bash
# CI 환경과 동일한 조건으로 테스트
CI=true npm run test:e2e
```

## 📝 테스트 작성 가이드

### 새 테스트 추가

1. `tests/` 폴더에 `*.spec.ts` 파일 생성
2. 의미 있는 테스트 이름과 설명 작성
3. `test.beforeEach`로 공통 설정
4. 명확한 어설션 사용

### 베스트 프랙티스

- **페이지 대기**: `page.waitForLoadState('networkidle')`
- **선택자 우선순위**: `data-testid` > 텍스트 > CSS 선택자
- **에러 처리**: `try-catch`와 조건부 테스트
- **타임아웃**: 적절한 대기 시간 설정
- **병렬 실행**: 독립적인 테스트 작성

## 🔧 유지보수

### 정기 업데이트

- Playwright 버전 업데이트
- 브라우저 호환성 확인
- 새 기능에 대한 테스트 추가
- 성능 모니터링 및 최적화

### 테스트 안정성

- 플래키 테스트 식별 및 수정
- 재시도 로직 구현
- 대기 전략 최적화
- 테스트 데이터 관리

## 📚 참고 자료

- [Playwright 공식 문서](https://playwright.dev/)
- [웹 접근성 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [모바일 UI 디자인 원칙](https://material.io/design/usability/accessibility.html)
- [Next.js 테스팅 가이드](https://nextjs.org/docs/testing)