import { NextResponse } from "next/server";
import { createLoginToken, isAllowedEmail } from "@/lib/auth";
import { mailFrom, resend } from "@/lib/resend";

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const addr = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(addr) || !isAllowedEmail(addr)) {
    return NextResponse.json({ error: "Only company email addresses can sign in." }, { status: 403 });
  }
  const token = await createLoginToken(addr);
  const link = `${new URL(req.url).origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const { error } = await resend().emails.send({
    from: mailFrom(),
    to: addr,
    subject: "Your PTK Mailing sign-in link",
    html: `<p>Click to sign in to PTK Mailing (valid for 15 minutes):</p><p><a href="${link}">Sign in</a></p><p>If you didn't request this, ignore this email.</p>`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}
