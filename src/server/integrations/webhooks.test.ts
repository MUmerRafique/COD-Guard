import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { shopifyWebhookValid, verifyHmacSha256 } from "./webhooks";

describe("webhook signatures", () => {
  it("verifies shopify hmac", () => {
    const body = '{"id":1}';
    const secret = "shhh";
    const hmac = createHmac("sha256", secret).update(body, "utf8").digest("base64");
    expect(shopifyWebhookValid(body, secret, hmac)).toBe(true);
    expect(shopifyWebhookValid(body, secret, "bad")).toBe(false);
  });

  it("verifies generic hmac", () => {
    const body = "payload";
    const secret = "s";
    const sig = createHmac("sha256", secret).update(body, "utf8").digest("base64");
    expect(verifyHmacSha256(body, secret, sig)).toBe(true);
  });
});
