import { z } from "zod";

const insightSchema = z.object({
  summary: z.string().max(500),
  suggestions: z.array(z.string().max(200)).max(5),
});

export type AiInsight = z.infer<typeof insightSchema>;

/** Optional AI layer — does not change deterministic risk score. */
export async function fetchOrderInsight(_params: {
  score: number;
  factors: { label: string; contribution: number }[];
}): Promise<{ available: boolean; insight?: AiInsight }> {
  if (!process.env.OPENAI_API_KEY) {
    return { available: false };
  }
  // Boundaries only in v1: return unavailable until full prompt pipeline approved.
  return { available: false };
}
