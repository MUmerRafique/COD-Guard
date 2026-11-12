import { describe, expect, it } from "vitest";
import { computeRiskScore, riskBand, RISK_RULE_VERSION } from "./score";

describe("computeRiskScore", () => {
  it("returns 0-100 bounded score", () => {
    const r = computeRiskScore({
      phoneValid: true,
      codAmount: 1000,
      duplicateRecent: false,
      priorRtoCount: 0,
      addressMissing: false,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.ruleVersion).toBe(RISK_RULE_VERSION);
  });

  it("adds points for invalid phone", () => {
    const r = computeRiskScore({
      phoneValid: false,
      codAmount: 1000,
      duplicateRecent: false,
      priorRtoCount: 0,
      addressMissing: false,
    });
    expect(r.score).toBeGreaterThanOrEqual(25);
  });

  it("caps prior RTO contribution at 30", () => {
    const r = computeRiskScore({
      phoneValid: true,
      codAmount: 1000,
      duplicateRecent: false,
      priorRtoCount: 10,
      addressMissing: false,
    });
    const rtoFactor = r.factors.find((f) => f.id === "prior_rto");
    expect(rtoFactor?.contribution).toBeLessThanOrEqual(30);
  });
});

describe("riskBand", () => {
  it("classifies tiers", () => {
    expect(riskBand(10)).toBe("low");
    expect(riskBand(50)).toBe("medium");
    expect(riskBand(80)).toBe("high");
  });
});
