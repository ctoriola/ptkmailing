import { Resend, type CreateEmailOptions } from "resend";
import { requireEnv } from "./config";
import { AppError } from "./errors";
import { DEFAULT_SETTINGS, formatFrom } from "./settings";

export function resend() {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

export function mailFrom() {
  return requireEnv("MAIL_FROM");
}

const HINTS: Record<string, string> = {
  missing_api_key: "Check RESEND_API_KEY in Vercel's environment variables.",
  invalid_api_key: "RESEND_API_KEY is invalid. Create a new key in Resend and update it in Vercel.",
  restricted_api_key: "This Resend API key can't send email. Use a key with sending access.",
  validation_error: "Check that MAIL_FROM uses a domain verified in Resend (Domains → primetekssc.ng).",
  invalid_from_address: "MAIL_FROM must look like: Primetek SSC <mailing@primetekssc.ng>",
  rate_limit_exceeded: "Too many emails at once. Wait a moment and try again.",
  daily_quota_exceeded: "The Resend daily sending quota is used up.",
  monthly_quota_exceeded: "The Resend monthly sending quota is used up.",
};

/** Send through Resend, turning its error responses into AppErrors with actionable hints. */
export async function sendOrThrow(email: Omit<CreateEmailOptions, "from">, senderName = DEFAULT_SETTINGS.senderName) {
  const from = formatFrom(mailFrom(), senderName);
  const { data, error } = await resend().emails.send({ ...email, from } as CreateEmailOptions);
  if (error) {
    const name = (error as { name?: string }).name ?? "resend_error";
    let hint = HINTS[name];
    if (/api key/i.test(error.message)) {
      hint = HINTS.invalid_api_key;
    } else if (/domain.*(not verified|verify)/i.test(error.message)) {
      hint = "Verify primetekssc.ng in Resend and add its SPF/DKIM DNS records.";
    } else if (/testing emails to your own email/i.test(error.message)) {
      hint = "Resend is in test mode. Verify your domain in Resend to send to other addresses.";
    }
    throw new AppError(502, `Email provider error: ${error.message}`, hint, name);
  }
  return data;
}
