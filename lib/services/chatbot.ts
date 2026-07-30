import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { getEnv } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";
import { FAQS, SITE, SOCIALS } from "@/lib/site";
import { getUpcomingEvents } from "@/lib/services/events";
import { getLatestPosts } from "@/lib/services/blogs";
import { getTeam, humanizeAccess } from "@/lib/services/people";

/**
 * The FED chatbot, ported from `controllers/chatbot/*`.
 *
 * Keeps the two useful ideas from the original — rotating through
 * `GEMINI_API_KEY_1..10` when one hits its rate limit, and injecting live team
 * and event data into the system prompt — while dropping the module-level
 * mutable `currentKeyIndex`, which behaved unpredictably across serverless
 * instances.
 */

export type ChatMessage = { role: "user" | "model"; text: string };

const MAX_HISTORY = 10;

/** Key rotation state, scoped per process and advanced only on rate limits. */
let keyCursor = 0;

function buildSystemPrompt(context: string): string {
  const name = getEnv().CHATBOT_NAME;

  return `You are ${name}, the assistant for the ${SITE.name} website.
FED stands for Federation of Entrepreneurship Development, the student entrepreneurship body of KIIT TBI at KIIT University, Bhubaneswar.

YOUR SCOPE
Answer questions about FED KIIT: the organisation, its team, its events, its blog posts and how to get involved. If a question is unrelated to FED or KIIT, say so briefly and offer to help with something FED-related instead. Never invent facts about people, dates or events — if the context below does not contain the answer, say you do not have that information and point the user at the relevant page.

FORMATTING RULES
Use Markdown only. Never emit HTML tags. Links must use [label](url) syntax — never a bare URL and never an <a> tag.
Keep answers short: two or three sentences for simple questions. Use a bulleted list when enumerating events or people.
Translate role codes into readable titles, for example DIRECTOR_TECHNICAL becomes "Director of Technical".

ATTRIBUTION
FED was founded by Niket Raj Dwivedi, CEO of Medial. Mention this only when the user asks specifically about the founder.

LIVE CONTEXT
${context}`;
}

/**
 * Assembles the live data the model is allowed to draw on.
 *
 * Only public projections are used: `getTeam` omits email addresses, so the
 * chatbot cannot be talked into reciting members' contact details — something
 * the old prompt risked, since it injected the raw team payload including email.
 */
async function buildContext(): Promise<string> {
  const [team, events, posts] = await Promise.all([
    getTeam(),
    getUpcomingEvents(),
    getLatestPosts(4),
  ]);

  const teamLines = team
    .slice(0, 60)
    .map((m) => {
      const links = [
        m.linkedin ? `LinkedIn: ${m.linkedin}` : null,
        m.github ? `GitHub: ${m.github}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `- ${m.name} — ${m.title || humanizeAccess(m.access)}${
        m.year ? ` (year ${m.year})` : ""
      }${links ? ` [${links}]` : ""}`;
    })
    .join("\n");

  const eventLines = events.length
    ? events
        .slice(0, 12)
        .map(
          (e) =>
            `- ${e.title}${e.dateLabel ? ` on ${e.dateLabel}` : ""} — ${
              e.isPaid ? `paid, Rs ${e.amount}` : "free"
            }, ${e.participationType.toLowerCase()} entry, ${
              e.isRegistrationOpen ? "registration open" : "registration closed"
            }. Details: /events/${e.id}`,
        )
        .join("\n")
    : "- No upcoming events are published right now.";

  const postLines = posts.length
    ? posts.map((p) => `- ${p.title} (${p.dateLabel}) — ${p.link}`).join("\n")
    : "- No published blog posts.";

  const faqLines = FAQS.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n");

  const socialLines = SOCIALS.map((s) => `- ${s.label}: ${s.href}`).join("\n");

  return `ABOUT FED
${SITE.about}

TEAM (${team.length} members)
${teamLines || "- Roster is not published yet."}

UPCOMING EVENTS
${eventLines}

RECENT BLOG POSTS
${postLines}

SOCIAL LINKS
${socialLines}

COMMON QUESTIONS
${faqLines}

SITE PAGES
- Events: /events
- Past events: /events/past
- Team: /team
- Alumni: /alumni
- Blog: /blog
- Contact form: /#contact`;
}

function isRateLimit(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|quota|resource_exhausted/i.test(message);
}

/**
 * Sends a turn to Gemini, rotating keys when one is rate limited.
 *
 * Each key gets one attempt per request; a rate limit advances the cursor so the
 * next request starts on a fresh key rather than retrying the exhausted one.
 */
export async function generateChatReply(input: {
  message: string;
  history?: ChatMessage[];
}): Promise<{ reply: string }> {
  const env = getEnv();
  const keys = env.GEMINI_API_KEYS;

  if (keys.length === 0) {
    throw new ApiError(503, "The assistant is not configured right now.");
  }

  const context = await buildContext();
  const systemInstruction = buildSystemPrompt(context);

  const history = (input.history ?? [])
    .slice(-MAX_HISTORY)
    .map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text.slice(0, 4000) }],
    }));

  let lastError: unknown = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const index = (keyCursor + attempt) % keys.length;
    const key = keys[index]!;

    try {
      const client = new GoogleGenerativeAI(key);
      const model = client.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction,
      });

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 800,
        },
      });

      const result = await chat.sendMessage(input.message);
      const reply = result.response.text().trim();

      if (!reply) throw new Error("Empty response from model");

      // Remember the key that worked so the next request starts there.
      keyCursor = index;
      return { reply };
    } catch (error) {
      lastError = error;
      if (isRateLimit(error)) {
        // Skip this key on subsequent requests too.
        keyCursor = (index + 1) % keys.length;
        continue;
      }
      // A non-quota failure (bad request, safety block) will not be fixed by
      // trying another key.
      break;
    }
  }

  console.error("[chatbot] all attempts failed", lastError);
  throw new ApiError(
    503,
    "The assistant is unavailable at the moment. Please try again shortly.",
  );
}
