import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { getEnv } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";

/**
 * Blog authoring aids backed by Gemini.
 *
 * Ports controllers/blog/gemini.js. Metadata is read from the article's
 * OpenGraph tags with a small parser rather than `cheerio` — only a handful of
 * `<meta>` values are needed, which does not justify a DOM library on the
 * server.
 *
 * Key rotation matches lib/services/chatbot.ts: the backend cycles through
 * GEMINI_API_KEY_1..10 when one is rate limited.
 */

let keyCursor = 0;

function isRateLimit(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|rate.?limit|quota|resource_exhausted/i.test(message);
}

/** Runs a one-shot prompt, rotating keys past any that are rate limited. */
async function generate(prompt: string): Promise<string> {
  const env = getEnv();
  const keys = env.GEMINI_API_KEYS;
  if (keys.length === 0) {
    throw new ApiError(503, "The AI helper is not configured right now.");
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const index = (keyCursor + attempt) % keys.length;
    try {
      const client = new GoogleGenerativeAI(keys[index]!);
      const model = client.getGenerativeModel({ model: env.GEMINI_MODEL });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (!text) throw new Error("Empty response from model");
      keyCursor = index;
      return text;
    } catch (error) {
      lastError = error;
      if (isRateLimit(error)) {
        keyCursor = (index + 1) % keys.length;
        continue;
      }
      break;
    }
  }

  console.error("[gemini-blog] all attempts failed", lastError);
  throw new ApiError(503, "The AI helper is unavailable. Please try again.");
}

function assertUrl(link: string): string {
  const value = link?.trim();
  if (!value) throw new ApiError(400, "A blog link is required");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError(400, "That does not look like a valid URL");
  }

  // Only fetch public web pages — this endpoint takes a user-supplied URL and
  // fetches it server-side, so anything else is an SSRF vector into the
  // deployment's private network.
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ApiError(400, "Only http and https links are supported");
  }
  if (
    /^(localhost|\[?::1\]?|0\.0\.0\.0)$/i.test(url.hostname) ||
    /^127\./.test(url.hostname) ||
    /^10\./.test(url.hostname) ||
    /^192\.168\./.test(url.hostname) ||
    /^169\.254\./.test(url.hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)
  ) {
    throw new ApiError(400, "That host is not allowed");
  }

  return url.toString();
}

async function fetchArticle(link: string): Promise<string> {
  const url = assertUrl(link);

  const response = await fetch(url, {
    headers: {
      // Medium serves a stub to unknown agents.
      "User-Agent":
        "Mozilla/5.0 (compatible; FEDKIIT/1.0; +https://www.fedkiit.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12_000),
    redirect: "follow",
  }).catch(() => null);

  if (!response?.ok) {
    throw new ApiError(502, "Could not fetch that article. Check the link.");
  }

  return response.text();
}

/** Reads a `<meta>` value by property or name. */
function meta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return decodeEntities(match[1].trim());
  }
  return null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Strips tags and scripts down to readable prose. */
function textContent(html: string, limit = 12_000): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

/** POST /api/gemini/autofill — metadata for the blog form. */
export async function autofillFromLink(mediumLink: string) {
  const html = await fetchArticle(mediumLink);

  const title =
    meta(html, "og:title") ??
    meta(html, "twitter:title") ??
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ??
    "";

  const description =
    meta(html, "og:description") ?? meta(html, "description") ?? "";

  const thumbnail = meta(html, "og:image") ?? meta(html, "twitter:image") ?? "";

  const author =
    meta(html, "author") ??
    meta(html, "article:author") ??
    meta(html, "twitter:creator")?.replace(/^@/, "") ??
    "";

  const publishedDate =
    meta(html, "article:published_time") ??
    meta(html, "og:article:published_time") ??
    "";

  return {
    title: decodeEntities(title),
    author,
    description,
    thumbnail,
    publishedDate,
  };
}

/** POST /api/gemini/summary — a short meta description for the post. */
export async function summariseLink(mediumLink: string) {
  const html = await fetchArticle(mediumLink);
  const article = textContent(html);

  if (article.length < 200) {
    throw new ApiError(
      422,
      "That page did not return enough text to summarise.",
    );
  }

  const summary = await generate(
    `Write a single-sentence meta description for the article below, for use as a blog card summary on a university entrepreneurship society's website.

Rules:
- One sentence, 140 characters or fewer.
- Plain text only — no quotes, no markdown, no emoji.
- Describe what the article covers; do not editorialise.
- Output only the sentence.

ARTICLE:
${article}`,
  );

  // The model occasionally wraps the sentence in quotes despite the rule.
  return { summary: summary.replace(/^["'\s]+|["'\s]+$/g, "").slice(0, 300) };
}
