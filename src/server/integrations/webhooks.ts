import { createHmac, timingSafeEqual } from "crypto";

export function verifyHmacSha256(body: string, secret: string, headerValue: string | null): boolean {
  if (!secret || !headerValue) return false;
  const digest = createHmac("sha256", secret).update(body, "utf8").digest("base64");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(headerValue));
  } catch {
    return false;
  }
}

export function shopifyWebhookValid(body: string, secret: string, hmacHeader: string | null): boolean {
  if (!secret || !hmacHeader) return false;
  const digest = createHmac("sha256", secret).update(body, "utf8").digest("base64");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}
