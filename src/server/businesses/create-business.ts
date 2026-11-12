import { ApiError } from "@/lib/api-error";
import { createServiceClient } from "@/server/supabase/admin";

function mapDbError(error: { code?: string; message?: string }): never {
  if (error.code === "PGRST205") {
    throw new ApiError(
      "CONFIGURATION_ERROR",
      "Database schema is not set up. Run npm run db:migrate (set SUPABASE_DB_URL in .env.local) or apply supabase/migrations in the Supabase SQL editor — see docs/DEPLOY.md.",
      503,
    );
  }
  throw error;
}

export async function createBusinessForUser(
  userId: string,
  params: { name: string; timezone?: string },
) {
  const admin = createServiceClient();
  const name = params.name.trim();
  const timezone = params.timezone ?? "Asia/Karachi";

  const { data: business, error: bErr } = await admin
    .from("businesses")
    .insert({ name, timezone })
    .select()
    .single();
  if (bErr) mapDbError(bErr);
  if (!business) throw new Error("create business failed");

  const { error: mErr } = await admin.from("business_memberships").insert({
    business_id: business.id,
    user_id: userId,
    role: "owner",
  });
  if (mErr) mapDbError(mErr);

  const { error: sErr } = await admin.from("subscriptions").insert({
    business_id: business.id,
    plan_id: "starter",
  });
  if (sErr) mapDbError(sErr);

  return business;
}
