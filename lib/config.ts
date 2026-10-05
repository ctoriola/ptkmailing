import { AppError } from "./errors";

export const REQUIRED_ENV = ["AUTH_SECRET", "RESEND_API_KEY", "MAIL_FROM"] as const;

function missingEnv(name: string): never {
  throw new AppError(
    500,
    `Server is not configured: ${name} is missing.`,
    "Set it in Vercel → Settings → Environment Variables, then redeploy.",
    "missing_env",
  );
}

export function requireEnv(name: (typeof REQUIRED_ENV)[number]) {
  return process.env[name] || missingEnv(name);
}

/**
 * Vercel Blob credentials. Newer stores connect with BLOB_STORE_ID (auth via Vercel's
 * OIDC token at runtime); older ones with BLOB_READ_WRITE_TOKEN. Presigned uploads
 * also need BLOB_WEBHOOK_PUBLIC_KEY, which Vercel adds when the store is connected.
 */
export function blobStatus() {
  return {
    credentials: Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN),
    BLOB_WEBHOOK_PUBLIC_KEY: Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY),
  };
}

export function requireBlob() {
  const s = blobStatus();
  if (!s.credentials) {
    throw new AppError(
      500,
      "Server is not configured: no Vercel Blob store is connected.",
      "In Vercel, open Storage → your Blob store → Connect Project, then redeploy.",
      "missing_env",
    );
  }
  if (!s.BLOB_WEBHOOK_PUBLIC_KEY) missingEnv("BLOB_WEBHOOK_PUBLIC_KEY");
}
