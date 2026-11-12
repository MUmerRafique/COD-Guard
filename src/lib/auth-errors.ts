type AuthLikeError = {
  message?: string;
  code?: string;
};

export function formatAuthErrorMessage(error: AuthLikeError): string {
  const code = error.code ?? "";
  const message = error.message ?? "";
  const lower = message.toLowerCase();

  if (code === "over_email_send_rate_limit" || lower.includes("email rate limit")) {
    return (
      "Email rate limit reached. Supabase allows only a few auth emails per hour on the default mailer. " +
      "Wait about an hour before trying again, or set up custom SMTP under Supabase → Authentication → SMTP."
    );
  }

  if (code === "over_request_rate_limit" || lower.includes("rate limit")) {
    return "Too many sign-in attempts. Please wait a minute and try again.";
  }

  return message || "Sign-in failed.";
}
