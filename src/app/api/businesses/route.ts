import { jsonError } from "@/lib/api-error";
import { ensureSupabaseConfigured } from "@/lib/configure-check";
import { requireUser } from "@/server/auth/session";
import { createBusinessForUser } from "@/server/businesses/create-business";

export async function GET() {
  try {
    ensureSupabaseConfigured();
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("business_memberships")
      .select("role, businesses(id, name, timezone, currency)")
      .eq("user_id", user.id);
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request: Request) {
  try {
    ensureSupabaseConfigured();
    const { user } = await requireUser();
    const body = (await request.json()) as { name?: string; timezone?: string };
    if (!body.name?.trim()) {
      return Response.json({ error: { code: "VALIDATION_ERROR", message: "Business name required" } }, { status: 400 });
    }

    const business = await createBusinessForUser(user.id, {
      name: body.name,
      timezone: body.timezone,
    });

    return Response.json({ data: business }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
