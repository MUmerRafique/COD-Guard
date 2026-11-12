# Architecture Decisions

## ADR-001 — Stack [Confirmed 2026-11-12]

**Decision:** Next.js App Router + Supabase (Auth, PostgreSQL, RLS).

**Rationale:** Matches AGENTS.md; RLS for tenant isolation; fast SaaS iteration.

**Alternatives rejected:** Custom Nest API only (more ops); Firebase (weaker relational RLS story).

---

## ADR-002 — Payment provider [Unresolved]

**Decision:** Defer automated billing; manual plan assignment + usage ledger in v1.

**Follow-up:** JazzCash/EasyPaisa evaluation for Pakistan.

---

## ADR-003 — WhatsApp BSP [Proposed]

**Decision:** Provider adapter interface; default implementation returns `disconnected`.

**Follow-up:** Select Meta Cloud API vs local BSP.

---

## ADR-004 — Package manager [Confirmed]

**Decision:** npm (create-next-app default).

---

## ADR-005 — Phase 1 approval [Confirmed 2026-11-12]

**Decision:** User authorized full plan execution in agent session; proceed to implementation.
