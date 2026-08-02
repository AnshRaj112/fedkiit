import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

import { ApiError, isApiError } from "@/lib/api/errors";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: unknown[];
};

export function ok<T>(
  data: T,
  message = "OK",
  init?: ResponseInit,
): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(
    { success: true, message, data },
    { status: 200, ...init },
  );
}

export function created<T>(
  data: T,
  message = "Created",
): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ success: true, message, data }, { status: 201 });
}

export function fail(
  status: number,
  message: string,
  errors: unknown[] = [],
): NextResponse<ApiEnvelope<never>> {
  return NextResponse.json(
    { success: false, message, data: null, errors },
    { status },
  );
}

/**
 * Single place where a thrown error becomes an HTTP response.
 *
 * Replaces the Express `errorHandler` middleware. Route handlers wrap their body
 * in `handleRoute` rather than each one repeating try/catch and inventing its
 * own status codes - which is how the old controllers ended up returning 500s
 * for missing fields.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (isApiError(error)) {
    return fail(error.statusCode, error.message, error.errors);
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return fail(422, "Validation failed", [fieldErrors]);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: unique constraint. Everything else is a genuine server fault.
    if (error.code === "P2002") {
      return fail(409, "That record already exists");
    }
    if (error.code === "P2025") {
      return fail(404, "Record not found");
    }
    console.error("[prisma]", error.code, error.message);
    return fail(500, "Database error");
  }

  console.error("[unhandled]", error);
  return fail(500, "Internal Server Error");
}

/** Wraps a route handler body so every throw lands in `toErrorResponse`. */
export async function handleRoute<T>(
  fn: () => Promise<NextResponse<T>>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Parses a JSON body, converting malformed JSON into a 400 rather than a 500. */
export async function readJson<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
}
