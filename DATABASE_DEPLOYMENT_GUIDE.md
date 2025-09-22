# MZS Settlement System - 데이터베이스 배포 가이드

## 📋 개요

MZS 스튜디오 정산 시스템을 위한 Supabase PostgreSQL 데이터베이스 스키마 배포 가이드입니다.

## 🏗️ 데이터베이스 아키텍처

### ERD (Entity Relationship Diagram)
```
👥 Members (6명 디자이너)
  ↓
🔗 Projects (정산 대상 프로젝트)
  ├── 📊 Channel (크몽 21%, 계좌입금 0%)
  ├── 📁 Category (PPT, 브랜드, 편집 등)
  ├── 📎 Project Files (최대 5개)
  └── 💰 Designer Allocation (JSON: 지분%, bonus%)
  ↓
📞 Contacts (유입1000/상담1000/가이드2000)
📱 Feed Logs (3개미만400/3개이상1000)
  ↓
📈 Settlement Items (정산 상세 계산)
  └── 📊 Settlements (월별 스냅샷)
```

### 핵심 정산 공식 (DB 함수로 구현)
```sql
-- T: 총입금 (부가세 포함)
-- B = round(T / 1.1) : 실입금
-- base = B + 할인_net
-- 디자이너 분배 = base × 0.40 × 지분%
-- 가산금 = 디자이너 분배 × bonus_pct (0~20%)
-- 원천징수 = (디자이너 분배 + 가산금) × 3.3%
-- 지급액 = (디자이너 분배 + 가산금) - 원천징수
```

## 🚀 빠른 배포 (Supabase Cloud)

### 1. Supabase 프로젝트 생성
```bash
# Supabase 계정 가입 후 새 프로젝트 생성
# https://app.supabase.com/
# 프로젝트명: mzs-settlement-system
# 지역: Asia Pacific (Singapore) 권장
```

### 2. 환경변수 설정
```bash
# .env.local 파일 생성
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Initial Admin Credentials (사용 후 삭제 권장)
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=your_secure_password_here
EOF
```

### 3. 마이그레이션 실행
```bash
# SQL 스크립트를 Supabase SQL Editor에서 순서대로 실행
# 1. supabase/migrations/20240922000001_initial_schema.sql
# 2. supabase/migrations/20240922000002_rls_policies.sql
# 3. supabase/migrations/20240922000003_seed_data.sql
```

### 4. 검증 쿼리 실행
```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 시드 데이터 확인
SELECT name, code FROM public.members ORDER BY name;
SELECT name, fee_rate FROM public.channels ORDER BY name;

-- 정산 계산 함수 테스트
SELECT * FROM calculate_settlement_amount(1100000, 0, 60, 10);
```

## 🔧 로컬 개발 환경 (선택사항)

### 1. Supabase CLI 설치
```bash
# macOS
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
curl -s https://api.github.com/repos/supabase/cli/releases/latest \
| grep "browser_download_url.*linux-amd64" \
| cut -d '"' -f 4 \
| wget -qi - -O supabase.tar.gz \
&& tar -xzf supabase.tar.gz \
&& sudo mv supabase /usr/local/bin/
```

### 2. 로컬 Supabase 시작
```bash
cd mzs-settlement-system
supabase init
supabase start

# 로컬 환경 접속 정보
# Studio URL: http://127.0.0.1:54323
# API URL: http://127.0.0.1:54321
# DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 3. 마이그레이션 적용
```bash
# 마이그레이션 파일들이 자동으로 적용됨
supabase db reset

