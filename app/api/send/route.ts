import { del, get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/config";
import { AppError, withErrors } from "@/lib/errors";
import { sendOrThrow } from "@/lib/resend";
import { writeSendLog, type SendLogEntry } from "@/lib/sendLog";
import { getSessionEmail } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { appUrl, brandedEmail } from "@/lib/emailLayout";
import { renderText } from "@/lib/template";
import type { Recipient, SendResult } from "@/lib/types";

export const maxDuration = 60;

type Body = { recipients: Recipient[]; subject: string; body: string };

export const POST = withErrors(async (req: Request) => {
  const sender = await getSessionEmail();
  if (!sender) throw new AppError(401, "Your session has expired. Sign in again.", undefined, "unauthorized");
  // Fail the whole batch up front if the server is misconfigured.
  requireEnv("RESEND_API_KEY");
  requireEnv("MAIL_FROM");

  const data = (await req.json().catch(() => null)) as Body | null;
  if (!data?.recipients?.length) throw new AppError(400, "No recipients to send to.", undefined, "no_recipients");
  const settings = await getSettings();
  const baseUrl = appUrl(req);
  const results: SendResult[] = [];
  const log: SendLogEntry["items"] = [];
  const blobHost = /\.blob\.vercel-storage\.com$/;

  for (const r of data.recipients) {
    const vars = { ...r.vars, email: r.email };
    const subjectTpl = r.useCustom ? r.subject : data.subject;
    const bodyTpl = (r.useCustom ? r.body : data.body) + (settings.signature ? `\n\n${settings.signature}` : "");
    const subject = renderText(subjectTpl, vars);
    const attachmentNames = r.attachments.map((a) => a.filename);
    try {
      const attachments = await Promise.all(
        r.attachments.map(async (a) => {
          const host = new URL(a.url).hostname;
          if (!blobHost.test(host)) throw new AppError(400, `Invalid attachment URL for ${a.filename}.`);
          const access = host.includes(".private.") ? "private" : "public";
          const blob = await get(a.url, { access }).catch(() => null);
          if (!blob?.stream) throw new AppError(502, `Could not load attachment ${a.filename}.`, "Try removing and re-attaching the file.");
          return { filename: a.filename, content: Buffer.from(await new Response(blob.stream).arrayBuffer()) };
        }),
      );
      const sent = await sendOrThrow({
        to: r.email,
        replyTo: settings.replyTo || sender,
        subject,
        html: brandedEmail({ text: renderText(bodyTpl, vars), baseUrl, preheader: subject }),
        text: renderText(bodyTpl, vars),
        attachments,
      }, settings.senderName);
      results.push({ email: r.email, ok: true, id: sent?.id });
      log.push({ email: r.email, subject, attachments: attachmentNames, ok: true, id: sent?.id });
      if (r.attachments.length) await del(r.attachments.map((a) => a.url)).catch(() => {});
    } catch (e) {
      const err = e as AppError;
      console.error(`Send to ${r.email} failed:`, err);
      const error = err.hint ? `${err.message} ${err.hint}` : err.message;
      results.push({ email: r.email, ok: false, error });
      log.push({ email: r.email, subject, attachments: attachmentNames, ok: false, error });
    }
    // Stay under Resend's default rate limit (2 requests/second).
    await new Promise((res) => setTimeout(res, 550));
  }

  await writeSendLog({
    at: new Date().toISOString(),
    sender,
    total: results.length,
    sent: results.filter((r) => r.ok).length,
    items: log,
  });
  return NextResponse.json({ results });
});
