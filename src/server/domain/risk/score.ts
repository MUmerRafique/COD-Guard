export const RISK_RULE_VERSION = "v1.0";

export type RiskFactor = {
  id: string;
  label: string;
  weight: number;
  contribution: number;
  detail?: string;
};

export type RiskInput = {
  phoneValid: boolean;
  codAmount: number;
  duplicateRecent: boolean;
  priorRtoCount: number;
  addressMissing: boolean;
};

export type RiskResult = {
  score: number;
  ruleVersion: string;
  factors: RiskFactor[];
};

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Deterministic 0–100 risk score; AI must not modify this output. */
export function computeRiskScore(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = [];
  let total = 0;

  if (!input.phoneValid) {
    const c = 25;
    factors.push({ id: "phone_invalid", label: "Invalid phone format", weight: 25, contribution: c });
    total += c;
  }

  if (input.duplicateRecent) {
    const c = 20;
    factors.push({ id: "duplicate_order", label: "Duplicate recent order", weight: 20, contribution: c });
    total += c;
  }

  if (input.codAmount >= 50000) {
    const c = 25;
    factors.push({
      id: "high_cod_tier_3",
      label: "Very high COD amount",
      weight: 25,
      contribution: c,
      detail: `PKR ${input.codAmount}`,
    });
    total += c;
  } else if (input.codAmount >= 20000) {
    const c = 15;
    factors.push({
      id: "high_cod_tier_2",
      label: "High COD amount",
      weight: 15,
      contribution: c,
      detail: `PKR ${input.codAmount}`,
    });
    total += c;
  } else if (input.codAmount >= 10000) {
    const c = 8;
    factors.push({
      id: "high_cod_tier_1",
      label: "Elevated COD amount",
      weight: 8,
      contribution: c,
      detail: `PKR ${input.codAmount}`,
    });
    total += c;
  }

  if (input.priorRtoCount > 0) {
    const capped = Math.min(30, input.priorRtoCount * 10);
    factors.push({
      id: "prior_rto",
      label: "Prior RTO on this phone (same shop)",
      weight: 30,
      contribution: capped,
      detail: `${input.priorRtoCount} prior`,
    });
    total += capped;
  }

  if (input.addressMissing) {
    const c = 12;
    factors.push({ id: "address_missing", label: "Missing address detail", weight: 12, contribution: c });
    total += c;
  }

  if (factors.length === 0) {
    factors.push({ id: "baseline", label: "No elevated risk signals", weight: 0, contribution: 0 });
  }

  return {
    score: clamp(total),
    ruleVersion: RISK_RULE_VERSION,
    factors,
  };
}

export function riskBand(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
