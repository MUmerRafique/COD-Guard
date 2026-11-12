import { jsonError, ApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { hashToken } from "@/server/domain/tokens";
import { createServiceClient } from "@/server/supabase/admin";
import { z } from "zod";

const postSchema = z.object({
  decision: z.enum(["confirm", "cancel"]),
});

export async function GET(request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    ensureSupabaseConfigured();
    const { token } = await ctx.params;
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    if (!rateLimit(`verify:get:${ip}`, 30, 60_000)) {
      throw new ApiError("RATE_LIMITED", "Too many requests.", 429);
    }

    const supabase = createServiceClient();
    const tokenHash = hashToken(token);
    const { data: row } = await supabase
      .from("verification_tokens")
      .select("expires_at, used_at, action, order_id")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!row) throw new ApiError("NOT_FOUND", "Invalid or expired link.", 404);
    if (row.used_at) throw new ApiError("CONFLICT", "This link has already been used.", 409);
    if (new Date(row.expires_at as string) < new Date()) {
      throw new ApiError("NOT_FOUND", "Invalid or expired link.", 404);
    }

    return Response.json({
      data: {
        action: row.action,
        expiresAt: row.expires_at,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    ensureSupabaseConfigured();
    const { token } = await ctx.params;
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    if (!rateLimit(`verify:post:${ip}`, 10, 60_000)) {
      throw new ApiError("RATE_LIMITED", "Too many requests.", 429);
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Invalid decision." } }, { status: 400 });
    }

    const supabase = createServiceClient();
    const tokenHash = hashToken(token);
    const { data: row } = await supabase
      .from("verification_tokens")
      .select("id, order_id, business_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!row || row.used_at || new Date(row.expires_at as string) < new Date()) {
      throw new ApiError("NOT_FOUND", "Invalid or expired link.", 404);
    }

    const nextStatus = parsed.data.decision === "confirm" ? "verified" : "cancelled";
    await supabase
      .from("orders")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", row.order_id as string);

    await supabase
      .from("verification_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id as string);

    return Response.json({ data: { status: nextStatus } });
  } catch (e) {
    return jsonError(e);
  }
}
