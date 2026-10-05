import { NextResponse } from "next/server";
import { allowedDomain, createLoginToken, isAllowedEmail } from "@/lib/auth";
import { AppError, withErrors } from "@/lib/errors";
import { sendOrThrow } from "@/lib/resend";

export const POST = withErrors(async (req: Request) => {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const addr = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(addr)) {
    throw new AppError(400, "Enter a valid email address.", undefined, "invalid_email");
  }
  if (!isAllowedEmail(addr)) {
    throw new AppError(403, `Only @${allowedDomain()} addresses can sign in.`, undefined, "domain_not_allowed");
  }
  const token = await createLoginToken(addr);
  const link = `${new URL(req.url).origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  await sendOrThrow({
    to: addr,
    subject: "Your PTK Mailing sign-in link",
    html: `<p>Click to sign in to PTK Mailing (valid for 15 minutes):</p><p><a href="${link}">Sign in</a></p><p>If you didn't request this, ignore this email.</p>`,
  });
  return NextResponse.json({ ok: true });
});
