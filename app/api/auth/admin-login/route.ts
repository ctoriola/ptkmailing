import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, adminEmail, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { AppError, withErrors } from "@/lib/errors";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const POST = withErrors(async (req: Request) => {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new AppError(
      500,
      "Server is not configured: ADMIN_PASSWORD is missing.",
      "Set it in Vercel → Settings → Environment Variables, then redeploy.",
      "missing_env",
    );
  }
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const ok = (email || "").trim().toLowerCase() === adminEmail() && safeEqual(password || "", expected);
  if (!ok) {
    // Slow down password guessing.
    await new Promise((r) => setTimeout(r, 1000));
    throw new AppError(401, "Incorrect admin email or password.", undefined, "bad_credentials");
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(adminEmail(), "admin"), sessionCookieOptions);
  return res;
});
