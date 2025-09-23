# MZS Settlement System - Deployment Guide

## 📋 Overview

This deployment guide provides comprehensive instructions for setting up and deploying the MZS Settlement System. The system is built with Next.js 15, Supabase, and TypeScript, designed for mobile-first settlement management.

## 🏗️ System Requirements

### Production Environment
- **Node.js**: 18.17+ or 20.5+
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: 10GB available space
- **Network**: Stable internet connection for Supabase integration

### Development Environment
- **Node.js**: 18.17+ or 20.5+
- **Package Manager**: npm, yarn, or pnpm
- **Browser**: Modern browser supporting ES2022+
- **IDE**: VS Code recommended with TypeScript support

## 🛠️ Environment Setup

### 1. Development Environment

```bash
# Clone repository
git clone <repository-url>
cd mzs-settlement-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### 2. Staging Environment

```bash
# Build the application
npm run build

# Start production server
npm start

# Run E2E tests
npm run test:e2e
```

### 3. Production Environment

```bash
# Production build with optimizations
NODE_ENV=production npm run build

# Start with PM2 (recommended)
pm2 start ecosystem.config.js

# Or start with npm
npm start
```

## 🗄️ Supabase Configuration

### 1. Project Setup

1. **Create New Supabase Project**
   ```bash
   # Visit https://supabase.com/dashboard
   # Create new project
   # Note down Project URL and anon key
   ```

2. **Database Setup**
   ```sql
   -- Run migrations in order
   supabase/migrations/20240922000001_initial_schema.sql
   supabase/migrations/20240922000002_rls_policies.sql
   supabase/migrations/20240922000003_seed_data.sql
   supabase/migrations/20240922000004_add_missing_tables.sql
   supabase/migrations/20240922000005_seed_missing_tables.sql
   ```

3. **Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
   -- ... (see migration files for complete setup)
   ```

### 2. Storage Configuration

```sql
-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);

-- Create storage policy
CREATE POLICY "Project files access" ON storage.objects
FOR ALL USING (bucket_id = 'project-files');
```

### 3. Database Functions

Key stored procedures for business logic:

```sql
-- Settlement calculation function
CREATE OR REPLACE FUNCTION calculate_settlement_amount(
  gross_amount_param numeric,
  discount_net_param numeric DEFAULT 0,
  designer_percent_param numeric DEFAULT 100,
  bonus_pct_param numeric DEFAULT 0
) RETURNS TABLE(...);

-- Validation functions
CREATE OR REPLACE FUNCTION validate_designer_percentages(
  designers_json jsonb
) RETURNS boolean;
```

## 🔧 Environment Variables

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Settings
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Optional - Analytics
NEXT_PUBLIC_GA_ID=GA-XXXXX-X
```

### Environment-Specific Variables

**Development (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
NEXTAUTH_URL=http://localhost:3000
```

**Staging (.env.staging)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
NEXTAUTH_URL=https://staging.yourdomain.com
```

**Production (.env.production)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
NEXTAUTH_URL=https://yourdomain.com
```

## 🚀 Build and Deployment

### 1. Build Process

```bash
# Install dependencies
npm ci

# Type checking
npm run type-check

# Linting
npm run lint

# Build application
npm run build

# Test build
npm run start
```

### 2. Deployment Options

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**vercel.json**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

#### Docker Deployment

**Dockerfile**
```dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
```

#### Traditional VPS

```bash
# Using PM2
npm install -g pm2

# Ecosystem configuration (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'mzs-settlement',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

# Deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🗃️ Database Migration

### 1. Initial Setup

```bash
# Run all migrations
supabase db reset
```

### 2. Data Migration from Excel

```bash
# Prepare CSV files from Excel sheets
# Place files in data/ directory
# - members.csv
# - projects.csv
# - contacts.csv
# - feed_logs.csv

# Run ETL script
npm run etl
```

### 3. Backup and Restore

```bash
# Backup
supabase db dump --file backup.sql

# Restore
supabase db reset
psql -h localhost -p 54322 -U postgres -d postgres -f backup.sql
```

## 🔒 Security Configuration

### 1. Supabase Security

```sql
-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create access policies
CREATE POLICY "Members can view all" ON members
FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can modify" ON members
FOR ALL USING (auth.role() = 'authenticated');
```

### 2. CORS Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### 3. API Rate Limiting

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Implement rate limiting logic
  const ip = request.ip ?? '127.0.0.1'
  // Add rate limiting implementation
}
```

## 🎯 Performance Optimization

### 1. Build Optimization

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['supabase.co'],
    formats: ['image/webp', 'image/avif']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}
```

### 2. Caching Strategy

```typescript
// lib/cache.ts
export const revalidate = 3600; // 1 hour

// API routes
export async function GET() {
  const data = await fetchData()
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
```

### 3. Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_settlements_month ON settlements(month);
CREATE INDEX idx_settlement_items_member ON settlement_items(member_id);
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures

**Issue**: TypeScript compilation errors
```bash
# Solution
npm run type-check
# Fix TypeScript errors
npm run build
```

**Issue**: Missing environment variables
```bash
# Solution
cp .env.example .env.local
# Fill in required variables
```

#### 2. Database Connection Issues

**Issue**: Supabase connection timeout
```typescript
// Check network connectivity
// Verify environment variables
// Check Supabase project status
```

**Issue**: Migration failures
```sql
-- Check migration order
-- Verify database permissions
-- Check for data conflicts
```

#### 3. Performance Issues

**Issue**: Slow API responses
- Enable database query caching
- Add proper indexes
- Implement API pagination
- Use React Query for client-side caching

**Issue**: Large bundle size
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

### Monitoring and Logging

#### 1. Application Monitoring

```typescript
// lib/monitoring.ts
export function logError(error: Error, context: string) {
  console.error(`[${context}]`, error)
  // Send to monitoring service
}

export function logPerformance(metric: string, value: number) {
  console.info(`[PERF] ${metric}: ${value}ms`)
  // Send to analytics
}
```

#### 2. Database Monitoring

```sql
-- Monitor query performance
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 🔄 Maintenance

### Regular Tasks

#### Daily
- Monitor error logs
- Check system performance
- Verify backup completion

#### Weekly
- Review performance metrics
- Update dependencies (security patches)
- Database maintenance

#### Monthly
- Full system backup
- Performance optimization review
- Security audit

### Update Procedures

```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Test after updates
npm run test:e2e
npm run build
```

## 📞 Support

### Getting Help

1. **Documentation**: Check this guide and API documentation
2. **Issues**: Create GitHub issue with detailed description
3. **Community**: Join project discussions
4. **Emergency**: Contact system administrator

### Health Checks

```bash
# Application health
curl https://yourdomain.com/api/health

# Database health
curl https://yourdomain.com/api/health/db

# Dependencies health
npm run health-check
```

---

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase project setup complete
- [ ] Database migrations applied
- [ ] Seed data imported
- [ ] Build passes without errors
- [ ] Tests pass
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Documentation updated

**Last Updated**: December 2024
**Version**: 1.0.0