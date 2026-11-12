import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().optional(),
  SUPER_ADMIN_USER_IDS: z.string().optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
  WOOCOMMERCE_WEBHOOK_SECRET: z.string().optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export function getPublicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });
}

export function getServerEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPER_ADMIN_USER_IDS: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? process.env.SUPER_ADMIN_USER_IDS
      : process.env.SUPER_ADMIN_USER_IDS,
    SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET,
    WOOCOMMERCE_WEBHOOK_SECRET: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
  });
}

export function isSupabaseConfigured(): boolean {
  const env = getPublicEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
