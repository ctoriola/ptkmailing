import { get, list, put } from "@vercel/blob";

/**
 * Small JSON store on top of the project's Vercel Blob store (no extra database).
 * The store's access mode (private/public) isn't known up front, so try the configured
 * one and fall back to the other once.
 */
let access: "public" | "private" = process.env.NEXT_PUBLIC_BLOB_ACCESS === "public" ? "public" : "private";

async function withAccess<T>(fn: (a: "public" | "private") => Promise<T>): Promise<T> {
  try {
    return await fn(access);
  } catch (e) {
    if (!/access|private|public/i.test((e as Error)?.message || "")) throw e;
    access = access === "private" ? "public" : "private";
    return fn(access);
  }
}

export async function putJson(pathname: string, data: unknown, opts: { overwrite?: boolean } = {}) {
  return withAccess((a) =>
    put(pathname, JSON.stringify(data), {
      access: a,
      contentType: "application/json",
      addRandomSuffix: !opts.overwrite,
      allowOverwrite: opts.overwrite,
      cacheControlMaxAge: 60,
    }),
  );
}

export async function getJson<T>(urlOrPathname: string): Promise<T | null> {
  const res = await withAccess((a) => get(urlOrPathname, { access: a, useCache: false })).catch((e) => {
    if (/not found/i.test((e as Error)?.message || "")) return null;
    throw e;
  });
  if (!res?.stream) return null;
  return JSON.parse(await new Response(res.stream).text()) as T;
}

export async function listJson(prefix: string, limit = 50) {
  const { blobs } = await list({ prefix, limit: 1000 });
  return blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, limit);
}
