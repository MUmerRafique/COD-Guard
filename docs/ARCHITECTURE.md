# Architecture

## High-level

```mermaid
flowchart TB
  subgraph client [Browser]
    UI[Next.js_UI]
  end
  subgraph vercel [Next.js_App]
    RSC[Server_Components]
    API[Route_Handlers]
    DOM[Domain_Services]
    ADP[Provider_Adapters]
  end
  subgraph supabase [Supabase]
    AUTH[Auth]
    PG[(PostgreSQL_RLS)]
  end
  UI --> RSC
  UI --> API
  RSC --> DOM
  API --> DOM
  DOM --> PG
  DOM --> ADP
  AUTH --> PG
```

## Layers [Confirmed]

| Layer | Location | Responsibility |
|-------|----------|----------------|
| UI | `src/app`, `src/components` | Presentation, a11y, client validation |
| API | `src/app/api` | Authn/z, parse input, HTTP codes |
| Domain | `src/server/domain` | Risk scoring, order rules, usage |
| Data | `src/server/db` | Supabase clients, queries |
| Integrations | `src/server/integrations` | Webhooks, WhatsApp, OpenAI |

## Tenancy [Confirmed]

- Active `business_id` from membership join; never from client body alone.
- User JWT via Supabase Auth; RLS uses `auth.uid()` + membership functions.

## Secrets [Confirmed]

- Service role key server-only for webhooks/admin jobs.
- Anon key in browser for Auth only.
