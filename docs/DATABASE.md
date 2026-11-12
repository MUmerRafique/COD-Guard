# Database

## ER diagram

```mermaid
erDiagram
  businesses ||--o{ business_memberships : has
  users ||--o{ business_memberships : has
  businesses ||--o{ customers : owns
  businesses ||--o{ orders : owns
  customers ||--o{ orders : places
  orders ||--o{ risk_evaluations : has
  orders ||--o{ verification_tokens : has
  businesses ||--o{ integration_connections : has
  businesses ||--o{ webhook_events : receives
  businesses ||--o{ usage_events : tracks
  businesses ||--o{ subscriptions : has
  plans ||--o{ subscriptions : defines

  businesses {
    uuid id PK
    text name
    text timezone
    text currency
  }
  business_memberships {
    uuid id PK
    uuid business_id FK
    uuid user_id FK
    text role
  }
  customers {
    uuid id PK
    uuid business_id FK
    text phone_normalized
    text full_name
  }
  orders {
    uuid id PK
    uuid business_id FK
    uuid customer_id FK
    numeric cod_amount
    text currency
    text status
    text source
  }
  risk_evaluations {
    uuid id PK
    uuid order_id FK
    int score
    text rule_version
    jsonb factors
  }
```

## Conventions [Confirmed]

- Timestamps: `timestamptz` UTC.
- Money: `numeric(14,2)` + `currency` column (default `PKR`).
- Migrations: `supabase/migrations/*.sql`.

## RLS [Confirmed]

All tenant tables include `business_id`. Policies:

- **SELECT/INSERT/UPDATE/DELETE:** caller is member of row's `business_id` via `business_memberships`.
- **Super admin:** separate role check via `app_metadata.is_super_admin` + audited service path only.

Helper SQL: `public.is_business_member(business_id uuid)`.

## Indexes [Confirmed]

- `orders (business_id, created_at desc)`
- `orders (business_id, status)`
- `customers (business_id, phone_normalized)`
- `webhook_events (business_id, provider, external_id)` unique for idempotency
