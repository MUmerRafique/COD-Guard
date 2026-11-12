# CODGuard Master Specification

> **Product:** CODGuard — AI-Powered COD Verification & RTO Prevention SaaS  
> **Market:** Pakistan  
> **Default currency:** PKR  
> **Default timezone:** Asia/Karachi  
> **Authority:** Product requirements source; used with [AGENTS.md](./AGENTS.md).

---

## 1. Vision and goals

CODGuard helps Pakistani e-commerce merchants reduce return-to-origin (RTO) losses on cash-on-delivery orders by:

1. Scoring order risk deterministically (0–100) with explainable factors.
2. Verifying buyer intent via WhatsApp/SMS workflows (when configured).
3. Centralizing orders from Shopify, WooCommerce, CSV, and manual entry.
4. Tracking outcomes (delivered, RTO, cancelled) to improve future scores.

**Non-goals (v1):** Full courier TMS, inventory management, non-PKR multi-country expansion.

---

## 2. Personas

| Persona | Needs |
|---------|--------|
| **Merchant owner** | See risky COD orders, approve/cancel before dispatch, ROI metrics |
| **Operations staff** | Order queue, bulk actions, CSV import, customer history |
| **Super admin** | Tenant oversight, plan management, audit logs (privileged) |

---

## 3. Core features (v1)

### 3.1 Multi-tenant businesses

- User signs up, creates or joins a **business** (tenant).
- Roles: `owner`, `admin`, `member`, `viewer` (proposed defaults).
- One user may belong to multiple businesses; active business selected in session.

### 3.2 Orders

- Fields: external reference, customer phone (PK format validation), name, address, city, COD amount (PKR), status, source (`manual`, `csv`, `shopify`, `woocommerce`).
- Status flow: `pending` → `verified` \| `rejected` \| `cancelled` → `dispatched` → `delivered` \| `rto`.
- Duplicate detection: same business + normalized phone + amount + within 24h window (configurable).

### 3.3 Deterministic risk engine (required before AI)

- Score 0–100, rule version `v1.0`.
- Factors (documented weights in code/docs): phone format, duplicate order, high COD amount tiers, prior RTO on phone (same business), missing address signals.
- Human override with reason; never auto-blacklist from AI alone.
- Store score snapshot + factor breakdown per evaluation.

### 3.4 Customer verification (public)

- Unguessable token links for confirm/cancel (hashed at rest, TTL 48h default).
- Rate-limited public endpoints.

### 3.5 Integrations (phased)

| Integration | v1 scope |
|-------------|----------|
| CSV import/export | Full |
| Shopify webhook | Adapter + signature verify; stub if unconfigured |
| WooCommerce webhook | Same |
| WhatsApp (BSP) | Adapter boundary; honest disconnected state |
| Courier webhooks | Event store + stub |
| OpenAI | Optional supplementary insights; never mutates deterministic score |

### 3.6 Billing and plans

| Plan | Orders/month | WhatsApp | AI insights |
|------|----------------|----------|-------------|
| **Starter** | 500 | — | — |
| **Growth** | 5,000 | 1,000 msgs | Limited |
| **Pro** | 50,000 | 10,000 msgs | Higher |

Server-enforced limits; usage ledger idempotent per billable event.

---

## 4. Phase approval gates

| Phase | Gate criteria |
|-------|----------------|
| **0** | Audit documented |
| **1** | All `docs/*` approved by product owner |
| **2** | Migrations + RLS + core API tests green |
| **3** | Merchant UI connected to real APIs |
| **4** | Risk + webhooks + messaging boundaries |
| **5** | Plans + usage enforcement |
| **6** | Release checklist verified |

**Current execution:** Phases 0–6 per approved engineering plan (user authorized full implementation).

---

## 5. Security and compliance

- PostgreSQL RLS on all tenant tables.
- PII minimization in logs and AI prompts.
- No labeling customers as fraudsters from score alone in UI copy.

---

## 6. Technical stack (confirmed for v1)

- **Frontend:** Next.js (App Router), React, TypeScript.
- **Backend:** Next.js Route Handlers + Server Actions; domain services in `src/server`.
- **Database:** Supabase PostgreSQL + Auth + RLS.
- **Testing:** Vitest; RLS/isolation integration tests where feasible.
- **Deploy:** Vercel (assumed); Supabase hosted DB.

---

## 7. Open items (resolve in DECISIONS.md)

- Payment provider for Pakistan (JazzCash/EasyPaisa/stripe) — v1: manual plan assignment + usage only.
- Specific WhatsApp BSP — adapter interface first.

---

*Version 1.0 — aligned with AGENTS.md engineering instructions.*
