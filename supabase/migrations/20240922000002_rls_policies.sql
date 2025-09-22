-- MZS Settlement System - Row Level Security Policies
-- Generated: 2024-09-22
-- Description: RLS policies for secure data access in the settlement system

-- Enable RLS on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create authentication functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    -- Since this is a single-studio system, we'll use simplified authentication
    -- Check if user is authenticated via Supabase Auth
    IF auth.uid() IS NOT NULL THEN
        RETURN 'admin';
    ELSE
        RETURN 'anonymous';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for members table
CREATE POLICY "Enable read access for authenticated users" ON public.members
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.members
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.members
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.members
    FOR DELETE USING (is_authenticated());

-- RLS Policies for channels table
CREATE POLICY "Enable read access for authenticated users" ON public.channels
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.channels
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.channels
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.channels
    FOR DELETE USING (is_authenticated());

-- RLS Policies for categories table
CREATE POLICY "Enable read access for authenticated users" ON public.categories
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.categories
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.categories
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.categories
    FOR DELETE USING (is_authenticated());

-- RLS Policies for projects table
CREATE POLICY "Enable read access for authenticated users" ON public.projects
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.projects
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.projects
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.projects
    FOR DELETE USING (is_authenticated());

-- RLS Policies for project_files table
CREATE POLICY "Enable read access for authenticated users" ON public.project_files
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.project_files
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.project_files
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.project_files
    FOR DELETE USING (is_authenticated());

-- RLS Policies for contacts table
CREATE POLICY "Enable read access for authenticated users" ON public.contacts
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.contacts
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.contacts
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.contacts
    FOR DELETE USING (is_authenticated());

-- RLS Policies for feed_logs table
CREATE POLICY "Enable read access for authenticated users" ON public.feed_logs
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.feed_logs
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.feed_logs
    FOR UPDATE USING (is_authenticated());

CREATE POLICY "Enable delete for authenticated users" ON public.feed_logs
    FOR DELETE USING (is_authenticated());

-- RLS Policies for settlements table
CREATE POLICY "Enable read access for authenticated users" ON public.settlements
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.settlements
    FOR INSERT WITH CHECK (is_authenticated());

-- Settlements can only be updated if not locked
CREATE POLICY "Enable update for unlocked settlements" ON public.settlements
    FOR UPDATE USING (is_authenticated() AND status = 'DRAFT');

-- Settlements cannot be deleted once locked
CREATE POLICY "Enable delete for unlocked settlements" ON public.settlements
    FOR DELETE USING (is_authenticated() AND status = 'DRAFT');

-- RLS Policies for settlement_items table
CREATE POLICY "Enable read access for authenticated users" ON public.settlement_items
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.settlement_items
    FOR INSERT WITH CHECK (is_authenticated());

-- Settlement items can only be updated if parent settlement is not locked
CREATE POLICY "Enable update for unlocked settlement items" ON public.settlement_items
    FOR UPDATE USING (
        is_authenticated() AND
        EXISTS (
            SELECT 1 FROM public.settlements s
            WHERE s.id = settlement_id AND s.status = 'DRAFT'
        )
    );

-- Settlement items can only be deleted if parent settlement is not locked
CREATE POLICY "Enable delete for unlocked settlement items" ON public.settlement_items
    FOR DELETE USING (
        is_authenticated() AND
        EXISTS (
            SELECT 1 FROM public.settlements s
            WHERE s.id = settlement_id AND s.status = 'DRAFT'
        )
    );

-- RLS Policies for app_settings table
CREATE POLICY "Enable read access for authenticated users" ON public.app_settings
    FOR SELECT USING (is_authenticated());

CREATE POLICY "Enable insert for authenticated users" ON public.app_settings
    FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Enable update for authenticated users" ON public.app_settings
    FOR UPDATE USING (is_authenticated());

-- System settings cannot be deleted
CREATE POLICY "Enable delete for non-system settings" ON public.app_settings
    FOR DELETE USING (is_authenticated() AND NOT is_system);

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.audit_logs
    FOR SELECT USING (is_authenticated());

-- Only system can insert audit logs
CREATE POLICY "Enable insert for system only" ON public.audit_logs
    FOR INSERT WITH CHECK (false); -- Will be inserted via triggers

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
BEGIN
    -- Get old and new data as JSON
    IF TG_OP = 'DELETE' THEN
        old_data = row_to_json(OLD)::JSONB;
        new_data = NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = row_to_json(OLD)::JSONB;
        new_data = row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = row_to_json(NEW)::JSONB;
    END IF;

    -- Insert audit record
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_by,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE((new_data->>'id')::UUID, (old_data->>'id')::UUID),
        TG_OP,
        old_data,
        new_data,
        auth.uid(),
        inet_client_addr()
    );

    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_members AFTER INSERT OR UPDATE OR DELETE ON public.members
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_settlements AFTER INSERT OR UPDATE OR DELETE ON public.settlements
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_settlement_items AFTER INSERT OR UPDATE OR DELETE ON public.settlement_items
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_app_settings AFTER INSERT OR UPDATE OR DELETE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs(changed_by);

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-files',
    'project-files',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for project files
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-files'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view project files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'project-files'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update project files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'project-files'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete project files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'project-files'
    AND auth.uid() IS NOT NULL
);

-- Comments
COMMENT ON TABLE public.audit_logs IS 'Audit trail for tracking all data changes';
COMMENT ON FUNCTION public.get_current_user_role IS 'Returns current user role (admin/anonymous)';
COMMENT ON FUNCTION public.is_authenticated IS 'Checks if user is authenticated via Supabase Auth';
COMMENT ON FUNCTION public.audit_trigger IS 'Trigger function for automatic audit logging';