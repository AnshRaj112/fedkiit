/**
 * Error type carried across the server layer.
 *
 * Mirrors the Express `ApiError` class so the JSON body shape
 * (`{ success, message, errors, data }`) that the old frontend parsed is
 * preserved exactly. Anything thrown that is *not* an ApiError is treated as an
 * unexpected fault and flattened to a 500 without leaking internals.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors: unknown[];
  readonly success = false as const;
  readonly data = null;

  constructor(
    statusCode: number,
    message = "Something went wrong !!",
    errors: unknown[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** Field-level validation failure, shaped for form display. */
export class ValidationError extends ApiError {
  constructor(fieldErrors: Record<string, string[]>) {
    super(422, "Validation failed", [fieldErrors]);
    this.name = "ValidationError";
  }
}
