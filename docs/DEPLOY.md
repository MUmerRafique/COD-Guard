# Deployment

## Prerequisites

1. Create a Supabase project.
2. Apply database migrations (required before creating a business):
   - **CLI / script:** In `.env.local`, set `SUPABASE_DB_URL` to your Postgres URI (Dashboard → Project Settings → Database → Connection string → URI). Run `npm run db:migrate`.
   - **SQL editor:** Paste and run all files in [supabase/migrations/](../supabase/migrations/) in order (oldest first).
   - **Supabase CLI:** `npx supabase login` then `npx supabase db push --remote=<project-ref>`.
3. Enable Email auth (magic link) in Supabase Auth settings.
4. **Authentication → URL configuration:** add redirect URL `http://localhost:3000/auth/callback` (and your production URL `/auth/callback`).
5. **Email rate limits:** Supabase’s built-in mailer allows only a few auth emails per hour. If you see “email rate limit exceeded,” wait ~1 hour or configure **Authentication → SMTP** (e.g. Resend, SendGrid). Local `npm run dev` uses admin-generated links by default (no email); set `CODGUARD_DEV_MAGIC_LINK=false` to test real emails locally.

## Environment variables

Copy [.env.example](../.env.example) to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_APP_URL` (production URL)
- Optional: `SHOPIFY_WEBHOOK_SECRET`, `WOOCOMMERCE_WEBHOOK_SECRET`, `WHATSAPP_API_TOKEN`, `OPENAI_API_KEY`
- `SUPER_ADMIN_USER_IDS` — comma-separated Supabase user UUIDs

## Build checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Vercel

- Import repository, set env vars, deploy.
- Point Shopify/Woo webhooks to `https://<domain>/api/webhooks/shopify` etc.

## Rollback

- Redeploy previous Vercel deployment.
- Database: restore Supabase backup; do not drop production DB without authorized migration plan.

## Backups

- Enable Supabase daily backups on paid tier; document RPO/RTO in operations runbook.
