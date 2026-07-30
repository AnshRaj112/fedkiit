import { body, expressError, handle, json } from "@/lib/api/express";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { generateChatReply, type ChatMessage } from "@/lib/services/chatbot";

/**
 * POST /api/chatbot/message
 * Port of controllers/chatbot/chatbotController.js.
 *
 * Returns `{ success, response }` — chatbotService.js reads `response.success`
 * and `response.response`.
 *
 * Rate limited: the original was open and unthrottled, so a script could burn
 * through all ten rotating Gemini keys.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const { message, conversationHistory } = await body<{
      message?: string;
      conversationHistory?: Array<{ role?: string; text?: string; isUser?: boolean }>;
    }>(request);

    if (!message?.trim()) {
      return expressError(400, "Message is required");
    }

    await enforceRateLimit(RATE_LIMITS.chatbot);

    // The client sends either {role, text} or its own {isUser, text} shape.
    const history: ChatMessage[] = (conversationHistory ?? [])
      .filter((turn) => typeof turn?.text === "string" && turn.text.trim())
      .map((turn) => ({
        role:
          turn.role === "user" || turn.role === "model"
            ? turn.role
            : turn.isUser
              ? "user"
              : "model",
        text: String(turn.text),
      }));

    const { reply } = await generateChatReply({
      message: message.trim(),
      history,
    });

    return json({ success: true, response: reply });
  });
}
