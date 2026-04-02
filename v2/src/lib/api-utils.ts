import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ZodIssue } from "zod";
import { AuthError } from "./auth";
import { RateLimitError } from "./rate-limiter";

/** Standard JSON success response */
export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Standard error response */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap an API handler with error handling */
export function withErrorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: any, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        return NextResponse.json(
          { error: err.message },
          { status: 429, headers: { "Retry-After": String(err.retryAfter) } }
        );
      }
      if (err instanceof AuthError) {
        return errorResponse(err.message, err.status);
      }
      if (err instanceof ZodError) {
        const messages = (err as ZodError).issues.map((e: ZodIssue) => e.message).join(", ");
        return errorResponse(messages, 400);
      }
      console.error("API Error:", err);
      return errorResponse("Internal server error", 500);
    }
  };
}

/** Parse JSON body safely */
export async function parseBody<T>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new AuthError("Invalid JSON body", 400);
  }
}

/** Parse query params from URL */
export function getSearchParams(req: Request) {
  return new URL(req.url).searchParams;
}
