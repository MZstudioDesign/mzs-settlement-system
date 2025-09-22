-- MZS Settlement System - Seed Data
-- Generated: 2024-09-22
-- Description: Initial seed data for members, channels, categories, and app settings

-- Insert members (6 designers)
INSERT INTO public.members (id, name, code, active, email, join_date) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '오유택', 'OUT', true, 'ohyutaek@mzstudio.co.kr', '2020-01-01'),
    ('550e8400-e29b-41d4-a716-446655440002', '이예천', 'LYC', true, 'leeyecheon@mzstudio.co.kr', '2021-03-15'),
    ('550e8400-e29b-41d4-a716-446655440003', '김연지', 'KYJ', true, 'kimyeonji@mzstudio.co.kr', '2021-06-01'),
    ('550e8400-e29b-41d4-a716-446655440004', '김하늘', 'KHN', true, 'kimhaneul@mzstudio.co.kr', '2022-01-15'),
    ('550e8400-e29b-41d4-a716-446655440005', '이정수', 'LJS', true, 'leejeongsu@mzstudio.co.kr', '2022-09-01'),
    ('550e8400-e29b-41d4-a716-446655440006', '박지윤', 'PJY', true, 'parkjiyoon@mzstudio.co.kr', '2023-02-01')
ON CONFLICT (id) DO NOTHING;

-- Insert channels with proper fee rates
INSERT INTO public.channels (id, name, fee_rate, active, description) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '크몽', 0.2100, true, '크몽 플랫폼 - 21% 수수료'),
    ('660e8400-e29b-41d4-a716-446655440002', '계좌입금', 0.0000, true, '직접 계좌 입금 - 수수료 없음'),
    ('660e8400-e29b-41d4-a716-446655440003', '카드결제', 0.0350, true, '카드 결제 - 3.5% 수수료'),
    ('660e8400-e29b-41d4-a716-446655440004', '기타플랫폼', 0.1500, true, '기타 플랫폼 - 15% 평균 수수료')
ON CONFLICT (id) DO NOTHING;

-- Insert categories
INSERT INTO public.categories (id, name, description, active) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'PPT 디자인', 'PowerPoint 프레젠테이션 디자인', true),
    ('770e8400-e29b-41d4-a716-446655440002', '브랜드 디자인', '로고, CI/BI, 브랜딩 작업', true),
    ('770e8400-e29b-41d4-a716-446655440003', '편집 디자인', '포스터, 브로슈어, 카탈로그 등', true),
    ('770e8400-e29b-41d4-a716-446655440004', '웹 디자인', '웹사이트, 앱 UI/UX 디자인', true),
    ('770e8400-e29b-41d4-a716-446655440005', '패키지 디자인', '제품 패키지, 라벨 디자인', true),
    ('770e8400-e29b-41d4-a716-446655440006', '영상 편집', '동영상 편집, 모션 그래픽', true),
    ('770e8400-e29b-41d4-a716-446655440007', '기타', '기타 디자인 작업', true)
ON CONFLICT (id) DO NOTHING;

