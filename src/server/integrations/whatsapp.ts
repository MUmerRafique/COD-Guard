export type ConnectionState = "disconnected" | "misconfigured" | "connected" | "degraded";

export type MessageResult = {
  status: ConnectionState;
  providerMessageId?: string;
  error?: string;
};

/** WhatsApp BSP adapter — safe default when credentials absent. */
export async function sendVerificationMessage(_params: {
  toPhone: string;
  templateName: string;
  linkUrl: string;
}): Promise<MessageResult> {
  if (!process.env.WHATSAPP_API_TOKEN) {
    return { status: "disconnected", error: "WhatsApp not configured" };
  }
  // Provider integration placeholder: do not fabricate delivery.
  return { status: "misconfigured", error: "WhatsApp adapter not fully configured" };
}
