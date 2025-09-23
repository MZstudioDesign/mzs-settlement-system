# MZS Settlement System - E2E Test Suite Guide

## 개요

MZS 스튜디오 정산 시스템을 위한 포괄적인 End-to-End (E2E) 테스트 스위트입니다. Playwright를 사용하여 실제 사용자 시나리오를 시뮬레이션하고 애플리케이션의 모든 주요 기능을 검증합니다.

## 🎯 테스트 범위

### 핵심 기능
- ✅ **인증 & 네비게이션**: 로그인/로그아웃, 보호된 라우트, 메뉴 네비게이션
- ✅ **대시보드**: KPI 표시, 순위 테이블, 최근 활동, 월간 진행률
- ✅ **프로젝트 관리**: CRUD 작업, 디자이너 할당, 정산 계산 미리보기
- ✅ **FAB 퀵 로거**: 모바일 원탭 로깅, 오프라인 지원, 동기화
- ✅ **컨택 & 피드**: 데이터 입력, 현금화 처리, 필터링
- ✅ **정산 관리**: 월별 생성, PDF/CSV 내보내기, 지급 처리
- ✅ **모바일 반응형**: 터치 인터랙션, 반응형 레이아웃, 디바이스별 최적화
- ✅ **에러 처리**: 네트워크 오류, 서버 에러, 유효성 검사, 보안

### 테스트 카테고리
1. **기능 테스트**: 모든 주요 사용자 워크플로우
2. **UI/UX 테스트**: 반응형 디자인 및 모바일 인터랙션
3. **통합 테스트**: API 연동 및 데이터 흐름
4. **성능 테스트**: 로딩 시간 및 리소스 사용량
5. **보안 테스트**: XSS 방지 및 입력 검증
6. **접근성 테스트**: WCAG 준수 및 키보드 네비게이션
7. **크로스 브라우저**: Chrome, Firefox, Safari 호환성
8. **모바일 테스트**: iOS/Android 디바이스 시뮬레이션

## 📁 테스트 구조

```
tests/
├── auth/                          # 인증 및 네비게이션 테스트
│   └── authentication.spec.ts
├── dashboard/                     # 대시보드 테스트
│   └── dashboard.spec.ts
├── projects/                      # 프로젝트 관리 테스트
│   └── projects-management.spec.ts
├── fab/                          # FAB 퀵 로거 테스트
│   └── fab-quick-logger.spec.ts
├── contacts-feed/                # 컨택 & 피드 테스트
│   └── contacts-feed.spec.ts
├── settlements/                  # 정산 관리 테스트
│   └── settlements.spec.ts
├── responsive/                   # 모바일 반응형 테스트
│   └── mobile-responsive.spec.ts
├── error-handling/              # 에러 처리 테스트
│   └── error-edge-cases.spec.ts
├── test-utils.ts               # 공통 유틸리티 함수
├── global-setup.ts             # 전역 설정
└── global-teardown.ts          # 전역 정리
```

## 🚀 실행 방법

### 1. 전체 테스트 실행

#### Windows
```bash
# 배치 파일 실행 (권장)
run-tests-comprehensive.bat

# 또는 PowerShell에서
.\run-tests-comprehensive.bat
```

#### macOS/Linux
```bash
# 실행 권한 부여
chmod +x run-tests-comprehensive.sh

# 스크립트 실행
./run-tests-comprehensive.sh
```

### 2. 개별 테스트 스위트 실행

```bash
# 인증 테스트
npm run test:e2e tests/auth/authentication.spec.ts

# 대시보드 테스트
npm run test:e2e tests/dashboard/dashboard.spec.ts

# 프로젝트 관리 테스트
npm run test:e2e tests/projects/projects-management.spec.ts

# FAB 퀵 로거 테스트
npm run test:e2e tests/fab/fab-quick-logger.spec.ts

# 모바일 반응형 테스트
npm run test:e2e tests/responsive/mobile-responsive.spec.ts
```

### 3. 특정 브라우저에서 실행

```bash
# Chrome에서 실행
npm run test:e2e --project=chromium

# Firefox에서 실행
npm run test:e2e --project=firefox

# Safari에서 실행
npm run test:e2e --project=webkit

# 모바일 Chrome에서 실행
npm run test:e2e --project="Mobile Chrome"
```

### 4. 헤드풀 모드로 실행 (브라우저 UI 표시)

```bash
npm run test:e2e:headed
```

### 5. 디버그 모드로 실행

```bash
npm run test:e2e:debug
```

## 📊 테스트 리포트

테스트 실행 후 다양한 형태의 리포트가 생성됩니다:

### HTML 리포트
```
test-results/html-report/index.html
```
- 브라우저에서 열어 볼 수 있는 상세 리포트
- 실패한 테스트의 스크린샷과 비디오 포함
- 테스트 실행 시간 및 통계

### JSON 결과
```
test-results/results.json
```
- 기계가 읽을 수 있는 형태의 테스트 결과
- CI/CD 파이프라인 통합에 활용

### JUnit XML
```
test-results/results.xml
```
- Jenkins, Azure DevOps 등과 호환되는 형식

### 테스트 아티팩트
```
test-results/
├── screenshots/  # 실패한 테스트의 스크린샷
├── videos/       # 테스트 실행 비디오
└── traces/       # 상세한 실행 추적 정보
```

## 🛠️ 테스트 설정

### 환경 변수
```bash
# .env.test 파일 또는 환경 변수로 설정
BASE_URL=http://localhost:3001
TEST_USERNAME=admin
TEST_PASSWORD=test123
```

