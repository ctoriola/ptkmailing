import { AppError } from "./errors";

export const REQUIRED_ENV = ["AUTH_SECRET", "RESEND_API_KEY", "MAIL_FROM", "BLOB_READ_WRITE_TOKEN"] as const;

export function requireEnv(name: (typeof REQUIRED_ENV)[number]) {
  const value = process.env[name];
  if (!value) {
    throw new AppError(
      500,
      `Server is not configured: ${name} is missing.`,
      "Set it in Vercel → Settings → Environment Variables, then redeploy.",
      "missing_env",
    );
  }
  return value;
}
