import { NextResponse } from "next/server";
import { REQUIRED_ENV } from "@/lib/config";

// Reports which required settings are present (never their values).
export async function GET() {
  const env = Object.fromEntries(REQUIRED_ENV.map((k) => [k, Boolean(process.env[k])]));
  return NextResponse.json({ ok: Object.values(env).every(Boolean), env });
}
