# MZS Settlement System

> 🎨 **MZS 스튜디오 정산 시스템** - 모바일 우선 디자인 스튜디오 정산 관리 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

MZS 스튜디오의 디자이너 정산을 자동화하고 관리하는 웹 애플리케이션입니다. 복잡한 정산 계산을 자동화하고, 모바일 환경에서 간편하게 업무를 기록할 수 있는 시스템입니다.

## ✨ 주요 기능

### 📊 대시보드
- **실시간 KPI 모니터링**: 이달 매출, 프로젝트 수, 정산 현황
- **성과 랭킹**: 2.5배 환산 기준 디자이너 성과 순위
- **월간 목표 진행률**: 시각적 진행률 표시
- **최근 활동**: 실시간 업무 활동 로그

### 💼 프로젝트 관리
- **프로젝트 생성/수정**: 클라이언트, 채널, 카테고리별 관리
- **디자이너 할당**: 지분율과 보너스율 설정
- **자동 정산 계산**: VAT, 수수료, 원천징수 자동 계산
- **파일 관리**: 프로젝트별 파일 업로드 (최대 5개, 10MB)

### 🤝 컨택 관리
- **이벤트 기록**: INCOMING(1,000원), CHAT(1,000원), GUIDE(2,000원)
- **프로젝트 연결**: 컨택을 특정 프로젝트와 연결
- **실시간 입력**: 모바일 FAB를 통한 원탭 로깅

### 📝 피드 관리
- **피드백 수익**: 3개 미만(400원), 3개 이상(1,000원)
- **누적 허용**: 여러 피드백 건 누적 가능
- **즉시 현금화**: 요청 시 바로 정산 반영

### 👥 팀 업무
- **금액형 로그**: 날짜별 팀 업무 금액 기록
- **프로젝트 연결**: 특정 프로젝트와 연결된 팀 업무
- **메모 기능**: 상세 업무 내용 기록

### 💰 정산 시스템
- **월별 정산**: 자동 정산 생성 및 계산
- **스냅샷 저장**: 정산 시점 데이터 보존
- **원천징수**: 3.3% 자동 계산 및 표시
- **PDF/CSV 내보내기**: 정산표 다운로드

### ⚙️ 설정 관리
- **규칙 설정**: 수수료율, 단가 설정
- **멤버 관리**: 디자이너 정보 관리
- **브랜딩**: 로고, 컬러 커스터마이징

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **State Management**: TanStack Query (React Query)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **API**: Next.js API Routes
- **Real-time**: Supabase Realtime

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Testing**: Playwright (E2E)
- **Type Checking**: TypeScript
- **Code Formatting**: Prettier (via ESLint)

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.17+ 또는 20.5+
- npm, yarn, 또는 pnpm
- Supabase 계정

### 설치

1. **레포지토리 클론**
   ```bash
   git clone <repository-url>
   cd mzs-settlement-system
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env.local
   ```

   `.env.local` 파일에 Supabase 설정을 입력하세요:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **개발 서버 시작**
   ```bash
   npm run dev
   ```

5. **브라우저에서 확인**
   ```
   http://localhost:3000
   ```

### 데이터베이스 설정

