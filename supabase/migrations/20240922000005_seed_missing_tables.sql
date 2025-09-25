-- MZS Settlement System - Seed Data for Missing Tables
-- Generated: 2024-09-22
-- Description: Seed data for team tasks, mileage, and funds tables

-- Insert sample team tasks
INSERT INTO public.team_tasks (id, member_id, project_id, task_date, description, amount, notes) VALUES
    ('ee0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '2024-09-01', '프로젝트 기획 회의 참석', 50000, '2시간 회의 참석'),
    ('ee0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', '2024-09-02', '클라이언트 미팅 참석', 30000, '1시간 클라이언트 미팅'),
    ('ee0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', NULL, '2024-09-05', '사무실 정리 및 청소', 20000, '사무실 환경 개선'),
    ('ee0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440002', '2024-09-10', '디자인 검토 및 피드백', 25000, '디자인 품질 개선')
ON CONFLICT (id) DO NOTHING;

-- Insert sample mileage data
INSERT INTO public.mileage (id, member_id, event_date, reason, points, amount, consumed_now, notes) VALUES
    ('ff0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-09-01', '프로젝트 완료 보너스', 100, 10000, false, '프로젝트 성공적 완료'),
    ('ff0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024-09-05', '피드백 우수상', 50, 5000, true, '즉시 현금화 요청'),
    ('ff0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '2024-09-10', '월간 출석률 우수', 80, 8000, false, '9월 출석률 100%'),
    ('ff0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '2024-09-15', '신규 클라이언트 유치', 150, 15000, false, '신규 클라이언트 3명 유치'),
    ('ff0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '2024-09-20', '교육 이수 완료', 30, 3000, true, '디자인 교육 과정 이수')
ON CONFLICT (id) DO NOTHING;

-- Insert sample company funds (monthly fixed costs)
INSERT INTO public.funds_company (id, expense_date, item_name, amount, description, receipt_files) VALUES
    ('bb0e8400-e29b-41d4-a716-446655440001', '2024-09-01', '사무실 임대료', 2000000, '2024년 9월 사무실 임대료', '[]'::jsonb),
    ('bb0e8400-e29b-41d4-a716-446655440002', '2024-09-01', '인터넷 및 통신비', 150000, '9월 인터넷, 전화 요금', '[]'::jsonb),
    ('bb0e8400-e29b-41d4-a716-446655440003', '2024-09-05', '전기세', 300000, '8월 전기 사용료', '[]'::jsonb),
    ('bb0e8400-e29b-41d4-a716-446655440004', '2024-09-10', '사무용품 구입', 250000, '프린터 토너, 용지 등', '[]'::jsonb),
    ('bb0e8400-e29b-41d4-a716-446655440005', '2024-09-15', '소프트웨어 라이선스', 500000, 'Adobe Creative Suite 월 구독료', '[]'::jsonb),
    ('bb0e8400-e29b-41d4-a716-446655440006', '2024-09-20', '법무회계 서비스', 200000, '세무사 수수료 (9월분)', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert sample personal funds (individual allowances/advances)
INSERT INTO public.funds_personal (id, member_id, expense_date, item_name, amount, description, receipt_files) VALUES
    ('cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-09-01', '교통비 지원', 100000, '9월 대중교통비 지원', '[]'::jsonb),
    ('cc0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024-09-03', '식비 보조', 200000, '점심 식비 보조 (9월분)', '[]'::jsonb),
    ('cc0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '2024-09-05', '도서 구입비', 80000, '디자인 전문서적 구입', '[]'::jsonb),
    ('cc0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '2024-09-10', '건강검진비', 150000, '연간 건강검진 지원', '[]'::jsonb),
    ('cc0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '2024-09-12', '선입금', 500000, '급여 선지급', '[]'::jsonb),
    ('cc0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '2024-09-15', '교육비 지원', 300000, '온라인 디자인 강의 수강료', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert team task-based settlement items to the existing September settlement
INSERT INTO public.settlement_items (
    id, settlement_id, member_id, source_type, source_id,
    gross_amount, net_amount, base_amount, designer_amount, bonus_amount,
    before_withholding, withholding_tax, after_withholding, is_paid
) VALUES
    ('dd0e8400-e29b-41d4-a716-446655440012', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'TEAM_TASK', 'ee0e8400-e29b-41d4-a716-446655440001', 50000, 50000, 50000, 50000, 0, 50000, 1650, 48350, false),
    ('dd0e8400-e29b-41d4-a716-446655440013', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'TEAM_TASK', 'ee0e8400-e29b-41d4-a716-446655440002', 30000, 30000, 30000, 30000, 0, 30000, 990, 29010, false),
    ('dd0e8400-e29b-41d4-a716-446655440014', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'TEAM_TASK', 'ee0e8400-e29b-41d4-a716-446655440003', 20000, 20000, 20000, 20000, 0, 20000, 660, 19340, false),
    ('dd0e8400-e29b-41d4-a716-446655440015', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'TEAM_TASK', 'ee0e8400-e29b-41d4-a716-446655440004', 25000, 25000, 25000, 25000, 0, 25000, 825, 24175, false)
ON CONFLICT (id) DO NOTHING;

-- Insert mileage-based settlement items to the existing September settlement
INSERT INTO public.settlement_items (
    id, settlement_id, member_id, source_type, source_id,
    gross_amount, net_amount, base_amount, designer_amount, bonus_amount,
    before_withholding, withholding_tax, after_withholding, is_paid
) VALUES
    ('dd0e8400-e29b-41d4-a716-446655440016', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'MILEAGE', 'ff0e8400-e29b-41d4-a716-446655440001', 10000, 10000, 10000, 10000, 0, 10000, 330, 9670, false),
    ('dd0e8400-e29b-41d4-a716-446655440017', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'MILEAGE', 'ff0e8400-e29b-41d4-a716-446655440002', 5000, 5000, 5000, 5000, 0, 5000, 165, 4835, false),
    ('dd0e8400-e29b-41d4-a716-446655440018', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'MILEAGE', 'ff0e8400-e29b-41d4-a716-446655440003', 8000, 8000, 8000, 8000, 0, 8000, 264, 7736, false),
    ('dd0e8400-e29b-41d4-a716-446655440019', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'MILEAGE', 'ff0e8400-e29b-41d4-a716-446655440004', 15000, 15000, 15000, 15000, 0, 15000, 495, 14505, false),
    ('dd0e8400-e29b-41d4-a716-446655440020', 'cc0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'MILEAGE', 'ff0e8400-e29b-41d4-a716-446655440005', 3000, 3000, 3000, 3000, 0, 3000, 99, 2901, false)
ON CONFLICT (id) DO NOTHING;

-- Update app settings to include mileage and team task rates
INSERT INTO public.app_settings (id, key, value, description, is_system) VALUES
    ('880e8400-e29b-41d4-a716-446655440014', 'mileage_conversion_rate', '{"points_per_krw": 10, "description": "마일리지 포인트 환율 (10포인트 = 100원)"}', '마일리지 포인트 환율 설정', false),
    ('880e8400-e29b-41d4-a716-446655440015', 'team_task_rates', '{"meeting": 25000, "client_visit": 30000, "training": 20000, "office_work": 15000}', '팀 업무별 기본 단가', false)
ON CONFLICT (id) DO NOTHING;

-- Create enhanced views including new tables
CREATE OR REPLACE VIEW public.member_comprehensive_stats AS
SELECT
    m.id,
    m.name,
    m.code,
    -- Project statistics
    COUNT(DISTINCT CASE WHEN p.designers::text LIKE '%' || m.id || '%' THEN p.id END) as project_count,
    COALESCE(SUM(si_project.after_withholding), 0) as project_earnings,

    -- Contact statistics
    COUNT(DISTINCT c.id) as contact_count,
    COALESCE(SUM(si_contact.after_withholding), 0) as contact_earnings,

    -- Feed statistics
    COUNT(DISTINCT f.id) as feed_count,
    COALESCE(SUM(si_feed.after_withholding), 0) as feed_earnings,

    -- Team task statistics
    COUNT(DISTINCT tt.id) as team_task_count,
    COALESCE(SUM(si_team.after_withholding), 0) as team_task_earnings,

    -- Mileage statistics
    COUNT(DISTINCT ml.id) as mileage_count,
    COALESCE(SUM(ml.points), 0) as total_mileage_points,
    COALESCE(SUM(si_mileage.after_withholding), 0) as mileage_earnings,

    -- Personal funds statistics
    COALESCE(SUM(fp.amount), 0) as personal_funds_received,

    -- Total earnings
    COALESCE(SUM(si_all.after_withholding), 0) as total_earnings,
    COALESCE(SUM(si_all.after_withholding) FILTER (WHERE si_all.is_paid), 0) as paid_earnings,
    COALESCE(SUM(si_all.after_withholding) FILTER (WHERE NOT si_all.is_paid), 0) as unpaid_earnings

FROM public.members m
LEFT JOIN public.projects p ON p.designers::text LIKE '%' || m.id || '%'
LEFT JOIN public.contacts c ON c.member_id = m.id
LEFT JOIN public.feed_logs f ON f.member_id = m.id
LEFT JOIN public.team_tasks tt ON tt.member_id = m.id
LEFT JOIN public.mileage ml ON ml.member_id = m.id
LEFT JOIN public.funds_personal fp ON fp.member_id = m.id
LEFT JOIN public.settlement_items si_project ON si_project.member_id = m.id AND si_project.source_type = 'PROJECT'
LEFT JOIN public.settlement_items si_contact ON si_contact.member_id = m.id AND si_contact.source_type = 'CONTACT'
LEFT JOIN public.settlement_items si_feed ON si_feed.member_id = m.id AND si_feed.source_type = 'FEED'
LEFT JOIN public.settlement_items si_team ON si_team.member_id = m.id AND si_team.source_type = 'TEAM_TASK'
LEFT JOIN public.settlement_items si_mileage ON si_mileage.member_id = m.id AND si_mileage.source_type = 'MILEAGE'
LEFT JOIN public.settlement_items si_all ON si_all.member_id = m.id
WHERE m.active = true
GROUP BY m.id, m.name, m.code
ORDER BY total_earnings DESC;

-- Create company financial overview
CREATE OR REPLACE VIEW public.company_financial_overview AS
SELECT
    DATE_TRUNC('month', expense_date)::DATE as month,
    'COMPANY_EXPENSE' as transaction_type,
    item_name,
    amount,
    description,
    expense_date as transaction_date
FROM public.funds_company
UNION ALL
SELECT
    DATE_TRUNC('month', fp.expense_date)::DATE as month,
    'PERSONAL_ALLOWANCE' as transaction_type,
    fp.item_name || ' (' || m.name || ')' as item_name,
    fp.amount,
    fp.description,
    fp.expense_date as transaction_date
FROM public.funds_personal fp
JOIN public.members m ON fp.member_id = m.id
ORDER BY transaction_date DESC;

-- Comments for new views
COMMENT ON VIEW public.member_comprehensive_stats IS 'Complete member statistics including all earning sources';
COMMENT ON VIEW public.company_financial_overview IS 'Company financial overview including expenses and allowances';