-- Insert app settings
INSERT INTO public.app_settings (id, key, value, description, is_system) VALUES
    -- Calculation settings
    ('880e8400-e29b-41d4-a716-446655440001', 'vat_rate', '{"rate": 0.10, "description": "부가세율 10%"}', '부가세율 설정', true),
    ('880e8400-e29b-41d4-a716-446655440002', 'designer_distribution_rate', '{"rate": 0.40, "description": "디자이너 분배율 40%"}', '디자이너 분배율', true),
    ('880e8400-e29b-41d4-a716-446655440003', 'withholding_tax_rate', '{"rate": 0.033, "description": "원천징수세율 3.3%"}', '원천징수세율', true),
    ('880e8400-e29b-41d4-a716-446655440004', 'ad_fee_rate', '{"rate": 0.10, "description": "광고비 10%"}', '광고비율', false),
    ('880e8400-e29b-41d4-a716-446655440005', 'program_fee_rate', '{"rate": 0.03, "description": "프로그램비 3%"}', '프로그램 수수료율', false),

    -- Contact amount settings
    ('880e8400-e29b-41d4-a716-446655440006', 'contact_amounts', '{"INCOMING": 1000, "CHAT": 1000, "GUIDE": 2000}', '컨택 활동별 금액', false),
    ('880e8400-e29b-41d4-a716-446655440007', 'feed_amounts', '{"BELOW3": 400, "GTE3": 1000}', '피드 활동별 금액', false),

    -- Bonus settings
    ('880e8400-e29b-41d4-a716-446655440008', 'bonus_range', '{"min": 0, "max": 20, "description": "보너스 비율 범위 0-20%"}', '보너스 비율 범위', true),

    -- Business rules
    ('880e8400-e29b-41d4-a716-446655440009', 'designer_percentage_validation', '{"enabled": true, "sum_must_equal": 100, "description": "디자이너 지분 합계 100% 검증"}', '디자이너 지분 검증 규칙', true),

    -- File upload settings
    ('880e8400-e29b-41d4-a716-446655440010', 'file_upload_limits', '{"max_files_per_project": 5, "max_file_size_mb": 10, "allowed_types": ["image/jpeg", "image/png", "application/pdf"]}', '파일 업로드 제한', false),

    -- Currency and formatting
    ('880e8400-e29b-41d4-a716-446655440011', 'currency_settings', '{"currency": "KRW", "locale": "ko-KR", "decimal_places": 0}', '통화 및 형식 설정', false),

    -- Company information
    ('880e8400-e29b-41d4-a716-446655440012', 'company_info', '{"name": "MZS Studio", "business_number": "", "address": "", "phone": "", "email": ""}', '회사 정보', false),

    -- Settlement settings
    ('880e8400-e29b-41d4-a716-446655440013', 'settlement_settings', '{"auto_create_monthly": true, "lock_after_payment": true, "require_approval": false}', '정산 설정', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects for testing (optional)
INSERT INTO public.projects (id, name, channel_id, category_id, gross_amount, discount_net, designers, status, project_date) VALUES
    (
        '990e8400-e29b-41d4-a716-446655440001',
        '샘플 PPT 디자인 프로젝트',
        '660e8400-e29b-41d4-a716-446655440001', -- 크몽
        '770e8400-e29b-41d4-a716-446655440001', -- PPT 디자인
        1100000, -- 110만원 (부가세 포함)
        0,
        '[
            {"member_id": "550e8400-e29b-41d4-a716-446655440001", "percent": 60, "bonus_pct": 10},
            {"member_id": "550e8400-e29b-41d4-a716-446655440002", "percent": 40, "bonus_pct": 5}
        ]'::jsonb,
        'COMPLETED',
        '2024-09-01'
    ),
    (
        '990e8400-e29b-41d4-a716-446655440002',
        '브랜드 로고 디자인',
        '660e8400-e29b-41d4-a716-446655440002', -- 계좌입금
        '770e8400-e29b-41d4-a716-446655440002', -- 브랜드 디자인
        550000, -- 55만원 (부가세 포함)
        50000, -- 5만원 할인
        '[
            {"member_id": "550e8400-e29b-41d4-a716-446655440003", "percent": 100, "bonus_pct": 15}
        ]'::jsonb,
        'COMPLETED',
        '2024-09-15'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert sample contacts for testing
INSERT INTO public.contacts (id, member_id, project_id, contact_type, amount, event_date) VALUES
    ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 'INCOMING', 1000, '2024-09-01'),
    ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 'CHAT', 1000, '2024-09-02'),
    ('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', 'GUIDE', 2000, '2024-09-03'),
    ('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', NULL, 'INCOMING', 1000, '2024-09-15')
ON CONFLICT (id) DO NOTHING;