1. **Supabase 프로젝트 생성**
   - [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트 생성

2. **마이그레이션 실행**
   ```sql
   -- SQL Editor에서 순서대로 실행
   supabase/migrations/20240922000001_initial_schema.sql
   supabase/migrations/20240922000002_rls_policies.sql
   supabase/migrations/20240922000003_seed_data.sql
   supabase/migrations/20240922000004_add_missing_tables.sql
   supabase/migrations/20240922000005_seed_missing_tables.sql
   ```

3. **시드 데이터 확인**
   - 기본 멤버: 오유택(OY), 이예천(LE), 김연지(KY), 김하늘(KH), 이정수(IJ), 박지윤(PJ)
   - 기본 채널: 크몽(21% 수수료), 계좌입금(0% 수수료)
   - 기본 카테고리: 카드뉴스, 포스터, 현수막/배너, 메뉴판, 블로그스킨

## 🏗️ 프로젝트 구조

```
mzs-settlement-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── projects/          # 프로젝트 페이지
│   │   ├── settlements/       # 정산 페이지
│   │   └── ...
│   ├── components/            # React 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   ├── forms/            # 폼 컴포넌트
│   │   ├── tables/           # 테이블 컴포넌트
│   │   └── layout/           # 레이아웃 컴포넌트
│   ├── lib/                  # 유틸리티 라이브러리
│   │   ├── supabase/         # Supabase 클라이언트
│   │   ├── settlement-calculations.ts # 정산 계산 로직
│   │   └── ...
│   ├── types/                # TypeScript 타입 정의
│   └── hooks/                # 커스텀 React 훅
├── supabase/
│   └── migrations/           # 데이터베이스 마이그레이션
├── tests/                    # E2E 테스트
├── public/                   # 정적 파일
└── scripts/                  # 유틸리티 스크립트
```

## 💡 주요 비즈니스 로직

### 정산 계산 공식

1. **기본 계산**
   ```
   T (총액, VAT 포함) → B (순액) = T / 1.1
   base (정가) = B + 할인금액
   ```

2. **수수료 계산** (B 기준)
   ```
   광고비: B × 10%
   프로그램비: B × 3%
   채널수수료: B × 채널수수료율 (크몽: 21%, 계좌입금: 0%)
   ```

3. **디자이너 분배**
   ```
   디자이너 기본: base × 40% × 지분율
   보너스: 디자이너 기본 × 보너스율 (0-20%)
   원천징수 전: 디자이너 기본 + 보너스
   원천징수 후: 원천징수 전 × (1 - 3.3%)
   ```

### 컨택/피드 시스템

- **컨택 단가**: INCOMING(1,000원), CHAT(1,000원), GUIDE(2,000원)
- **피드 단가**: 3개 미만(400원), 3개 이상(1,000원)
- **원천징수**: 모든 개인 지급 항목에 3.3% 적용

## 🧪 테스트

### E2E 테스트 실행

```bash
# Playwright 설치
npm run test:install

# 테스트 실행
npm run test:e2e

# 헤드리스 모드로 실행
npm run test:e2e:headed

# 디버그 모드
npm run test:e2e:debug

# UI 모드
npm run test:e2e:ui
```

### 테스트 커버리지

- **프로젝트 CRUD**: 생성, 수정, 삭제, 조회
- **정산 계산**: 다양한 시나리오별 정산 계산 검증
- **컨택/피드 로깅**: FAB 기능 및 데이터 동기화
- **파일 업로드**: 프로젝트 파일 관리
- **반응형 디자인**: 모바일/데스크톱 호환성

## 📱 모바일 지원

### PWA 기능
- **오프라인 지원**: ServiceWorker를 통한 오프라인 기능
- **앱 설치**: 홈 화면에 앱 추가 가능
- **푸시 알림**: 정산 알림 (계획 중)

### 모바일 UX
- **FAB (Floating Action Button)**: 원탭 컨택/피드 로깅
- **터치 최적화**: 터치 친화적 인터페이스
- **반응형 디자인**: 모든 디바이스 호환

## 🔧 개발 가이드

### 새 기능 추가

1. **API 엔드포인트**
   ```typescript
   // src/app/api/new-feature/route.ts
   export async function GET() {
     // 구현
   }
   ```

2. **컴포넌트**
   ```typescript
   // src/components/new-feature/NewFeature.tsx
   export function NewFeature() {
     // 구현
   }
   ```

3. **타입 정의**
   ```typescript
   // src/types/new-feature.ts
   export interface NewFeatureType {
     // 정의
   }
   ```

### 코딩 규칙

- **파일명**: kebab-case (예: `settlement-calculations.ts`)
- **컴포넌트명**: PascalCase (예: `SettlementForm`)
- **함수명**: camelCase (예: `calculateSettlement`)
- **상수명**: UPPER_SNAKE_CASE (예: `VAT_RATE`)

### 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가 또는 수정
chore: 기타 변경사항
```

## 📊 API 문서

### 주요 엔드포인트

#### 프로젝트 API
```typescript
GET    /api/projects           # 프로젝트 목록
POST   /api/projects           # 프로젝트 생성
GET    /api/projects/[id]      # 프로젝트 상세
PUT    /api/projects/[id]      # 프로젝트 수정
DELETE /api/projects/[id]      # 프로젝트 삭제
GET    /api/projects/stats     # 프로젝트 통계
```

#### 정산 API
```typescript
GET    /api/settlements        # 정산 목록
POST   /api/settlements        # 정산 생성
GET    /api/settlements/[id]   # 정산 상세
PUT    /api/settlements/[id]   # 정산 수정
```

#### 지원 데이터 API
```typescript
GET    /api/supporting-data    # 멤버, 채널, 카테고리 등
```

## 🔐 보안

### 데이터 보호
- **Row Level Security (RLS)**: Supabase RLS로 데이터 접근 제어
- **타입 안전성**: TypeScript로 런타임 오류 방지
- **입력 검증**: Zod 스키마로 입력 데이터 검증
- **HTTPS 강제**: 프로덕션에서 HTTPS만 허용

### 인증 및 권한
- **Supabase Auth**: 안전한 인증 시스템
- **세션 관리**: 자동 토큰 갱신
- **권한 기반 접근**: 역할별 데이터 접근 제어

## 🚀 배포

### Vercel 배포 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 환경 변수 설정
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 롤 키

자세한 배포 가이드는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참조하세요.

## 📈 성능 최적화

### 빌드 최적화
- **Tree Shaking**: 사용하지 않는 코드 제거
- **Code Splitting**: 페이지별 코드 분할
- **Image Optimization**: Next.js 이미지 최적화
- **Bundle Analysis**: `@next/bundle-analyzer`로 번들 분석

### 런타임 최적화
- **React Query**: 서버 상태 캐싱
- **Memoization**: React.memo, useMemo, useCallback
- **Lazy Loading**: 지연 로딩으로 초기 로드 시간 단축

## 🤝 기여하기

1. **Fork** 프로젝트
2. **Feature 브랜치** 생성 (`git checkout -b feature/amazing-feature`)
3. **커밋** (`git commit -m 'feat: add amazing feature'`)
4. **Push** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

### 개발 환경 설정
```bash
# 개발 의존성 설치
npm install

# Pre-commit 훅 설정
npm run prepare

# 코드 스타일 확인
npm run lint

# 타입 체크
npm run type-check
```

## 📄 라이센스

이 프로젝트는 [MIT 라이센스](./LICENSE) 하에 배포됩니다.

## 🙋‍♂️ 지원 및 문의

- **이슈 리포트**: [GitHub Issues](../../issues)
- **기능 요청**: [GitHub Discussions](../../discussions)
- **문서 질문**: [Wiki](../../wiki)

## 📚 추가 문서

- [🏗️ 시스템 아키텍처](./ARCHITECTURE.md)
- [🚀 배포 가이드](./DEPLOYMENT_GUIDE.md)
- [🔧 API 문서](./API_DOCUMENTATION.md)
- [🚨 문제 해결](./TROUBLESHOOTING.md)

---

**MZS Settlement System** | Made with ❤️ by MZS Studio Team
