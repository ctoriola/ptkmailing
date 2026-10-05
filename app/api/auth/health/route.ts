import { NextResponse } from "next/server";
import { REQUIRED_ENV, blobStatus } from "@/lib/config";

// Reports which required settings are present (never their values).
export async function GET() {
  const blob = blobStatus();
  const env = {
    ...Object.fromEntries(REQUIRED_ENV.map((k) => [k, Boolean(process.env[k])])),
    BLOB_STORE: blob.credentials,
    BLOB_WEBHOOK_PUBLIC_KEY: blob.BLOB_WEBHOOK_PUBLIC_KEY,
  };
  return NextResponse.json({ ok: Object.values(env).every(Boolean), env });
}
