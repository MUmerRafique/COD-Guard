# Product Requirements Document (CODGuard)

**Status labels:** [Confirmed] from master spec; [Proposed] pending market validation.

## Problem [Confirmed]

Pakistani merchants lose margin on COD orders when buyers refuse delivery (RTO). Manual phone verification does not scale.

## Solution [Confirmed]

SaaS that ingests orders, scores risk with explainable rules, supports verification workflows, and tracks outcomes per business tenant.

## User stories

1. **As an owner**, I see new COD orders with risk score and factors so I can decide to ship or cancel. [Confirmed]
2. **As ops**, I import orders via CSV with row-level errors. [Confirmed]
3. **As ops**, I override a score with a reason for audit. [Confirmed]
4. **As a buyer**, I confirm or cancel via a secure link without logging in. [Confirmed]
5. **As super admin**, I view tenants and usage (privileged, audited). [Confirmed]

## UX principles [Confirmed]

- Never call a customer a "fraudster" based on score alone.
- Show deterministic factors and weights; AI suggestions labeled as suggestions.
- Integration states: disconnected / misconfigured / connected / degraded only.

## Out of scope v1 [Confirmed]

- Automated courier booking
- In-app payment collection (billing manual/planned limits only)

## Success metrics [Proposed]

- RTO rate reduction vs baseline (merchant-reported)
- Verification response rate
- Time-to-decision on high-risk queue
