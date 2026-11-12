import { describe, expect, it } from "vitest";
import { canConsume, PLAN_LIMITS } from "./limits";

describe("plan limits", () => {
  it("enforces order cap", () => {
    const limits = PLAN_LIMITS.starter;
    expect(canConsume(limits, { orders: 499, whatsapp: 0, ai: 0 }, "order")).toBe(true);
    expect(canConsume(limits, { orders: 500, whatsapp: 0, ai: 0 }, "order")).toBe(false);
  });
});
