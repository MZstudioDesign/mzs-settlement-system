# MZS Settlement System - API Documentation

## 📋 Overview

This document provides comprehensive documentation for the MZS Settlement System API. The API is built with Next.js App Router and provides RESTful endpoints for managing projects, settlements, contacts, feeds, and supporting data.

## 🔗 Base URL

```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

## 🔐 Authentication

All API endpoints require authentication. The system uses Supabase Auth with JWT tokens.

### Authentication Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Flow

```typescript
// Client-side authentication
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

// Include token in requests
const response = await fetch('/api/projects', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }
})
```

## 📊 API Endpoints

### 1. Projects API

#### GET /api/projects
Retrieve a list of projects with optional filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `status` (string, optional): Filter by project status
- `channel_id` (string, optional): Filter by channel ID
- `search` (string, optional): Search by project name

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "브랜드 로고 디자인",
      "channel_id": "uuid",
      "category_id": "uuid",
      "gross_amount": 1100000,
      "discount_net": 0,
      "designers": [
        {
          "member_id": "uuid",
          "percent": 60,
          "bonus_pct": 5
        },
        {
          "member_id": "uuid",
          "percent": 40,
          "bonus_pct": 0
        }
      ],
      "status": "PENDING",
      "project_date": "2024-01-15T00:00:00Z",
      "payment_date": null,
      "notes": "클라이언트 요청사항...",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z",
      "channel": {
        "id": "uuid",
        "name": "크몽",
        "fee_rate": 0.21,
        "active": true
      },
      "category": {
        "id": "uuid",
        "name": "로고 디자인",
        "active": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Responses:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "새 프로젝트명",
  "channel_id": "uuid",
  "category_id": "uuid",
  "gross_amount": 1100000,
  "discount_net": 0,
  "designers": [
    {
      "member_id": "uuid",
      "percent": 100,
      "bonus_pct": 10
    }
  ],
  "project_date": "2024-01-15T00:00:00Z",
  "payment_date": "2024-01-20T00:00:00Z",
  "notes": "프로젝트 설명"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "새 프로젝트명",
    // ... other project fields
    "settlement_preview": {
      "net_amount": 1000000,
      "base_amount": 1000000,
      "total_fees": 340000,
      "total_designer_payout": 386800,
      "company_profit": 273200
    }
  },
  "message": "프로젝트가 성공적으로 생성되었습니다"
}
```

**Validation Errors:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["name"],
      "message": "프로젝트명은 필수입니다"
    }
  ]
}
```

#### GET /api/projects/[id]
Retrieve a specific project by ID.

**Path Parameters:**
- `id` (string): Project UUID

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "프로젝트명",
    // ... project fields
    "channel": { /* channel data */ },
    "category": { /* category data */ },
    "project_files": [
      {
        "id": "uuid",
        "file_name": "design_v1.pdf",
        "file_url": "https://storage.url/file.pdf",
        "file_size": 1024000,
        "file_type": "application/pdf",
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "settlement_calculation": {
      "gross_t": 1100000,
      "net_b": 1000000,
      "base": 1000000,
      "designer_amount": 400000,
      "bonus_amount": 40000,
      "before_withholding": 440000,
      "withholding_tax": 14520,
      "after_withholding": 425480
    }
  }
}
```

#### PUT /api/projects/[id]
Update a specific project.

**Path Parameters:**
- `id` (string): Project UUID

**Request Body:**
```json
{
  "name": "수정된 프로젝트명",
  "status": "APPROVED",
  "payment_date": "2024-01-25T00:00:00Z"
}
```

**Response:**
```json
{
  "data": { /* updated project data */ },
  "message": "프로젝트가 성공적으로 수정되었습니다"
}
```

#### DELETE /api/projects/[id]
Delete a specific project.

**Path Parameters:**
- `id` (string): Project UUID

**Response:**
```json
{
  "message": "프로젝트가 성공적으로 삭제되었습니다"
}
```

#### GET /api/projects/stats
Retrieve project statistics.

**Query Parameters:**
- `period` (string, optional): 'month', 'quarter', 'year' (default: 'month')
- `start_date` (string, optional): Start date for custom period
- `end_date` (string, optional): End date for custom period

