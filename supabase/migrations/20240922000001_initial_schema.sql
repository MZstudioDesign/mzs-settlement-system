-- MZS Settlement System - Initial Schema Migration
-- Generated: 2024-09-22
-- Description: Creates all necessary tables, enums, and constraints for the settlement system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE project_status AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED');
CREATE TYPE contact_type AS ENUM ('INCOMING', 'CHAT', 'GUIDE');
CREATE TYPE feed_type AS ENUM ('BELOW3', 'GTE3');
CREATE TYPE settlement_status AS ENUM ('DRAFT', 'LOCKED');
CREATE TYPE settlement_source_type AS ENUM ('PROJECT', 'CONTACT', 'FEED', 'TEAM_TASK', 'MILEAGE');

-- Create members table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    email VARCHAR(255),
    phone VARCHAR(20),
    join_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    fee_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000, -- Channel fee rate (e.g., 0.21 for 21%)
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    gross_amount BIGINT NOT NULL CHECK (gross_amount >= 0), -- Total deposit including VAT (T)
    discount_net BIGINT NOT NULL DEFAULT 0 CHECK (discount_net >= 0), -- Discount amount (net)
    designers JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{member_id: UUID, percent: number, bonus_pct: number}]
    status project_status NOT NULL DEFAULT 'PENDING',
    project_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_gross_amount CHECK (gross_amount > 0),
    CONSTRAINT valid_designers_format CHECK (
        jsonb_typeof(designers) = 'array' AND
        jsonb_array_length(designers) >= 0
    )
);

-- Create project_files table
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    contact_type contact_type NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feed_logs table
CREATE TABLE IF NOT EXISTS public.feed_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    feed_type feed_type NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settlements table
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month DATE NOT NULL, -- YYYY-MM-01 format
    status settlement_status NOT NULL DEFAULT 'DRAFT',
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one settlement per month
    CONSTRAINT unique_month UNIQUE (month),
    -- Ensure month is first day of month
    CONSTRAINT valid_month_format CHECK (EXTRACT(DAY FROM month) = 1)
);