-- Insert sample feed logs for testing
INSERT INTO public.feed_logs (id, member_id, feed_type, amount, event_date) VALUES
    ('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'GTE3', 1000, '2024-09-01'),
    ('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'BELOW3', 400, '2024-09-05'),
    ('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'GTE3', 1000, '2024-09-10'),
    ('bb0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'BELOW3', 400, '2024-09-12')
ON CONFLICT (id) DO NOTHING;

-- Create a sample settlement for September 2024
INSERT INTO public.settlements (id, month, status, notes) VALUES
    ('cc0e8400-e29b-41d4-a716-446655440001', '2024-09-01', 'DRAFT', '2024년 9월 정산 (테스트용)')
ON CONFLICT (id) DO NOTHING;

-- Insert sample settlement items (calculated using the settlement function)
-- For the first project (오유택 - 60%, 10% bonus)
INSERT INTO public.settlement_items (
    id, settlement_id, member_id, source_type, source_id,
    gross_amount, net_amount, base_amount, designer_amount, bonus_amount,
    before_withholding, withholding_tax, after_withholding, is_paid
)
SELECT
    'dd0e8400-e29b-41d4-a716-446655440001',
    'cc0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'PROJECT',
    '990e8400-e29b-41d4-a716-446655440001',
    calc.gross_t,
    calc.net_b,
    calc.base_amount,
    calc.designer_amount,
    calc.bonus_amount,
    calc.before_withholding,
    calc.withholding_tax,
    calc.after_withholding,
    false
FROM calculate_settlement_amount(1100000, 0, 60, 10) calc
ON CONFLICT (id) DO NOTHING;

-- For the first project (이예천 - 40%, 5% bonus)
INSERT INTO public.settlement_items (
    id, settlement_id, member_id, source_type, source_id,
    gross_amount, net_amount, base_amount, designer_amount, bonus_amount,
    before_withholding, withholding_tax, after_withholding, is_paid
)
SELECT
    'dd0e8400-e29b-41d4-a716-446655440002',
    'cc0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'PROJECT',
    '990e8400-e29b-41d4-a716-446655440001',
    calc.gross_t,
    calc.net_b,
    calc.base_amount,
    calc.designer_amount,
    calc.bonus_amount,
    calc.before_withholding,
    calc.withholding_tax,
    calc.after_withholding,
    false
FROM calculate_settlement_amount(1100000, 0, 40, 5) calc
ON CONFLICT (id) DO NOTHING;

-- For the second project (김연지 - 100%, 15% bonus)
INSERT INTO public.settlement_items (
    id, settlement_id, member_id, source_type, source_id,
    gross_amount, net_amount, base_amount, designer_amount, bonus_amount,
    before_withholding, withholding_tax, after_withholding, is_paid
)
SELECT
    'dd0e8400-e29b-41d4-a716-446655440003',
    'cc0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    'PROJECT',
    '990e8400-e29b-41d4-a716-446655440002',
    calc.gross_t,
    calc.net_b,
    calc.base_amount,
    calc.designer_amount,
    calc.bonus_amount,
    calc.before_withholding,
    calc.withholding_tax,
    calc.after_withholding,
    false
FROM calculate_settlement_amount(550000, 50000, 100, 15) calc
ON CONFLICT (id) DO NOTHING;

-- Add contact-based settlement items
INSERT INTO public.settlement_items (
    id, settlement_id, member_id, source_type, source_id,
    gross_amount, net_amount, base_amount, designer_amount, bonus_amount,
    before_withholding, withholding_tax, after_withholding, is_paid
) VALUES
    ('dd0e8400-e29b-41d4-a716-446655440004', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'CONTACT', 'aa0e8400-e29b-41d4-a716-446655440001', 1000, 1000, 1000, 1000, 0, 1000, 33, 967, false),
    ('dd0e8400-e29b-41d4-a716-446655440005', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'CONTACT', 'aa0e8400-e29b-41d4-a716-446655440002', 1000, 1000, 1000, 1000, 0, 1000, 33, 967, false),
    ('dd0e8400-e29b-41d4-a716-446655440006', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'CONTACT', 'aa0e8400-e29b-41d4-a716-446655440003', 2000, 2000, 2000, 2000, 0, 2000, 66, 1934, false),
    ('dd0e8400-e29b-41d4-a716-446655440007', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'CONTACT', 'aa0e8400-e29b-41d4-a716-446655440004', 1000, 1000, 1000, 1000, 0, 1000, 33, 967, false)
ON CONFLICT (id) DO NOTHING;

-- Add feed-based settlement items
INSERT INTO public.settlement_items (
    id, settlement_id, member_id, source_type, source_id,
    gross_amount, net_amount, base_amount, designer_amount, bonus_amount,
    before_withholding, withholding_tax, after_withholding, is_paid
) VALUES
    ('dd0e8400-e29b-41d4-a716-446655440008', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'FEED', 'bb0e8400-e29b-41d4-a716-446655440001', 1000, 1000, 1000, 1000, 0, 1000, 33, 967, false),
    ('dd0e8400-e29b-41d4-a716-446655440009', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'FEED', 'bb0e8400-e29b-41d4-a716-446655440002', 400, 400, 400, 400, 0, 400, 13, 387, false),
    ('dd0e8400-e29b-41d4-a716-446655440010', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'FEED', 'bb0e8400-e29b-41d4-a716-446655440003', 1000, 1000, 1000, 1000, 0, 1000, 33, 967, false),
    ('dd0e8400-e29b-41d4-a716-446655440011', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'FEED', 'bb0e8400-e29b-41d4-a716-446655440004', 400, 400, 400, 400, 0, 400, 13, 387, false)
ON CONFLICT (id) DO NOTHING;

-- Create helper function to get member ID by code
CREATE OR REPLACE FUNCTION public.get_member_id_by_code(member_code TEXT)
RETURNS UUID AS $$
DECLARE
    member_id UUID;
BEGIN
    SELECT id INTO member_id FROM public.members WHERE code = member_code;
    RETURN member_id;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get channel ID by name
CREATE OR REPLACE FUNCTION public.get_channel_id_by_name(channel_name TEXT)
RETURNS UUID AS $$
DECLARE
    channel_id UUID;
BEGIN
    SELECT id INTO channel_id FROM public.channels WHERE name = channel_name;
    RETURN channel_id;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get category ID by name
CREATE OR REPLACE FUNCTION public.get_category_id_by_name(category_name TEXT)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
BEGIN
    SELECT id INTO category_id FROM public.categories WHERE name = category_name;
    RETURN category_id;
END;
$$ LANGUAGE plpgsql;

-- Update statistics for better query planning
ANALYZE public.members;
ANALYZE public.channels;
ANALYZE public.categories;
ANALYZE public.projects;
ANALYZE public.contacts;
ANALYZE public.feed_logs;
ANALYZE public.settlements;
ANALYZE public.settlement_items;
ANALYZE public.app_settings;

-- Create helpful views for frontend
CREATE OR REPLACE VIEW public.member_stats AS
SELECT
    m.id,
    m.name,
    m.code,
    COUNT(DISTINCT p.id) FILTER (WHERE p.designers::text LIKE '%' || m.id || '%') as project_count,
    COUNT(DISTINCT c.id) as contact_count,
    COUNT(DISTINCT f.id) as feed_count,
    COALESCE(SUM(si.after_withholding), 0) as total_earnings,
    COALESCE(SUM(si.after_withholding) FILTER (WHERE si.is_paid), 0) as paid_earnings,
    COALESCE(SUM(si.after_withholding) FILTER (WHERE NOT si.is_paid), 0) as unpaid_earnings
FROM public.members m
LEFT JOIN public.projects p ON p.designers::text LIKE '%' || m.id || '%'
LEFT JOIN public.contacts c ON c.member_id = m.id
LEFT JOIN public.feed_logs f ON f.member_id = m.id
LEFT JOIN public.settlement_items si ON si.member_id = m.id
WHERE m.active = true
GROUP BY m.id, m.name, m.code
ORDER BY total_earnings DESC;

-- Comments
COMMENT ON TABLE public.audit_logs IS 'Seed data includes 6 MZS Studio designers, channels with proper fee rates, and sample projects';
COMMENT ON FUNCTION public.get_member_id_by_code IS 'Helper function to get member ID by code for easy data input';
COMMENT ON FUNCTION public.get_channel_id_by_name IS 'Helper function to get channel ID by name for easy data input';
COMMENT ON FUNCTION public.get_category_id_by_name IS 'Helper function to get category ID by name for easy data input';
COMMENT ON VIEW public.member_stats IS 'Aggregated statistics per member for dashboard display';