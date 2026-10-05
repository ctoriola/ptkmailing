import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { mailFrom, resend } from "@/lib/resend";
import { getSessionEmail } from "@/lib/session";
import { renderHtml, renderText } from "@/lib/template";
import type { Recipient, SendResult } from "@/lib/types";

export const maxDuration = 60;

type Body = { recipients: Recipient[]; subject: string; body: string; replyTo?: string };

export async function POST(req: Request) {
  const sender = await getSessionEmail();
  if (!sender) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = (await req.json()) as Body;
  const results: SendResult[] = [];
  const blobHost = /\.public\.blob\.vercel-storage\.com$/;

  for (const r of data.recipients) {
    const vars = { ...r.vars, email: r.email };
    const subjectTpl = r.useCustom ? r.subject : data.subject;
    const bodyTpl = r.useCustom ? r.body : data.body;
    try {
      const attachments = await Promise.all(
        r.attachments.map(async (a) => {
          if (!blobHost.test(new URL(a.url).hostname)) throw new Error(`Invalid attachment URL for ${a.filename}`);
          const res = await fetch(a.url);
          if (!res.ok) throw new Error(`Could not load ${a.filename}`);
          return { filename: a.filename, content: Buffer.from(await res.arrayBuffer()) };
        }),
      );
      const { data: sent, error } = await resend().emails.send({
        from: mailFrom(),
        to: r.email,
        replyTo: data.replyTo || sender,
        subject: renderText(subjectTpl, vars),
        html: renderHtml(bodyTpl, vars),
        text: renderText(bodyTpl, vars),
        attachments,
      });
      if (error) throw new Error(error.message);
      results.push({ email: r.email, ok: true, id: sent?.id });
      if (r.attachments.length) await del(r.attachments.map((a) => a.url)).catch(() => {});
    } catch (e) {
      results.push({ email: r.email, ok: false, error: (e as Error).message });
    }
    // Stay under Resend's default rate limit (2 requests/second).
    await new Promise((res) => setTimeout(res, 550));
  }

  return NextResponse.json({ results });
}
