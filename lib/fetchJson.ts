import type { ErrorBody } from "./errors";

export class RequestError extends Error {
  constructor(public body: ErrorBody) {
    super(body.error);
  }
}

/** POST/GET JSON and throw a RequestError with the server's message, or a sensible fallback. */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new RequestError({ error: "Could not reach the server.", hint: "Check your internet connection.", code: "network" });
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new RequestError(
      body?.error ? body : { error: `Request failed: ${res.status} ${res.statusText}`.trim(), code: `http_${res.status}` },
    );
  }
  return body as T;
}

export function toErrorBody(e: unknown): ErrorBody {
  return e instanceof RequestError ? e.body : { error: (e as Error)?.message || "Something went wrong.", code: "client" };
}
