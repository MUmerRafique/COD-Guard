import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
