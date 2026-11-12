# Security

## Threat model (summary) [Confirmed]

| Threat | Control |
|--------|---------|
| Cross-tenant data access | RLS + server membership checks |
| Token guessing on public links | 256-bit tokens, hashed storage, TTL |
| Webhook spoofing | Provider signature verification |
| CSV formula injection | Escape exports; validate imports |
| Privilege escalation | Role checks per route; super admin isolated |
| Secret leakage | No service role in client; redacted logs |

## RLS testing [Confirmed]

Automated tests must assert User A cannot `select` Business B orders (Vitest + mocked policy logic minimum; full integration when Supabase test project available).

## Service role bypass [Confirmed]

Used only in:

- Webhook ingestion (after signature verify, scoped to business from connection)
- Background retries

Each path documents explicit `business_id` authorization.

## PII [Confirmed]

- Logs: redact phone to last 4 digits.
- OpenAI: send order summary without full address when possible.

## Sessions [Confirmed]

Supabase Auth cookies; HTTPS-only in production.
