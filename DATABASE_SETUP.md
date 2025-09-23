# MZS Settlement System - Database Setup Guide

This guide provides comprehensive instructions for setting up the Supabase database for the MZS Settlement System.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Schema](#database-schema)
4. [Migration Setup](#migration-setup)
5. [Seed Data](#seed-data)
6. [Security Configuration](#security-configuration)
7. [ETL Scripts](#etl-scripts)
8. [Settlement Generation](#settlement-generation)
9. [Troubleshooting](#troubleshooting)

## Overview

The MZS Settlement System uses Supabase (PostgreSQL) as its primary database with the following key features:

- **Comprehensive Schema**: 12 tables covering all business entities
- **Row Level Security (RLS)**: Secure data access with authentication
- **Settlement Calculations**: Built-in functions for complex payment calculations
- **Audit Trail**: Complete audit logging for all data changes
- **File Storage**: Integrated file storage for receipts and documents
- **Immutable Settlements**: Snapshot-based settlements for historical integrity

## Prerequisites

1. Supabase project created
2. Environment variables configured:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

## Database Schema

### Core Tables

#### 1. members
**Purpose**: MZS Studio team members (designers)
```sql
- id: UUID (Primary Key)
- name: VARCHAR(100) - Full name
- code: VARCHAR(20) - Unique identifier (e.g., "OY", "LE")
- active: BOOLEAN - Active status
- email: VARCHAR(255) - Email address
- phone: VARCHAR(20) - Phone number
- join_date: DATE - Join date
- notes: TEXT - Additional notes
```

#### 2. channels
**Purpose**: Sales channels with different fee rates
```sql
- id: UUID (Primary Key)
- name: VARCHAR(100) - Channel name (e.g., "크몽", "계좌입금")
- fee_rate: DECIMAL(5,4) - Channel fee rate (0.21 = 21%)
- active: BOOLEAN - Active status
- description: TEXT - Channel description
```

#### 3. categories
**Purpose**: Project categories for classification
```sql
- id: UUID (Primary Key)
- name: VARCHAR(100) - Category name
- description: TEXT - Category description
- active: BOOLEAN - Active status
```

#### 4. projects
**Purpose**: Main projects with designer allocation and settlement calculation
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255) - Project name
- channel_id: UUID - Foreign key to channels
- category_id: UUID - Foreign key to categories (nullable)
- gross_amount: BIGINT - Total deposit including VAT (T)
- discount_net: BIGINT - Discount amount excluding VAT
- designers: JSONB - Designer allocation array
- status: project_status ENUM - Project status
- project_date: DATE - Project completion date
- payment_date: DATE - Payment received date
- notes: TEXT - Project notes
```

**Designer JSON Format**:
```json
[
  {
    "member_id": "uuid",
    "percent": 60,
    "bonus_pct": 10
  },
  {
    "member_id": "uuid",
    "percent": 40,
    "bonus_pct": 5
  }
]
```

#### 5. contacts
**Purpose**: Contact events (INCOMING, CHAT, GUIDE) with fixed amounts
```sql
- id: UUID (Primary Key)
- member_id: UUID - Foreign key to members
- project_id: UUID - Foreign key to projects (nullable)
- contact_type: contact_type ENUM - Type of contact
- amount: INTEGER - Compensation amount
- event_date: DATE - Event date
- notes: TEXT - Event notes
```

#### 6. feed_logs
**Purpose**: Feed activity logs (BELOW3, GTE3) with fixed amounts
```sql
- id: UUID (Primary Key)
- member_id: UUID - Foreign key to members
- feed_type: feed_type ENUM - Type of feed activity
- amount: INTEGER - Compensation amount
- event_date: DATE - Event date
- notes: TEXT - Activity notes
```

#### 7. team_tasks
**Purpose**: Team task activities with monetary compensation
```sql
- id: UUID (Primary Key)
- member_id: UUID - Foreign key to members
- project_id: UUID - Foreign key to projects (nullable)
- task_date: DATE - Task date
- description: TEXT - Task description
- amount: INTEGER - Compensation amount
- notes: TEXT - Task notes
```

#### 8. mileage
**Purpose**: Mileage/loyalty points system for members
```sql
- id: UUID (Primary Key)
- member_id: UUID - Foreign key to members
- event_date: DATE - Event date
- reason: TEXT - Reason for mileage
- points: INTEGER - Mileage points earned
- amount: INTEGER - Monetary equivalent
- consumed_now: BOOLEAN - Whether consumed immediately
- notes: TEXT - Mileage notes
```

#### 9. funds_company
**Purpose**: Company expenses and overhead costs
```sql
- id: UUID (Primary Key)
- expense_date: DATE - Expense date
- item_name: VARCHAR(255) - Expense item name
- amount: INTEGER - Expense amount
- description: TEXT - Expense description
- receipt_files: JSONB - Array of receipt file URLs
```

#### 10. funds_personal
**Purpose**: Personal allowances and advance payments to members
```sql
- id: UUID (Primary Key)
- member_id: UUID - Foreign key to members
- expense_date: DATE - Expense date
- item_name: VARCHAR(255) - Expense item name
- amount: INTEGER - Expense amount
- description: TEXT - Expense description
- receipt_files: JSONB - Array of receipt file URLs
```

#### 11. settlements
**Purpose**: Monthly settlement snapshots (immutable when locked)
```sql
- id: UUID (Primary Key)
- month: DATE - Settlement month (YYYY-MM-01 format)
- status: settlement_status ENUM - DRAFT or LOCKED
- locked_at: TIMESTAMP - Lock timestamp
- locked_by: VARCHAR(100) - Who locked the settlement
- notes: TEXT - Settlement notes
```

#### 12. settlement_items
**Purpose**: Individual settlement calculations for each member/source
```sql
- id: UUID (Primary Key)
- settlement_id: UUID - Foreign key to settlements
- member_id: UUID - Foreign key to members
- source_type: settlement_source_type ENUM - Source type
- source_id: UUID - Source record ID
- gross_amount: BIGINT - Gross amount (T)
- net_amount: BIGINT - Net amount (B)
- base_amount: BIGINT - Base calculation amount
- designer_amount: BIGINT - Designer portion
- bonus_amount: BIGINT - Bonus amount
- before_withholding: BIGINT - Amount before withholding tax
- withholding_tax: BIGINT - 3.3% withholding tax
- after_withholding: BIGINT - Final amount after tax
- is_paid: BOOLEAN - Payment status
- paid_at: TIMESTAMP - Payment timestamp
- payment_method: VARCHAR(50) - Payment method
- notes: TEXT - Payment notes
```

### Support Tables

#### 13. project_files
**Purpose**: File attachments for projects (max 5 per project)
```sql
- id: UUID (Primary Key)
- project_id: UUID - Foreign key to projects
- file_name: VARCHAR(255) - Original file name
- file_url: TEXT - Supabase storage URL
- file_size: BIGINT - File size in bytes
- file_type: VARCHAR(100) - MIME type
- uploaded_by: VARCHAR(100) - Uploader identifier
```

#### 14. app_settings
**Purpose**: Application configuration settings
```sql
- id: UUID (Primary Key)
- key: VARCHAR(100) - Setting key (unique)
- value: JSONB - Setting value
- description: TEXT - Setting description
- is_system: BOOLEAN - System setting flag
- updated_at: TIMESTAMP - Last update time
- updated_by: VARCHAR(100) - Who updated
```

#### 15. audit_logs
**Purpose**: Audit trail for tracking all data changes
```sql
- id: UUID (Primary Key)
- table_name: VARCHAR(100) - Table that was changed
- record_id: UUID - ID of changed record
- action: VARCHAR(20) - INSERT, UPDATE, DELETE
- old_values: JSONB - Previous values
- new_values: JSONB - New values
- changed_by: UUID - User who made change
- changed_at: TIMESTAMP - Change timestamp
- ip_address: INET - Client IP address
- user_agent: TEXT - Client user agent
```

## Migration Setup

### 1. Run Migrations

The migrations are organized in sequence:

```bash
# 1. Initial schema
supabase migration up 20240922000001_initial_schema.sql

# 2. RLS policies and audit system
supabase migration up 20240922000002_rls_policies.sql

# 3. Seed data (members, channels, categories, settings)
supabase migration up 20240922000003_seed_data.sql

# 4. Additional tables (team_tasks, mileage, funds)
supabase migration up 20240922000004_add_missing_tables.sql

# 5. Seed data for additional tables
supabase migration up 20240922000005_seed_missing_tables.sql
```

### 2. Verify Installation

Check that all tables are created:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Should return:
- app_settings
- audit_logs
- categories
- channels
- contacts
- feed_logs
- funds_company
- funds_personal
- members
- mileage
- project_files
- projects
- settlement_items
- settlements
- team_tasks

## Seed Data

The system comes with pre-configured seed data:

### Members
- 오유택 (OUT)
- 이예천 (LYC)
- 김연지 (KYJ)
- 김하늘 (KHN)
- 이정수 (LJS)
- 박지윤 (PJY)

### Channels
- 크몽 (21% fee)
- 계좌입금 (0% fee)
- 카드결제 (3.5% fee)
- 기타플랫폼 (15% fee)

### Categories
- PPT 디자인
- 브랜드 디자인
- 편집 디자인
- 웹 디자인
- 패키지 디자인
- 영상 편집
- 기타

### App Settings
All calculation rules, fees, and system configurations are stored as JSON in app_settings.

## Security Configuration

### Row Level Security (RLS)

All tables have RLS enabled with authentication-based policies:

```sql
-- Example policy structure
CREATE POLICY "Enable read access for authenticated users"
ON table_name FOR SELECT
USING (is_authenticated());
```

### Storage Bucket

File storage bucket `project-files` is configured with:
- 10MB file size limit
- Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX
- Authenticated user access only

### Audit Trail

All critical operations are automatically audited:
- Who made the change
- When it was made
- What was changed (before/after values)
- Client IP and user agent

## ETL Scripts

### CSV Data Import

Use the ETL script to import data from Excel/CSV files:

```bash
# Import projects
npm run etl -- --type=projects --file=projects.csv

# Import contacts
npm run etl -- --type=contacts --file=contacts.csv

# Import feed logs
npm run etl -- --type=feed --file=feed_logs.csv

# Import team tasks
npm run etl -- --type=team --file=team_tasks.csv

# Import mileage
npm run etl -- --type=mileage --file=mileage.csv

# Import company funds
npm run etl -- --type=funds_company --file=company_funds.csv

# Import personal funds
npm run etl -- --type=funds_personal --file=personal_funds.csv
```

### CSV Format Requirements

#### Projects CSV
```csv
client_name,channel_name,category_name,title,gross_amount,discount_net,project_date,payment_date,designer_assignments,notes,status
"Sample Client","크몽","PPT 디자인","Sample Project","1100000","0","2024-09-01","2024-09-05","OY:60:10,LE:40:5","Project notes","COMPLETED"
```

#### Contacts CSV
```csv
member_code,project_title,contact_type,amount,event_date,notes
"OY","Sample Project","INCOMING","1000","2024-09-01","Contact notes"
```

#### Feed Logs CSV
```csv
member_code,feed_type,amount,event_date,notes
"OY","GTE3","1000","2024-09-01","Feed notes"
```

## Settlement Generation

### Automatic Settlement Creation

Generate monthly settlements automatically:

```bash
# Generate settlement for September 2024
npm run generate-settlement -- --month=2024-09

# Force regenerate existing settlement
npm run generate-settlement -- --month=2024-09 --force
```

### Settlement Calculation Formula

The system uses the MZS settlement formula:

1. **Gross Amount (T)**: Total deposit including VAT
2. **Net Amount (B)**: T ÷ 1.1 (remove VAT)
3. **Discount**: Additional discount amount
4. **Base Amount**: B + Discount
5. **Designer Amount**: Base × 40% × Designer %
6. **Bonus Amount**: Designer Amount × Bonus %
7. **Before Withholding**: Designer Amount + Bonus Amount
8. **Withholding Tax**: Before Withholding × 3.3%
9. **After Withholding**: Before Withholding - Withholding Tax

### Settlement Status

- **DRAFT**: Editable, can be modified
- **LOCKED**: Immutable, cannot be changed

## Database Functions

### calculate_settlement_amount()

Core settlement calculation function:

```sql
SELECT * FROM calculate_settlement_amount(
  gross_amount_param := 1100000,
  discount_net_param := 0,
  designer_percent_param := 60,
  bonus_pct_param := 10
);
```

### Helper Functions

- `get_member_id_by_code(text)`: Get member ID by code
- `get_channel_id_by_name(text)`: Get channel ID by name
- `get_category_id_by_name(text)`: Get category ID by name
- `validate_designer_percentages(jsonb)`: Validate designer percentages sum to 100%
- `validate_bonus_percentage(numeric)`: Validate bonus percentage (0-20%)

## Views

### Reporting Views

- **monthly_member_summary**: Monthly aggregated summary per member
- **project_profitability**: Project profitability analysis with fees breakdown
- **member_stats**: Basic member statistics
- **member_comprehensive_stats**: Complete member statistics including all earning sources
- **company_financial_overview**: Company financial overview including expenses and allowances

### Usage Example

```sql
-- Get comprehensive stats for all members
SELECT * FROM member_comprehensive_stats ORDER BY total_earnings DESC;

-- Get monthly summary for specific month
SELECT * FROM monthly_member_summary
WHERE month = '2024-09-01'
ORDER BY total_after_withholding DESC;
```

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check Supabase connection
   - Verify environment variables
   - Run migrations in order

2. **RLS Policy Errors**
   - Ensure user is authenticated
   - Check policy conditions
   - Verify function permissions

3. **Settlement Calculation Errors**
   - Validate designer percentages sum to 100%
   - Check bonus percentage range (0-20%)
   - Verify required fields are not null

4. **ETL Import Errors**
   - Check CSV format and headers
   - Verify member codes exist
   - Validate date formats (YYYY-MM-DD)

### Performance Optimization

1. **Indexes**: All foreign keys and frequently queried columns have indexes
2. **Views**: Use materialized views for complex reporting queries
3. **Partitioning**: Consider partitioning large tables by date
4. **Connection Pooling**: Use connection pooling for high-traffic applications

### Monitoring

1. **Audit Logs**: Monitor `audit_logs` table for unusual activity
2. **Settlement Status**: Track settlement creation and locking
3. **Performance**: Monitor query performance and resource usage
4. **File Storage**: Monitor storage usage and file access patterns

## Data Backup

### Regular Backups

1. **Automated**: Supabase provides automated daily backups
2. **Manual**: Export critical data using pg_dump
3. **Point-in-time**: Use Supabase's point-in-time recovery features

### Export Commands

```bash
# Export all data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Export specific tables
pg_dump -h db.xxx.supabase.co -U postgres -d postgres -t public.settlements -t public.settlement_items > settlements_backup.sql
```

## Conclusion

This database setup provides a robust foundation for the MZS Settlement System with:

- Complete data integrity through constraints and validation
- Security through RLS and audit trails
- Flexibility through configurable settings
- Historical preservation through immutable settlements
- Easy data migration through ETL scripts
- Comprehensive reporting through views and functions

For additional support or questions, refer to the main project documentation or contact the development team.