# 특정 마이그레이션만 적용
supabase db push
```

### 4. 타입 생성 (TypeScript)
```bash
# TypeScript 타입 자동 생성
supabase gen types typescript --local > src/types/supabase.ts
```

## 📊 데이터베이스 구조 상세

### 주요 테이블

#### 1. members (멤버 관리)
```sql
-- 6명의 MZS Studio 디자이너
INSERT INTO members (name, code) VALUES
('오유택', 'OUT'), ('이예천', 'LYC'), ('김연지', 'KYJ'),
('김하늘', 'KHN'), ('이정수', 'LJS'), ('박지윤', 'PJY');
```

#### 2. channels (채널별 수수료)
```sql
-- 채널별 수수료율 관리
INSERT INTO channels (name, fee_rate) VALUES
('크몽', 0.2100),      -- 21%
('계좌입금', 0.0000),   -- 0%
('카드결제', 0.0350),   -- 3.5%
('기타플랫폼', 0.1500); -- 15%
```

#### 3. projects (프로젝트 정산)
```sql
-- 프로젝트별 정산 정보
-- designers 필드: JSON 배열로 다중 디자이너 할당
{
  "designers": [
    {"member_id": "uuid", "percent": 60, "bonus_pct": 10},
    {"member_id": "uuid", "percent": 40, "bonus_pct": 5}
  ]
}
```

#### 4. settlement_items (정산 상세)
```sql
-- 실제 정산 계산 결과 저장
-- 원천 전/후 금액 모두 저장
-- settlements가 LOCKED되면 수정 불가 (RLS로 보호)
```

### 비즈니스 규칙 검증

#### 1. 디자이너 지분 합계 100% 검증
```sql
-- 프로젝트 저장 시 자동 검증
ALTER TABLE projects ADD CONSTRAINT valid_designer_percentages
CHECK (validate_designer_percentages(designers));
```

#### 2. 보너스 비율 0-20% 제한
```sql
-- 각 디자이너의 bonus_pct는 0-20% 범위
-- JSON 스키마 검증으로 보장
```

#### 3. 정산 불변성 보장
```sql
-- settlement이 LOCKED 상태일 때 수정/삭제 불가
-- RLS 정책으로 보호
```

### 핵심 함수

#### 1. calculate_settlement_amount()
```sql
-- 정산 계산 함수 (currency.ts와 동일한 로직)
SELECT * FROM calculate_settlement_amount(
  gross_amount_param := 1100000,  -- 총입금
  discount_net_param := 0,        -- 할인액
  designer_percent_param := 60,   -- 디자이너 지분%
  bonus_pct_param := 10          -- 보너스%
);
```

#### 2. validate_designer_percentages()
```sql
-- 디자이너 지분 검증
SELECT validate_designer_percentages('[
  {"member_id": "uuid1", "percent": 60, "bonus_pct": 10},
  {"member_id": "uuid2", "percent": 40, "bonus_pct": 5}
]'::jsonb); -- Returns: true (60 + 40 = 100)
```

### 보안 및 RLS

#### 1. Row Level Security 정책
- 인증된 사용자만 모든 데이터 접근 가능
- settlement이 LOCKED된 경우 수정/삭제 불가
- 시스템 설정(is_system=true)은 삭제 불가

#### 2. 감사 로그 (audit_logs)
- 모든 중요 테이블의 변경사항 자동 기록
- 변경자, 시간, IP, 변경 전/후 데이터 저장

#### 3. 파일 스토리지 정책
- project-files 버킷에 인증된 사용자만 접근
- 파일 크기 10MB 제한, PDF/이미지만 허용

### 성능 최적화

#### 1. 인덱스
```sql
-- 자주 조회되는 컬럼들에 인덱스 생성
CREATE INDEX idx_projects_project_date ON projects(project_date);
CREATE INDEX idx_settlement_items_member_id ON settlement_items(member_id);
CREATE INDEX idx_contacts_event_date ON contacts(event_date);
```

#### 2. 뷰 (Views)
```sql
-- 월별 멤버 요약 뷰
SELECT * FROM monthly_member_summary WHERE month = '2024-09';

-- 프로젝트 수익성 분석 뷰
SELECT * FROM project_profitability ORDER BY project_date DESC;

-- 멤버 통계 뷰
SELECT * FROM member_stats ORDER BY total_earnings DESC;
```

## 🧪 테스트 및 검증

### 1. 데이터 무결성 테스트
```sql
-- 디자이너 지분 합계 검증
DO $$
DECLARE
    project_record RECORD;
    total_percent NUMERIC;
