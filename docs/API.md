# API Contract

Base path: `/api`. All protected routes require Supabase session cookie unless noted.

## Errors [Confirmed]

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`, `CONFLICT`, `INTERNAL_ERROR`.

## Auth

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/callback` | Supabase (handled by SDK) |

## Businesses

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/businesses` | List memberships |
| POST | `/api/businesses` | Create business + owner membership |

## Orders

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orders?page&limit&status` | Paginated list (max 100) |
| POST | `/api/orders` | Create + score |
| GET | `/api/orders/:id` | Detail + latest risk |
| PATCH | `/api/orders/:id` | Status transition |
| POST | `/api/orders/:id/override-risk` | Human override with reason |

## Customers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customers?phone` | Lookup |

## CSV

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/imports/csv` | Multipart upload; preview or commit |

## Public (rate limited)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/verify/:token` | Token metadata (safe) |
| POST | `/api/public/verify/:token` | Confirm or cancel order |

## Webhooks (unsigned body + signature header)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/webhooks/shopify` | Idempotent ingest |
| POST | `/api/webhooks/woocommerce` | Idempotent ingest |

## Usage / Plans

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/usage` | Current period usage vs plan |
| GET | `/api/plans` | Public plan catalog |

## Super admin [Confirmed]

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/businesses` | List tenants (super admin only) |

Idempotency: `Idempotency-Key` header on POST where retries expected.
