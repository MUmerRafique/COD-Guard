import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  return Response.json({
    ok: true,
    supabase: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
