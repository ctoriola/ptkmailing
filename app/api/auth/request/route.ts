import { NextResponse } from "next/server";
import { allowedDomain, createLoginToken, isAllowedEmail } from "@/lib/auth";
import { AppError, withErrors } from "@/lib/errors";
import { appUrl, brandedEmail } from "@/lib/emailLayout";
import { sendOrThrow } from "@/lib/resend";
import { getSettings } from "@/lib/settings";

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
  const baseUrl = appUrl(req);
  const link = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
  await sendOrThrow({
    to: addr,
    subject: "Your PrimeTEK SSC Mailing sign-in link",
    html: signInEmail(link, baseUrl),
    text: `Sign in to PrimeTEK SSC Mailing (valid for 15 minutes):
${link}

If you didn't request this, you can ignore this email.`,
  }, (await getSettings()).senderName);
  return NextResponse.json({ ok: true });
});

function signInEmail(link: string, baseUrl: string) {
  // Build the branded layout, then swap the escaped placeholder for a real button.
  return brandedEmail({
    text: "Hello,\n\nUse the button below to sign in to PrimeTEK SSC Mailing. The link is valid for 15 minutes.\n\n[[BUTTON]]\n\nIf you didn't request this, you can safely ignore this email.",
    baseUrl,
    preheader: "Your secure sign-in link",
  }).replace(
    "[[BUTTON]]",
    `<a href="${link}" style="display:inline-block;padding:12px 22px;background:#ef5b00;color:#ffffff;border-radius:8px;font-weight:bold;text-decoration:none;">Sign in to Mailing</a>`,
  );
}