### Playwright 설정
`playwright.config.ts`에서 다음 사항들을 설정할 수 있습니다:

- 타임아웃 설정
- 브라우저 설정
- 디바이스 에뮬레이션
- 리포팅 옵션
- 병렬 실행 설정

## 🔧 테스트 작성 가이드

### 기본 테스트 구조
```typescript
import { test, expect } from '@playwright/test';
import { authenticatedPage, waitForPageLoad } from '../test-utils';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedPage(page, '/target-page');
  });

  test('should perform expected action', async ({ page }) => {
    // 테스트 로직
    await page.click('[data-testid="action-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### 테스트 데이터 사용
```typescript
import { SAMPLE_DATA } from '../test-utils';

test('should create project with sample data', async ({ page }) => {
  await page.fill('[name="client_name"]', SAMPLE_DATA.project.client_name);
  await page.fill('[name="net_B"]', SAMPLE_DATA.project.net_B);
});
```

### 모바일 테스트
```typescript
test.beforeEach(async ({ page }) => {
  await setMobileViewport(page);
  await authenticatedPage(page);
});

test('should work on mobile', async ({ page }) => {
  await tapElement(page, '[data-testid="mobile-button"]');
  await checkResponsiveLayout(page, 'mobile');
});
```

### 오프라인 시나리오 테스트
```typescript
test('should handle offline scenario', async ({ page, context }) => {
  await simulateOffline(context);
  // 오프라인 시나리오 테스트
  await simulateOnline(context);
  // 동기화 확인
});
```

## 📱 테스트되는 디바이스

### 데스크톱
- Chrome (Latest)
- Firefox (Latest)
- Safari (Latest)

### 모바일
- iPhone 12 (iOS Safari)
- Pixel 5 (Android Chrome)
- iPad Pro (iPadOS Safari)

### 반응형 브레이크포인트
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

## 🔍 주요 테스트 시나리오

### 인증 워크플로우
- [x] 유효한 자격 증명으로 로그인
- [x] 잘못된 자격 증명 에러 처리
- [x] 세션 만료 처리
- [x] 보호된 라우트 리다이렉션
- [x] 로그아웃 기능

### 프로젝트 관리
- [x] 새 프로젝트 생성
- [x] 프로젝트 수정 및 삭제
- [x] 디자이너 지분 할당
- [x] 정산 계산 미리보기
- [x] 유효성 검사 에러 처리

### FAB 퀵 로거
- [x] 모바일에서 FAB 표시
- [x] 멤버 선택 및 액션 실행
- [x] 오프라인 데이터 저장
- [x] 온라인 복귀 시 동기화
- [x] 네트워크 에러 처리

### 정산 처리
- [x] 월별 정산 생성
- [x] 계산 로직 검증
- [x] PDF/CSV 내보내기
- [x] 지급 상태 관리
- [x] 원천징수 계산

### 모바일 최적화
- [x] 터치 인터랙션
- [x] 반응형 레이아웃
- [x] 모바일 네비게이션
- [x] 성능 최적화
- [x] 접근성 준수

## 🚨 CI/CD 통합

### GitHub Actions 예시
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## 🐛 문제 해결

### 일반적인 문제들

#### 1. 개발 서버가 시작되지 않음
```bash
# 포트 3001이 사용 중인지 확인
netstat -an | grep 3001

# 다른 터미널에서 수동으로 서버 시작
npm run dev
```

#### 2. 브라우저가 설치되지 않음
```bash
npx playwright install
```

#### 3. 테스트가 타임아웃됨
- `playwright.config.ts`에서 타임아웃 설정 증가
- 네트워크 속도 확인
- 개발 서버 성능 확인

#### 4. 스크린샷/비디오가 생성되지 않음
```typescript
// playwright.config.ts에서 설정 확인
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

### 테스트 디버깅

#### 1. 스텝별 스크린샷
```typescript
await page.screenshot({ path: 'debug-step1.png' });
```

#### 2. 콘솔 로그 확인
```typescript
page.on('console', msg => console.log(msg.text()));
```

#### 3. 네트워크 요청 모니터링
```typescript
page.on('request', request => console.log('Request:', request.url()));
page.on('response', response => console.log('Response:', response.url()));
```

## 📈 테스트 성능 최적화

### 병렬 실행
- 기본적으로 테스트는 병렬로 실행됩니다
- CI 환경에서는 1개 워커, 로컬에서는 CPU 개수의 절반 사용

### 리소스 관리
- 불필요한 리소스 로딩 차단
- 테스트 간 격리 보장
- 메모리 사용량 모니터링

### 선택적 실행
```bash
# 특정 태그만 실행
npm run test:e2e --grep "@smoke"

# 특정 파일만 실행
npm run test:e2e tests/auth/
```

## 🔒 보안 고려사항

### 테스트 데이터
- 실제 프로덕션 데이터 사용 금지
- 테스트용 샘플 데이터 사용
- 민감한 정보 하드코딩 금지

### 인증
- 테스트용 계정 사용
- 토큰 및 세션 적절히 관리
- 테스트 후 세션 정리

## 📞 지원 및 문의

테스트 관련 문의사항이나 이슈가 있을 경우:

1. 먼저 이 가이드의 문제 해결 섹션 확인
2. GitHub Issues에 상세한 내용과 함께 등록
3. 테스트 실행 로그와 스크린샷 첨부

---

**참고**: 이 테스트 스위트는 실제 사용자 경험을 최대한 반영하도록 설계되었습니다. 정기적으로 업데이트하여 새로운 기능과 변경사항을 반영해주세요.