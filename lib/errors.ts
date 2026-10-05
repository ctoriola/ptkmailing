import { NextResponse } from "next/server";

/** An error whose message is safe to show to the user. */
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public hint?: string,
    public code = "error",
  ) {
    super(message);
  }
}

export type ErrorBody = { error: string; hint?: string; code: string; requestId?: string };

export function errorResponse(e: unknown) {
  const requestId = crypto.randomUUID().slice(0, 8);
  if (e instanceof AppError) {
    console.error(`[${requestId}] ${e.code}: ${e.message}`);
    return NextResponse.json<ErrorBody>(
      { error: e.message, hint: e.hint, code: e.code, requestId },
      { status: e.status },
    );
  }
  console.error(`[${requestId}] Unhandled error`, e);
  return NextResponse.json<ErrorBody>(
    {
      error: "Unexpected server error.",
      hint: `Check the Vercel Runtime Logs for request ${requestId}.`,
      code: "internal",
      requestId,
    },
    { status: 500 },
  );
}

/** Wrap a route handler so every failure becomes a logged JSON error response. */
export function withErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (e) {
      return errorResponse(e);
    }
  };
}