**Response:**
```json
{
  "data": {
    "total_projects": 45,
    "total_revenue": 45600000,
    "average_project_value": 1013333,
    "status_breakdown": {
      "PENDING": 12,
      "APPROVED": 20,
      "COMPLETED": 13,
      "CANCELLED": 0
    },
    "channel_breakdown": [
      {
        "channel_name": "크몽",
        "project_count": 30,
        "total_revenue": 35000000
      },
      {
        "channel_name": "계좌입금",
        "project_count": 15,
        "total_revenue": 10600000
      }
    ],
    "monthly_trend": [
      {
        "month": "2024-01",
        "project_count": 15,
        "revenue": 15200000
      }
    ]
  }
}
```

#### POST /api/projects/batch
Batch operations for multiple projects.

**Request Body:**
```json
{
  "operation": "update_status",
  "project_ids": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "status": "APPROVED"
  }
}
```

**Response:**
```json
{
  "data": {
    "updated_count": 3,
    "failed_count": 0,
    "errors": []
  },
  "message": "일괄 작업이 완료되었습니다"
}
```

### 2. Settlements API

#### GET /api/settlements
Retrieve a list of settlements.

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `status` (string, optional): Filter by settlement status
- `year` (number, optional): Filter by year
- `month` (number, optional): Filter by month

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "month": "2024-01-01T00:00:00Z",
      "status": "LOCKED",
      "locked_at": "2024-02-01T10:00:00Z",
      "locked_by": "admin",
      "notes": "1월 정산 완료",
      "created_at": "2024-02-01T09:00:00Z",
      "settlement_items": [
        {
          "id": "uuid",
          "member_id": "uuid",
          "source_type": "PROJECT",
          "source_id": "uuid",
          "gross_amount": 1100000,
          "net_amount": 1000000,
          "base_amount": 1000000,
          "designer_amount": 400000,
          "bonus_amount": 40000,
          "before_withholding": 440000,
          "withholding_tax": 14520,
          "after_withholding": 425480,
          "is_paid": true,
          "paid_at": "2024-02-05T10:00:00Z",
          "payment_method": "bank_transfer",
          "member": {
            "id": "uuid",
            "name": "오유택",
            "code": "OY"
          }
        }
      ]
    }
  ]
}
```

#### POST /api/settlements
Create a new settlement for a specific month.

**Request Body:**
```json
{
  "month": "2024-02-01",
  "notes": "2월 정산 생성",
  "auto_calculate": true
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "month": "2024-02-01T00:00:00Z",
    "status": "DRAFT",
    "settlement_items": [
      // ... settlement items
    ],
    "summary": {
      "total_members": 6,
      "total_projects": 12,
      "total_before_withholding": 5200000,
      "total_withholding_tax": 171600,
      "total_after_withholding": 5028400
    }
  },
  "message": "정산이 성공적으로 생성되었습니다"
}
```

#### GET /api/settlements/[id]
Retrieve a specific settlement with detailed breakdown.

**Path Parameters:**
- `id` (string): Settlement UUID

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "month": "2024-01-01T00:00:00Z",
    "status": "LOCKED",
    "settlement_items": [
      {
        "id": "uuid",
        "member_id": "uuid",
        "source_type": "PROJECT",
        "breakdown": {
          "projects": [
            {
              "project_name": "브랜드 로고 디자인",
              "gross_amount": 1100000,
              "designer_share": 400000,
              "bonus": 40000,
              "withholding": 14520,
              "final_amount": 425480
            }
          ],
          "contacts": [
            {
              "contact_type": "INCOMING",
              "count": 5,
              "amount": 5000,
              "withholding": 165,
              "final_amount": 4835
            }
          ],
          "feeds": [
            {
              "feed_type": "GTE3",
              "count": 3,
              "amount": 3000,
              "withholding": 99,
              "final_amount": 2901
            }
          ],
          "totals": {
            "before_withholding": 448000,
            "withholding_tax": 14784,
            "after_withholding": 433216
          }
        },
        "member": {
          "id": "uuid",
          "name": "오유택",
          "code": "OY"
        }
      }
    ]
  }
}
```

#### PUT /api/settlements/[id]
Update settlement status or payment information.

**Path Parameters:**
- `id` (string): Settlement UUID

**Request Body:**
```json
{
  "status": "LOCKED",
  "notes": "정산 확정 완료"
}
```