-- Create settlement_items table
CREATE TABLE IF NOT EXISTS public.settlement_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    source_type settlement_source_type NOT NULL,
    source_id UUID NOT NULL, -- References projects.id, contacts.id, feed_logs.id, etc.

    -- Settlement calculation fields (all in KRW, integer)
    gross_amount BIGINT NOT NULL DEFAULT 0 CHECK (gross_amount >= 0), -- T (with VAT)
    net_amount BIGINT NOT NULL DEFAULT 0 CHECK (net_amount >= 0), -- B (without VAT)
    base_amount BIGINT NOT NULL DEFAULT 0 CHECK (base_amount >= 0), -- B + discount_net
    designer_amount BIGINT NOT NULL DEFAULT 0 CHECK (designer_amount >= 0), -- base * 0.40 * percent
    bonus_amount BIGINT NOT NULL DEFAULT 0 CHECK (bonus_amount >= 0), -- designer_amount * bonus_pct
    before_withholding BIGINT NOT NULL DEFAULT 0 CHECK (before_withholding >= 0), -- designer + bonus
    withholding_tax BIGINT NOT NULL DEFAULT 0 CHECK (withholding_tax >= 0), -- 3.3%
    after_withholding BIGINT NOT NULL DEFAULT 0 CHECK (after_withholding >= 0), -- final amount

    -- Payment tracking
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false, -- System settings cannot be deleted
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_code ON public.members(code);
CREATE INDEX IF NOT EXISTS idx_members_active ON public.members(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_channels_active ON public.channels(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_projects_channel_id ON public.projects(channel_id);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON public.projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_project_date ON public.projects(project_date);
CREATE INDEX IF NOT EXISTS idx_projects_payment_date ON public.projects(payment_date);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);

CREATE INDEX IF NOT EXISTS idx_contacts_member_id ON public.contacts(member_id);
CREATE INDEX IF NOT EXISTS idx_contacts_project_id ON public.contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_contacts_event_date ON public.contacts(event_date);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON public.contacts(contact_type);

CREATE INDEX IF NOT EXISTS idx_feed_logs_member_id ON public.feed_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_feed_logs_event_date ON public.feed_logs(event_date);
CREATE INDEX IF NOT EXISTS idx_feed_logs_type ON public.feed_logs(feed_type);

CREATE INDEX IF NOT EXISTS idx_settlements_month ON public.settlements(month);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(status);

CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement_id ON public.settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_member_id ON public.settlement_items(member_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_source ON public.settlement_items(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_paid ON public.settlement_items(is_paid);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_logs_updated_at BEFORE UPDATE ON public.feed_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON public.settlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_items_updated_at BEFORE UPDATE ON public.settlement_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create validation functions
CREATE OR REPLACE FUNCTION validate_designer_percentages(designers_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    total_percent NUMERIC := 0;
    designer JSONB;
BEGIN
    -- If empty array, return true
    IF jsonb_array_length(designers_json) = 0 THEN
        RETURN true;
    END IF;

    -- Sum all percentages
    FOR designer IN SELECT * FROM jsonb_array_elements(designers_json)
    LOOP
        total_percent := total_percent + (designer->>'percent')::NUMERIC;
    END LOOP;

    -- Must sum to exactly 100
    RETURN total_percent = 100;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_bonus_percentage(bonus_pct NUMERIC)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN bonus_pct >= 0 AND bonus_pct <= 20;
END;
$$ LANGUAGE plpgsql;

-- Add validation constraints
ALTER TABLE public.projects ADD CONSTRAINT valid_designer_percentages
    CHECK (validate_designer_percentages(designers));

-- Create views for reporting
CREATE OR REPLACE VIEW public.monthly_member_summary AS
SELECT
    m.id as member_id,
    m.name as member_name,
    m.code as member_code,
    DATE_TRUNC('month', COALESCE(si.created_at, CURRENT_DATE))::DATE as month,
    COUNT(DISTINCT CASE WHEN si.source_type = 'PROJECT' THEN si.source_id END) as project_count,
    COUNT(DISTINCT CASE WHEN si.source_type = 'CONTACT' THEN si.source_id END) as contact_count,
    COUNT(DISTINCT CASE WHEN si.source_type = 'FEED' THEN si.source_id END) as feed_count,
    COALESCE(SUM(si.before_withholding), 0) as total_before_withholding,
    COALESCE(SUM(si.withholding_tax), 0) as total_withholding_tax,
    COALESCE(SUM(si.after_withholding), 0) as total_after_withholding,
    COALESCE(SUM(CASE WHEN si.is_paid THEN si.after_withholding ELSE 0 END), 0) as total_paid,
    COALESCE(SUM(CASE WHEN NOT si.is_paid THEN si.after_withholding ELSE 0 END), 0) as total_unpaid
FROM public.members m
LEFT JOIN public.settlement_items si ON m.id = si.member_id
WHERE m.active = true
GROUP BY m.id, m.name, m.code, DATE_TRUNC('month', COALESCE(si.created_at, CURRENT_DATE))
ORDER BY month DESC, m.name;

-- Create project profitability view
CREATE OR REPLACE VIEW public.project_profitability AS
SELECT
    p.id,
    p.name,
    p.gross_amount,
    ROUND(p.gross_amount / 1.1) as net_amount,
    c.name as channel_name,
    c.fee_rate as channel_fee_rate,
    cat.name as category_name,
    ROUND(p.gross_amount / 1.1 * 0.10) as ad_fee, -- 10% ad fee
    ROUND(p.gross_amount / 1.1 * 0.03) as program_fee, -- 3% program fee
    ROUND(p.gross_amount / 1.1 * c.fee_rate) as channel_fee,
    ROUND(p.gross_amount / 1.1 * (0.10 + 0.03 + c.fee_rate)) as total_fees,
    ROUND(p.gross_amount / 1.1 * (1 - 0.10 - 0.03 - c.fee_rate)) as company_profit_before_designers,
    ROUND((p.gross_amount / 1.1 + p.discount_net) * 0.40) as total_designer_allocation,
    p.project_date,
    p.status
FROM public.projects p
JOIN public.channels c ON p.channel_id = c.id
LEFT JOIN public.categories cat ON p.category_id = cat.id
ORDER BY p.project_date DESC;

-- Create settlement calculation function
CREATE OR REPLACE FUNCTION calculate_settlement_amount(
    gross_amount_param BIGINT,
    discount_net_param BIGINT DEFAULT 0,
    designer_percent_param NUMERIC DEFAULT 100,
    bonus_pct_param NUMERIC DEFAULT 0
) RETURNS TABLE (
    gross_t BIGINT,
    net_b BIGINT,
    discount_net BIGINT,
    base_amount BIGINT,
    designer_amount BIGINT,
    bonus_amount BIGINT,
    before_withholding BIGINT,
    withholding_tax BIGINT,
    after_withholding BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT
        gross_amount_param as gross_t,
        ROUND(gross_amount_param / 1.1)::BIGINT as net_b,
        discount_net_param as discount_net,
        (ROUND(gross_amount_param / 1.1) + discount_net_param)::BIGINT as base_amount,
        ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100))::BIGINT as designer_amount,
        ROUND(ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) * (bonus_pct_param / 100))::BIGINT as bonus_amount,
        (ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) +
         ROUND(ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) * (bonus_pct_param / 100)))::BIGINT as before_withholding,
        ROUND((ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) +
               ROUND(ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) * (bonus_pct_param / 100))) * 0.033)::BIGINT as withholding_tax,
        ((ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) +
          ROUND(ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) * (bonus_pct_param / 100))) -
         ROUND((ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) +
                ROUND(ROUND((ROUND(gross_amount_param / 1.1) + discount_net_param) * 0.40 * (designer_percent_param / 100)) * (bonus_pct_param / 100))) * 0.033))::BIGINT as after_withholding;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.members IS 'MZS Studio team members (designers)';
COMMENT ON TABLE public.channels IS 'Sales channels with different fee rates';
COMMENT ON TABLE public.categories IS 'Project categories for classification';
COMMENT ON TABLE public.projects IS 'Main projects table with designer allocation and settlement calculation';
COMMENT ON TABLE public.project_files IS 'File attachments for projects (max 5 per project)';
COMMENT ON TABLE public.contacts IS 'Contact events (INCOMING, CHAT, GUIDE) with fixed amounts';
COMMENT ON TABLE public.feed_logs IS 'Feed activity logs (BELOW3, GTE3) with fixed amounts';
COMMENT ON TABLE public.settlements IS 'Monthly settlement snapshots (immutable when locked)';
COMMENT ON TABLE public.settlement_items IS 'Individual settlement calculations for each member/source';
COMMENT ON TABLE public.app_settings IS 'Application configuration settings';

COMMENT ON COLUMN public.projects.gross_amount IS 'Total deposit including VAT (T in formula)';
COMMENT ON COLUMN public.projects.discount_net IS 'Discount amount excluding VAT';
COMMENT ON COLUMN public.projects.designers IS 'JSON array: [{member_id: UUID, percent: number, bonus_pct: number}]';

COMMENT ON FUNCTION calculate_settlement_amount IS 'Calculates complete settlement amounts using MZS formula';
COMMENT ON VIEW public.monthly_member_summary IS 'Monthly aggregated summary per member';
COMMENT ON VIEW public.project_profitability IS 'Project profitability analysis with fees breakdown';