BEGIN
    FOR project_record IN SELECT id, designers FROM projects LOOP
        SELECT SUM((designer->>'percent')::NUMERIC) INTO total_percent
        FROM jsonb_array_elements(project_record.designers) designer;

        IF total_percent != 100 THEN
            RAISE EXCEPTION 'Project % has invalid designer percentages: %',
                project_record.id, total_percent;
        END IF;
    END LOOP;
    RAISE NOTICE 'All projects have valid designer percentages';
END $$;
```

### 2. 정산 계산 정확성 테스트
```sql
-- 정산 계산 로직 검증
WITH test_calculation AS (
    SELECT * FROM calculate_settlement_amount(1100000, 0, 60, 10)
)
SELECT
    CASE
        WHEN net_b = 1000000 THEN 'PASS'
        ELSE 'FAIL'
    END as net_calculation,
    CASE
        WHEN designer_amount = 240000 THEN 'PASS'
        ELSE 'FAIL'
    END as designer_calculation,
    CASE
        WHEN withholding_tax = 7920 THEN 'PASS'
        ELSE 'FAIL'
    END as withholding_calculation
FROM test_calculation;
```

### 3. 성능 테스트
```sql
-- 큰 데이터셋에서의 쿼리 성능 확인
EXPLAIN ANALYZE
SELECT m.name, SUM(si.after_withholding) as total_earnings
FROM members m
JOIN settlement_items si ON m.id = si.member_id
GROUP BY m.id, m.name
ORDER BY total_earnings DESC;
```

## 🔄 백업 및 복구

### 1. 정기 백업
```bash
# Supabase CLI를 통한 백업
supabase db dump --data-only > backup_$(date +%Y%m%d).sql

# 전체 스키마 + 데이터 백업
supabase db dump > full_backup_$(date +%Y%m%d).sql
```

### 2. 복구
```bash
# 백업 파일로부터 복구
supabase db reset
psql -h localhost -p 54322 -U postgres -d postgres < backup_20240922.sql
```

## 📈 모니터링

### 1. 핵심 지표
- 월별 총 정산액
- 멤버별 수익 분포
- 채널별 수수료 현황
- 미지급 정산액

### 2. 알림 설정
```sql
-- 큰 정산액 알림 (1000만원 이상)
CREATE OR REPLACE FUNCTION notify_large_settlement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.after_withholding > 10000000 THEN
        PERFORM pg_notify('large_settlement',
            json_build_object(
                'member_id', NEW.member_id,
                'amount', NEW.after_withholding,
                'settlement_id', NEW.settlement_id
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_large_settlement
    AFTER INSERT OR UPDATE ON settlement_items
    FOR EACH ROW EXECUTE FUNCTION notify_large_settlement();
```

## 🔧 문제 해결

### 일반적인 오류들

#### 1. 디자이너 지분 오류
```sql
-- 오류: 디자이너 지분 합계가 100%가 아님
-- 해결: designers JSON 배열의 percent 합계 확인
SELECT
    id,
    (SELECT SUM((d->>'percent')::NUMERIC)
     FROM jsonb_array_elements(designers) d) as total_percent
FROM projects
WHERE NOT validate_designer_percentages(designers);
```

#### 2. 정산 계산 불일치
```sql
-- 수동 계산과 함수 결과 비교
SELECT
    gross_amount,
    ROUND(gross_amount / 1.1) as manual_net,
    (SELECT net_b FROM calculate_settlement_amount(gross_amount, 0, 100, 0)) as function_net
FROM projects
WHERE id = 'your_project_id';
```

#### 3. RLS 권한 오류
```sql
-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 📞 지원

### 개발팀 연락처
- 시스템 오류: 즉시 보고
- 기능 요청: 주간 회의에서 논의
- 데이터 이슈: 24시간 내 대응

### 추가 리소스
- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [MZS Settlement System GitHub](https://github.com/MZstudioDesign/mz_sheet)

---

**배포 완료 후 다음 단계**: Frontend 개발 및 실제 데이터 이관