import { riskBand } from "@/server/domain/risk/score";

export function RiskBadge({ score }: { score: number }) {
  const band = riskBand(score);
  const styles = {
    low: "bg-emerald-100 text-emerald-800 border-emerald-200",
    medium: "bg-amber-100 text-amber-900 border-amber-200",
    high: "bg-red-100 text-red-800 border-red-200",
  }[band];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}
      title="Risk indicator — not proof of fraud"
    >
      {score} · {band}
    </span>
  );
}
