import { Resend } from "resend";

export function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export function mailFrom() {
  const from = process.env.MAIL_FROM;
  if (!from) throw new Error("MAIL_FROM is not set");
  return from;
}
