import { getEnv } from "@/lib/env";
import { handle, json } from "@/lib/api/express";

/**
 * GET /api/chatbot/health
 * Port of the health probe in routes/api/chatbot — reports whether any Gemini
 * key is configured, without revealing the keys themselves.
 */
export async function GET() {
  return handle(async () => {
    const env = getEnv();
    const configured = env.GEMINI_API_KEYS.length > 0;

    return json({
      success: configured,
      status: configured ? "ok" : "unconfigured",
      keys: env.GEMINI_API_KEYS.length,
      model: env.GEMINI_MODEL,
    });
  });
}
