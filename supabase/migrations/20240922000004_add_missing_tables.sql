-- MZS Settlement System - Add Missing Tables
-- Generated: 2024-09-22
-- Description: Adds missing tables for team tasks, mileage, and funds management

-- Create team_tasks table
CREATE TABLE IF NOT EXISTS public.team_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mileage table
CREATE TABLE IF NOT EXISTS public.mileage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
    consumed_now BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create funds_company table (company expenses)
CREATE TABLE IF NOT EXISTS public.funds_company (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    item_name VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
    description TEXT,
    receipt_files JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create funds_personal table (personal allowances/advances)
CREATE TABLE IF NOT EXISTS public.funds_personal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    item_name VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
    description TEXT,
    receipt_files JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_tasks_member_id ON public.team_tasks(member_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_project_id ON public.team_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_date ON public.team_tasks(task_date);

CREATE INDEX IF NOT EXISTS idx_mileage_member_id ON public.mileage(member_id);
CREATE INDEX IF NOT EXISTS idx_mileage_date ON public.mileage(event_date);
CREATE INDEX IF NOT EXISTS idx_mileage_consumed ON public.mileage(consumed_now);

CREATE INDEX IF NOT EXISTS idx_funds_company_date ON public.funds_company(expense_date);
CREATE INDEX IF NOT EXISTS idx_funds_personal_member_id ON public.funds_personal(member_id);
CREATE INDEX IF NOT EXISTS idx_funds_personal_date ON public.funds_personal(expense_date);

-- Create triggers for updated_at columns
CREATE TRIGGER update_team_tasks_updated_at BEFORE UPDATE ON public.team_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mileage_updated_at BEFORE UPDATE ON public.mileage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funds_company_updated_at BEFORE UPDATE ON public.funds_company
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funds_personal_updated_at BEFORE UPDATE ON public.funds_personal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds_personal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_tasks table
CREATE POLICY "Enable read access for authenticated users" ON public.team_tasks
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.team_tasks
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.team_tasks
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.team_tasks
    FOR DELETE USING (is_authenticated());

-- RLS Policies for mileage table
CREATE POLICY "Enable read access for authenticated users" ON public.mileage
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.mileage
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.mileage
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.mileage
    FOR DELETE USING (is_authenticated());

-- RLS Policies for funds_company table
CREATE POLICY "Enable read access for authenticated users" ON public.funds_company
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.funds_company
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.funds_company
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.funds_company
    FOR DELETE USING (is_authenticated());

-- RLS Policies for funds_personal table
CREATE POLICY "Enable read access for authenticated users" ON public.funds_personal
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.funds_personal
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.funds_personal
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.funds_personal
    FOR DELETE USING (is_authenticated());

-- Create audit triggers for new tables
CREATE TRIGGER audit_team_tasks AFTER INSERT OR UPDATE OR DELETE ON public.team_tasks
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_mileage AFTER INSERT OR UPDATE OR DELETE ON public.mileage
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_funds_company AFTER INSERT OR UPDATE OR DELETE ON public.funds_company
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_funds_personal AFTER INSERT OR UPDATE OR DELETE ON public.funds_personal
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Add settlement source types for new tables
ALTER TYPE settlement_source_type ADD VALUE IF NOT EXISTS 'TEAM_TASK';
ALTER TYPE settlement_source_type ADD VALUE IF NOT EXISTS 'MILEAGE';

-- Comments for documentation
COMMENT ON TABLE public.team_tasks IS 'Team task activities with monetary compensation';
COMMENT ON TABLE public.mileage IS 'Mileage/loyalty points system for members';
COMMENT ON TABLE public.funds_company IS 'Company expenses and overhead costs';
COMMENT ON TABLE public.funds_personal IS 'Personal allowances and advance payments to members';

COMMENT ON COLUMN public.team_tasks.amount IS 'Compensation amount for team task (in KRW)';
COMMENT ON COLUMN public.mileage.points IS 'Mileage points earned';
COMMENT ON COLUMN public.mileage.amount IS 'Monetary equivalent of mileage points (in KRW)';
COMMENT ON COLUMN public.mileage.consumed_now IS 'Whether mileage was consumed immediately for cash';
COMMENT ON COLUMN public.funds_company.receipt_files IS 'JSON array of receipt file URLs (max 5 files, 10MB each)';
COMMENT ON COLUMN public.funds_personal.receipt_files IS 'JSON array of receipt file URLs (max 5 files, 10MB each)';