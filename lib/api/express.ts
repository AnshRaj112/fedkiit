import { NextResponse } from "next/server";

import { isApiError } from "@/lib/api/errors";

/**
 * Response helpers that reproduce the Express backend's JSON contract exactly.
 *
 * The ported frontend reads `response.data.events`, `response.data.data`,
 * `response.data.user` and so on, so the envelope shapes must match
 * FED-Backend byte for byte — this is not a place to "improve" the API.
 */

/** Arbitrary JSON body, as the Express controllers returned. */
export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body as Record<string, unknown>, { status });
}

/** Mirrors `errorHandler.js`: { success, message, errors, data }. */
export function expressError(
  status: number,
  message: string,
  errors: unknown[] = [],
): NextResponse {
  return NextResponse.json(
    { success: false, message, errors, data: null },
    { status },
  );
}

/**
 * Wraps a handler so thrown ApiErrors become the same JSON the Express
 * `errorHandler` middleware produced, and anything else becomes a 500.
 */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (isApiError(error)) {
      return expressError(error.statusCode, error.message, error.errors);
    }
    console.error("[api]", error);
    return expressError(500, "Internal Server Error");
  }
}

/** Parses a JSON body, tolerating an empty one like body-parser did. */
export async function body<T = Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}
