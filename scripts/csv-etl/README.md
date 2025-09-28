# CSV ETL 시스템

MZS 스튜디오 정산 시스템의 Excel/CSV 데이터를 Supabase 데이터베이스로 이관하는 ETL 도구입니다.

## 📋 목차

- [설치 및 설정](#설치-및-설정)
- [사용법](#사용법)
- [데이터 형식](#데이터-형식)
- [명령어](#명령어)
- [매핑 설정](#매핑-설정)
- [예제](#예제)
- [문제 해결](#문제-해결)

## 🚀 설치 및 설정

### 1. 환경변수 설정

`.env.local` 파일에 Supabase 연결 정보를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. 의존성 설치

프로젝트 루트에서 의존성을 설치합니다:

```bash
npm install
```

## 🎯 사용법

### 빠른 시작

1. **연결 테스트**
   ```bash
   npm run csv-etl:test
   ```

2. **시드 데이터 삽입**
   ```bash
   npm run csv-etl:seed
   ```

3. **전체 데이터 이관**
   ```bash
   npm run csv-etl:migrate -- --input ./scripts/csv-etl/examples --seed
   ```

### 상세 사용법

#### 전체 마이그레이션
```bash
# 기본 사용법 (./data 디렉토리에서 CSV 파일 읽기)
npm run csv-etl:migrate

# 사용자 지정 디렉토리에서 읽기
npm run csv-etl:migrate -- --input ./my-data

# 기존 데이터 삭제 후 이관
npm run csv-etl:migrate -- --input ./data --clear --seed

# 실제 삽입 없이 검증만 수행
npm run csv-etl:migrate -- --input ./data --dry-run
```

#### 개별 파일 이관
```bash
# 프로젝트 파일 이관
npm run csv-etl -- import --file ./data/projects.csv --table projects

# 컨택 파일 이관
npm run csv-etl -- import --file ./data/contacts.csv --table contacts

# 검증만 수행
npm run csv-etl -- import --file ./data/projects.csv --table projects --dry-run
```

#### 데이터 관리
```bash
# 시드 데이터 삽입
npm run csv-etl:seed

# 모든 데이터 삭제 (주의!)
npm run csv-etl:clear

# 도움말 보기
npm run csv-etl:help
```

## 📊 데이터 형식

### 지원하는 테이블 타입

1. **projects** - 프로젝트 데이터
2. **contacts** - 컨택 이벤트 데이터
3. **feeds** - 피드 작업 데이터
4. **team_tasks** - 팀 업무 데이터
5. **mileage** - 마일리지 데이터
6. **funds** - 공금 데이터 (회사/개인 자동 구분)

### CSV 파일 요구사항

- **인코딩**: UTF-8
- **구분자**: 쉼표 (`,`)
- **첫 번째 행**: 헤더 (컬럼명)
- **파일명**: 테이블 타입 포함 권장 (예: `projects.csv`, `contacts.csv`)

## 📋 데이터 형식 상세

### 1. Projects (프로젝트)

**필수 컬럼:**
- `클라이언트명` - 클라이언트 이름
- `채널` - 크몽, 계좌입금 등
- `카테고리` - 카드뉴스, 포스터 등
- `프로젝트명` - 프로젝트 제목
- `수량` - 프로젝트 수량
- `정가_net` - 정가 (부가세 제외)
- `실입금_B` - 실제 입금액
- `정산일` - 정산 날짜 (YYYY-MM-DD)

**선택 컬럼:**
- `할인_net` - 할인 금액
- `입금액_T` - 부가세 포함 입금액
- `작업일` - 작업 완료 날짜
- `세금계산서` - Y/N
- `비고` - 메모
- `상태` - 진행중/완료/대기 등

**디자이너 컬럼 (동적):**
- `{멤버명}_지분` - 해당 멤버의 지분율
- `{멤버명}_인센티브` - 해당 멤버의 인센티브율

**예제:**
```csv
클라이언트명,채널,카테고리,프로젝트명,수량,정가_net,실입금_B,정산일,오유택_지분,오유택_인센티브
㈜테스트기업,크몽,카드뉴스,신제품 카드뉴스,10,1000000,1000000,2024-01-15,60,5
```

### 2. Contacts (컨택)

**필수 컬럼:**
- `날짜` - 컨택 날짜 (YYYY-MM-DD)
- `멤버` - 담당 멤버 이름/코드
- `이벤트타입` - INCOMING/CHAT/GUIDE
- `금액` - 컨택 단가

**선택 컬럼:**
- `프로젝트` - 연관된 프로젝트명
- `비고` - 메모

**예제:**
```csv
날짜,멤버,이벤트타입,금액,프로젝트,비고
2024-01-10,오유택,INCOMING,1000,신제품 카드뉴스,첫 컨택
```

### 3. Feeds (피드)

**필수 컬럼:**
- `날짜` - 피드 작업 날짜 (YYYY-MM-DD)
- `멤버` - 담당 멤버 이름/코드
- `피드타입` - 피드3개미만/피드3개이상
- `금액` - 피드 단가

**선택 컬럼:**
- `비고` - 메모

**예제:**
```csv
날짜,멤버,피드타입,금액,비고
2024-01-10,오유택,피드3개미만,400,블로그 포스팅
```

### 4. Team Tasks (팀 업무)

**필수 컬럼:**
- `날짜` - 업무 날짜 (YYYY-MM-DD)
- `멤버` - 담당 멤버 이름/코드
- `업무내용` - 업무 설명
- `금액` - 업무 금액

**선택 컬럼:**
- `프로젝트` - 연관된 프로젝트명

**예제:**
```csv
날짜,멤버,프로젝트,업무내용,금액
2024-01-10,오유택,신제품 카드뉴스,초기 기획,50000
```

### 5. Mileage (마일리지)

**필수 컬럼:**
- `날짜` - 마일리지 발생 날짜 (YYYY-MM-DD)
- `멤버` - 대상 멤버 이름/코드
- `사유` - 마일리지 사유
- `마일리지` - 마일리지 포인트
- `금액` - 환산 금액

**선택 컬럼:**
- `현금화` - Y/N (즉시 현금화 여부)
- `비고` - 메모

**예제:**
```csv
날짜,멤버,사유,마일리지,금액,현금화,비고
2024-01-10,오유택,우수 작업 보너스,1000,10000,N,프로젝트 품질 우수
```

### 6. Funds (공금)

**필수 컬럼:**
- `날짜` - 거래 날짜 (YYYY-MM-DD)
- `항목` - 거래 항목
- `금액` - 거래 금액

**선택 컬럼:**
- `멤버` - 개인 보조금인 경우 대상 멤버 (없으면 회사 고정비)
- `메모` - 메모

**예제:**
```csv
날짜,항목,금액,메모,멤버
2024-01-01,사무실 임대료,1500000,1월 임대료,
2024-01-05,교통비 지원,50000,업무용 교통비,오유택
```

## 🎛️ 매핑 설정

### 멤버 매핑

시스템에서 자동으로 다음 멤버를 인식합니다:

| 이름 | 코드 | 영어 이름 |
|------|------|-----------|
| 오유택 | OY | Oh Yutaek |
| 이예천 | LE | Lee Yecheon |
| 김연지 | KY | Kim Yeonji |
| 김하늘 | KH | Kim Haneul |
| 이정수 | IJ | Lee Jungsu |
| 박지윤 | PJ | Park Jiyoon |

### 채널 매핑

| Excel/CSV | 시스템 ID |
|-----------|-----------|
| 크몽, KMONG | kmong |
| 계좌입금, 직접입금, 은행입금 | direct |

### 카테고리 매핑

| Excel/CSV | 시스템 ID |
|-----------|-----------|
| 카드뉴스 | card_news |
| 포스터 | poster |
| 현수막, 배너, 현수막/배너 | banner |
| 메뉴판 | menu |
| 블로그스킨, 블로그 | blog_skin |
| 웹디자인 | web_design |
| 로고 | logo |
| 브랜딩 | branding |
| UI/UX | ui_ux |
| 기타 | others |

### 특수 값 매핑

**Boolean 값 (Y/N):**
- `Y`, `YES`, `네`, `예`, `요청`, `1`, `true` → `true`
- `N`, `NO`, `아니오`, `미요청`, `0`, `false`, 빈 값 → `false`

**이벤트 타입:**
- `인바운드`, `인커밍`, `INCOMING` → `INCOMING`
- `상담`, `채팅`, `CHAT` → `CHAT`
- `가이드`, `GUIDE` → `GUIDE`

**피드 타입:**
- `3개미만`, `피드3개미만`, `BELOW3` → `BELOW3`
- `3개이상`, `피드3개이상`, `GTE3` → `GTE3`

## 📝 명령어 레퍼런스

### 기본 명령어

```bash
# 도움말
npm run csv-etl:help

# 연결 테스트
npm run csv-etl:test

# 시드 데이터 삽입
npm run csv-etl:seed

# 모든 데이터 삭제
npm run csv-etl:clear
```

### 마이그레이션 명령어

```bash
# 전체 마이그레이션
npm run csv-etl -- migrate [options]

# 개별 파일 임포트
npm run csv-etl -- import [options]
```

### 옵션

**migrate 명령어 옵션:**
- `-i, --input <directory>` - CSV 파일 디렉토리 (기본값: ./data)
- `-s, --seed` - 시드 데이터 먼저 삽입
- `-c, --clear` - 기존 데이터 삭제 후 이관
- `-r, --report <file>` - 결과 리포트 파일명 (기본값: etl-report.txt)
- `--dry-run` - 실제 삽입 없이 검증만 수행

**import 명령어 옵션:**
- `-f, --file <file>` - CSV 파일 경로 (필수)
- `-t, --table <table>` - 테이블 타입 (필수): projects|contacts|feeds|team_tasks|mileage|funds
- `-r, --report <file>` - 결과 리포트 파일명
- `--dry-run` - 실제 삽입 없이 검증만 수행

## 🔧 예제

### 1. 전체 데이터 마이그레이션

```bash
# 예제 데이터로 테스트
npm run csv-etl -- migrate --input ./scripts/csv-etl/examples --seed --report ./migration-report.txt

# 실제 데이터 마이그레이션 (기존 데이터 삭제 후)
npm run csv-etl -- migrate --input ./my-excel-data --clear --seed --report ./final-migration.txt

# 검증만 수행 (안전 테스트)
npm run csv-etl -- migrate --input ./my-excel-data --dry-run --report ./validation-report.txt
```

### 2. 개별 파일 임포트

```bash
# 프로젝트 데이터만 임포트
npm run csv-etl -- import --file ./data/projects.csv --table projects

# 컨택 데이터 검증
npm run csv-etl -- import --file ./data/contacts.csv --table contacts --dry-run --report ./contacts-validation.txt
```

### 3. 단계별 데이터 이관

```bash
# 1단계: 연결 테스트
npm run csv-etl:test

# 2단계: 기존 데이터 정리
npm run csv-etl:clear

# 3단계: 시드 데이터 삽입
npm run csv-etl:seed

# 4단계: 검증
npm run csv-etl -- migrate --input ./data --dry-run --report ./validation.txt

# 5단계: 실제 이관
npm run csv-etl -- migrate --input ./data --report ./final-report.txt
```

## 🐛 문제 해결

### 일반적인 오류

1. **연결 오류**
   ```
   데이터베이스 연결 실패
   ```
   - 해결: `.env.local` 파일의 Supabase 연결 정보 확인

2. **파일 인코딩 오류**
   ```
   CSV 파일 읽기 실패
   ```
   - 해결: CSV 파일을 UTF-8 인코딩으로 저장

3. **멤버 매핑 오류**
   ```
   알 수 없는 멤버: XXX
   ```
   - 해결: `config.ts`의 `memberMapping`에 멤버 추가

4. **날짜 형식 오류**
   ```
   지원되지 않는 날짜 형식
   ```
   - 해결: 날짜를 YYYY-MM-DD 형식으로 변경

5. **외래키 오류**
   ```
   채널명을 찾을 수 없습니다
   ```
   - 해결: 시드 데이터 먼저 삽입 (`--seed` 옵션 사용)

### 디버깅 팁

1. **검증 모드 사용**
   ```bash
   npm run csv-etl -- migrate --input ./data --dry-run --report ./debug.txt
   ```

2. **개별 파일 테스트**
   ```bash
   npm run csv-etl -- import --file ./problematic-file.csv --table projects --dry-run
   ```

3. **로그 확인**
   - 콘솔 출력에서 상세한 오류 메시지 확인
   - 리포트 파일에서 행별 오류 내역 검토

4. **데이터 형식 확인**
   - 예제 파일(`./scripts/csv-etl/examples/`)과 비교
   - 헤더명과 데이터 형식이 정확한지 확인

### 성능 최적화

1. **배치 크기 조정**
   - 기본값: 100행씩 처리
   - 큰 파일의 경우 시간이 오래 걸릴 수 있음

2. **네트워크 연결**
   - 안정적인 인터넷 연결 필요
   - VPN 사용 시 연결 속도 확인

3. **메모리 사용량**
   - 매우 큰 파일(10만 행 이상)의 경우 파일을 분할하여 처리

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **로그 및 리포트 파일** - 상세한 오류 정보 확인
2. **예제 파일** - 올바른 데이터 형식 참조
3. **환경변수** - Supabase 연결 정보 확인
4. **인코딩** - CSV 파일이 UTF-8로 저장되었는지 확인

---

**🎉 MZS 스튜디오 정산 시스템 CSV ETL 도구를 사용해주셔서 감사합니다!**