**Response:**
```json
{
  "data": { /* updated settlement */ },
  "message": "정산이 성공적으로 수정되었습니다"
}
```

#### POST /api/settlements/[id]/export
Export settlement data as PDF or CSV.

**Path Parameters:**
- `id` (string): Settlement UUID

**Request Body:**
```json
{
  "format": "pdf",
  "include_details": true,
  "member_ids": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "data": {
    "download_url": "https://storage.url/settlement_2024_01.pdf",
    "filename": "정산표_2024년_1월.pdf",
    "expires_at": "2024-01-01T12:00:00Z"
  }
}
```

### 3. Contacts API

#### GET /api/contacts
Retrieve contact logs.

**Query Parameters:**
- `member_id` (string, optional): Filter by member
- `project_id` (string, optional): Filter by project
- `contact_type` (string, optional): INCOMING, CHAT, GUIDE
- `start_date` (string, optional): Start date filter
- `end_date` (string, optional): End date filter

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "member_id": "uuid",
      "project_id": "uuid",
      "contact_type": "INCOMING",
      "amount": 1000,
      "event_date": "2024-01-15T09:30:00Z",
      "notes": "신규 고객 문의",
      "created_at": "2024-01-15T09:30:00Z",
      "member": {
        "id": "uuid",
        "name": "오유택",
        "code": "OY"
      },
      "project": {
        "id": "uuid",
        "name": "브랜드 로고 디자인"
      }
    }
  ]
}
```

#### POST /api/contacts
Create a new contact log entry.

**Request Body:**
```json
{
  "member_id": "uuid",
  "project_id": "uuid",
  "contact_type": "INCOMING",
  "event_date": "2024-01-15T09:30:00Z",
  "notes": "고객 문의 내용"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "member_id": "uuid",
    "contact_type": "INCOMING",
    "amount": 1000,
    // ... other fields
  },
  "message": "컨택이 성공적으로 기록되었습니다"
}
```

#### POST /api/contacts/batch
Batch create multiple contact entries (for FAB quick actions).

**Request Body:**
```json
{
  "contacts": [
    {
      "member_id": "uuid",
      "contact_type": "INCOMING",
      "event_date": "2024-01-15T09:30:00Z"
    },
    {
      "member_id": "uuid",
      "contact_type": "CHAT",
      "event_date": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "created_count": 2,
    "total_amount": 2000,
    "contacts": [
      // ... created contact entries
    ]
  },
  "message": "2건의 컨택이 성공적으로 기록되었습니다"
}
```

### 4. Feed Logs API

#### GET /api/feed-logs
Retrieve feed log entries.

**Query Parameters:**
- `member_id` (string, optional): Filter by member
- `feed_type` (string, optional): BELOW3, GTE3
- `start_date` (string, optional): Start date filter
- `end_date` (string, optional): End date filter

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "member_id": "uuid",
      "feed_type": "GTE3",
      "amount": 1000,
      "event_date": "2024-01-15T14:00:00Z",
      "notes": "피드백 작업 완료",
      "created_at": "2024-01-15T14:00:00Z",
      "member": {
        "id": "uuid",
        "name": "김연지",
        "code": "KY"
      }
    }
  ]
}
```

#### POST /api/feed-logs
Create a new feed log entry.

**Request Body:**
```json
{
  "member_id": "uuid",
  "feed_type": "GTE3",
  "event_date": "2024-01-15T14:00:00Z",
  "notes": "피드백 작업 상세 내용"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "member_id": "uuid",
    "feed_type": "GTE3",
    "amount": 1000,
    // ... other fields
  },
  "message": "피드가 성공적으로 기록되었습니다"
}
```

### 5. Supporting Data API

#### GET /api/supporting-data
Retrieve all supporting data in a single request (optimized for initial load).

**Response:**
```json
{
  "data": {
    "members": [
      {
        "id": "uuid",
        "name": "오유택",
        "code": "OY",
        "active": true,
        "email": "oy@mzstudio.co.kr",
        "phone": "010-1234-5678"
      }
    ],
    "channels": [
      {
        "id": "uuid",
        "name": "크몽",
        "fee_rate": 0.21,
        "active": true,
        "description": "크몽 플랫폼 채널"
      }
    ],
    "categories": [
      {
        "id": "uuid",
        "name": "로고 디자인",
        "active": true,
        "description": "브랜드 로고 디자인 카테고리"
      }
    ],
    "settings": {
      "vat_rate": 0.10,
      "designer_distribution_rate": 0.40,
      "withholding_tax_rate": 0.033,
      "ad_fee_rate": 0.10,
      "program_fee_rate": 0.03,
      "contact_amounts": {
        "INCOMING": 1000,
        "CHAT": 1000,
        "GUIDE": 2000
      },
      "feed_amounts": {
        "BELOW3": 400,
        "GTE3": 1000
      }
    }
  }
}
```

### 6. File Upload API

#### POST /api/projects/[id]/files
Upload files to a specific project.

**Path Parameters:**
- `id` (string): Project UUID

**Request Body:**
- Form data with file uploads (multipart/form-data)
- Maximum 5 files per request
- Maximum 10MB per file
- Allowed types: PDF, JPG, PNG, DOCX

**Response:**
```json
{
  "data": {
    "uploaded_files": [
      {
        "id": "uuid",
        "file_name": "design_mockup.pdf",
        "file_url": "https://storage.url/project-files/uuid/design_mockup.pdf",
        "file_size": 2048000,
        "file_type": "application/pdf"
      }
    ],
    "failed_files": []
  },
  "message": "1개 파일이 성공적으로 업로드되었습니다"
}
```

#### DELETE /api/projects/[project_id]/files/[file_id]
Delete a specific project file.

**Path Parameters:**
- `project_id` (string): Project UUID
- `file_id` (string): File UUID

**Response:**
```json
{
  "message": "파일이 성공적으로 삭제되었습니다"
}
```

### 7. Dashboard API

#### GET /api/dashboard/kpis
Retrieve dashboard KPIs and metrics.

**Query Parameters:**
- `period` (string, optional): 'current_month', 'last_month', 'quarter', 'year'

**Response:**
```json
{
  "data": {
    "current_month": {
      "revenue": 45600000,
      "projects": 12,
      "settlements": 18240000,
      "pending_payments": 2340000
    },
    "previous_month": {
      "revenue": 38900000,
      "projects": 10,
      "settlements": 15560000,
      "pending_payments": 1890000
    },
    "growth_rates": {
      "revenue": 17.2,
      "projects": 20.0,
      "settlements": 17.2
    },
    "member_rankings": [
      {
        "member_id": "uuid",
        "member_name": "오유택",
        "member_code": "OY",
        "total_earnings": 8200000,
        "converted_score": 20500000,
        "project_count": 3,
        "growth_rate": 15.2,
        "rank": 1
      }
    ],
    "recent_activities": [
      {
        "type": "project",
        "title": "브랜드 로고 디자인",
        "member": "오유택",
        "amount": 1200000,
        "timestamp": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

## 🚨 Error Handling

### Standard Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    // Additional error details
  },
  "timestamp": "2024-01-01T10:00:00Z",
  "path": "/api/projects"
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Examples

**Validation Error (422):**
```json
{
  "error": "Validation Error",
  "message": "입력 데이터가 올바르지 않습니다",
  "details": [
    {
      "field": "gross_amount",
      "message": "금액은 0보다 커야 합니다",
      "code": "too_small"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "error": "Unauthorized",
  "message": "인증이 필요합니다",
  "details": {
    "reason": "invalid_token"
  }
}
```

**Not Found Error (404):**
```json
{
  "error": "Not Found",
  "message": "프로젝트를 찾을 수 없습니다",
  "details": {
    "resource": "project",
    "id": "uuid"
  }
}
```

## 📝 Rate Limiting

### Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Read Operations | 100 requests | 1 minute |
| Write Operations | 30 requests | 1 minute |
| File Uploads | 10 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Error (429)

```json
{
  "error": "Too Many Requests",
  "message": "요청 한도를 초과했습니다",
  "details": {
    "limit": 100,
    "remaining": 0,
    "reset": 1640995200
  }
}
```

## 🔍 Request/Response Examples

### Complete Project Creation Example

**Request:**
```http
POST /api/projects
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "name": "크몽 브랜드 리뉴얼 프로젝트",
  "channel_id": "ch_kmong_uuid",
  "category_id": "cat_logo_uuid",
  "gross_amount": 2200000,
  "discount_net": 100000,
  "designers": [
    {
      "member_id": "member_oy_uuid",
      "percent": 70,
      "bonus_pct": 10
    },
    {
      "member_id": "member_le_uuid",
      "percent": 30,
      "bonus_pct": 5
    }
  ],
  "project_date": "2024-01-15T00:00:00Z",
  "payment_date": "2024-01-25T00:00:00Z",
  "notes": "클라이언트 요구사항: 모던하고 심플한 디자인, 주색상 파란색 계열"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": "proj_new_uuid",
    "name": "크몽 브랜드 리뉴얼 프로젝트",
    "channel_id": "ch_kmong_uuid",
    "category_id": "cat_logo_uuid",
    "gross_amount": 2200000,
    "discount_net": 100000,
    "designers": [
      {
        "member_id": "member_oy_uuid",
        "percent": 70,
        "bonus_pct": 10
      },
      {
        "member_id": "member_le_uuid",
        "percent": 30,
        "bonus_pct": 5
      }
    ],
    "status": "PENDING",
    "project_date": "2024-01-15T00:00:00Z",
    "payment_date": "2024-01-25T00:00:00Z",
    "notes": "클라이언트 요구사항: 모던하고 심플한 디자인, 주색상 파란색 계열",
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z",
    "channel": {
      "id": "ch_kmong_uuid",
      "name": "크몽",
      "fee_rate": 0.21
    },
    "category": {
      "id": "cat_logo_uuid",
      "name": "로고 디자인"
    },
    "settlement_preview": {
      "gross_t": 2200000,
      "net_b": 2000000,
      "base": 2100000,
      "total_fees": 680000,
      "designer_calculations": [
        {
          "member_id": "member_oy_uuid",
          "member_name": "오유택",
          "percent": 70,
          "bonus_pct": 10,
          "designer_amount": 588000,
          "bonus_amount": 58800,
          "before_withholding": 646800,
          "withholding_tax": 21344,
          "after_withholding": 625456
        },
        {
          "member_id": "member_le_uuid",
          "member_name": "이예천",
          "percent": 30,
          "bonus_pct": 5,
          "designer_amount": 252000,
          "bonus_amount": 12600,
          "before_withholding": 264600,
          "withholding_tax": 8732,
          "after_withholding": 255868
        }
      ],
      "total_designer_payout": 881324,
      "company_profit": 538676
    }
  },
  "message": "프로젝트가 성공적으로 생성되었습니다"
}
```

## 🧪 Testing

### API Testing with curl

```bash
# Get all projects
curl -X GET "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Create a new project
curl -X POST "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "channel_id": "uuid",
    "gross_amount": 1100000,
    "designers": [{"member_id": "uuid", "percent": 100, "bonus_pct": 0}]
  }'

