export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "CONFIGURATION_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type PostgrestLikeError = { code?: string; message?: string };

function isMissingSchemaError(error: PostgrestLikeError): boolean {
  return error.code === "PGRST205" || (error.message?.includes("schema cache") ?? false);
}

export function jsonError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details ?? {} } },
      { status: error.status },
    );
  }
  if (error && typeof error === "object" && isMissingSchemaError(error as PostgrestLikeError)) {
    return Response.json(
      {
        error: {
          code: "CONFIGURATION_ERROR",
          message:
            "Database schema is not set up. Run npm run db:migrate (set SUPABASE_DB_URL in .env.local) or apply supabase/migrations in the Supabase SQL editor — see docs/DEPLOY.md.",
          details: {},
        },
      },
      { status: 503 },
    );
  }
  console.error(error);
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", details: {} } },
    { status: 500 },
  );
}
