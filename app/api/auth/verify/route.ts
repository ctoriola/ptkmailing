import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions, verifyToken } from "@/lib/auth";
import { AppError } from "@/lib/errors";

export async function GET(req: Request) {
  const url = new URL(req.url);
  try {
    const email = await verifyToken(url.searchParams.get("token") || "", "login");
    if (!email) return NextResponse.redirect(new URL("/login?error=expired", url));
    const res = NextResponse.redirect(new URL("/", url));
    res.cookies.set(SESSION_COOKIE, await createSessionToken(email), sessionCookieOptions);
    return res;
  } catch (e) {
    console.error("Sign-in verification failed", e);
    const code = e instanceof AppError ? e.code : "internal";
    return NextResponse.redirect(new URL(`/login?error=${code}`, url));
  }
}