# Upload file to project
curl -X POST "http://localhost:3000/api/projects/PROJECT_ID/files" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

### JavaScript/TypeScript Client

```typescript
class MZSApiClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API request failed')
    }

    return response.json()
  }

  // Projects
  async getProjects(params?: {
    page?: number
    limit?: number
    status?: string
  }) {
    const query = new URLSearchParams(params as any).toString()
    return this.request(`/api/projects?${query}`)
  }

  async createProject(data: CreateProjectData) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProject(id: string, data: UpdateProjectData) {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Settlements
  async generateSettlement(month: string) {
    return this.request('/api/settlements', {
      method: 'POST',
      body: JSON.stringify({ month }),
    })
  }

  // Quick Actions (FAB)
  async logContact(data: ContactData) {
    return this.request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async logFeed(data: FeedData) {
    return this.request('/api/feed-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Usage
const client = new MZSApiClient('http://localhost:3000', 'your-jwt-token')

try {
  const projects = await client.getProjects({ page: 1, limit: 20 })
  console.log('Projects:', projects.data)
} catch (error) {
  console.error('Error:', error.message)
}
```

## 📋 Changelog

### Version 1.0.0 (Current)
- Initial API implementation
- Project management endpoints
- Settlement calculation engine
- Contact and feed logging
- File upload support
- Dashboard KPIs
- Batch operations

### Planned Features
- Webhooks for real-time notifications
- Advanced filtering and search
- API versioning
- GraphQL endpoint (alternative to REST)
- Bulk import/export operations
- Advanced analytics endpoints

---

**Last Updated**: December 2024
**API Version**: 1.0.0