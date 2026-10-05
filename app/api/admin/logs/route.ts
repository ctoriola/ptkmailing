import { NextResponse } from "next/server";
import { requireBlob } from "@/lib/config";
import { withErrors } from "@/lib/errors";
import { readSendLogs } from "@/lib/sendLog";
import { requireAdmin } from "@/lib/session";

export const GET = withErrors(async () => {
  await requireAdmin();
  requireBlob();
  return NextResponse.json({ logs: await readSendLogs(100) });
});
