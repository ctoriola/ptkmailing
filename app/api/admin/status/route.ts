import { NextResponse } from "next/server";
import { REQUIRED_ENV, blobStatus } from "@/lib/config";
import { withErrors } from "@/lib/errors";
import { resend } from "@/lib/resend";
import { requireAdmin } from "@/lib/session";

export const GET = withErrors(async () => {
  await requireAdmin();
  const blob = blobStatus();
  const env: Record<string, boolean> = {
    ...Object.fromEntries(REQUIRED_ENV.map((k) => [k, Boolean(process.env[k])])),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
    "Blob store connected": blob.credentials,
    BLOB_WEBHOOK_PUBLIC_KEY: blob.BLOB_WEBHOOK_PUBLIC_KEY,
  };

  let domains: { name: string; status: string }[] = [];
  let resendError: string | null = null;
  if (process.env.RESEND_API_KEY) {
    try {
      const { data, error } = await resend().domains.list();
      if (error) resendError = error.message;
      else domains = (data?.data ?? []).map((d) => ({ name: d.name, status: d.status }));
    } catch (e) {
      resendError = (e as Error).message;
    }
  }

  const mailFrom = process.env.MAIL_FROM || "";
  const fromDomain = mailFrom.match(/@([^>\s]+)/)?.[1] ?? "";
  return NextResponse.json({ env, domains, resendError, fromDomain });
});
