-- RLS Policies for MZS Settlement System
-- This script sets up Row Level Security policies for all tables
-- to resolve PGRST205 errors with anon key access

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.members;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.channels;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.categories;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.projects;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.contacts;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.feed_logs;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.team_tasks;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.mileage;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.funds_company;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.funds_personal;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.settlements;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.settlement_items;
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.app_settings;

-- Create policies that allow all operations for anon users (for development)
-- In production, these should be restricted based on authentication

-- Members table
CREATE POLICY "Allow all operations for anon" ON public.members
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Channels table
CREATE POLICY "Allow all operations for anon" ON public.channels
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Categories table
CREATE POLICY "Allow all operations for anon" ON public.categories
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Projects table
CREATE POLICY "Allow all operations for anon" ON public.projects
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Contacts table
CREATE POLICY "Allow all operations for anon" ON public.contacts
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Feed logs table
CREATE POLICY "Allow all operations for anon" ON public.feed_logs
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Team tasks table
CREATE POLICY "Allow all operations for anon" ON public.team_tasks
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Mileage table
CREATE POLICY "Allow all operations for anon" ON public.mileage
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Company funds table
CREATE POLICY "Allow all operations for anon" ON public.funds_company
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Personal funds table
CREATE POLICY "Allow all operations for anon" ON public.funds_personal
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Settlements table
CREATE POLICY "Allow all operations for anon" ON public.settlements
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Settlement items table
CREATE POLICY "Allow all operations for anon" ON public.settlement_items
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- App settings table
CREATE POLICY "Allow all operations for anon" ON public.app_settings
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;