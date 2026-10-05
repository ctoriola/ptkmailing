import { NextResponse } from "next/server";
import { requireBlob } from "@/lib/config";
import { AppError, withErrors } from "@/lib/errors";
import { requireAdmin } from "@/lib/session";
import { DEFAULT_SETTINGS, getSettings, saveSettings, type Settings } from "@/lib/settings";

export const GET = withErrors(async () => {
  await requireAdmin();
  return NextResponse.json(await getSettings());
});

export const PUT = withErrors(async (req: Request) => {
  await requireAdmin();
  requireBlob();
  const input = (await req.json().catch(() => null)) as Partial<Settings> | null;
  if (!input) throw new AppError(400, "Invalid settings.", undefined, "bad_request");
  const next: Settings = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (typeof input[k] === "string") next[k] = input[k]!.slice(0, 10000);
  }
  if (!next.senderName.trim()) throw new AppError(400, "Sender name can't be empty.", undefined, "bad_request");
  if (next.replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.replyTo)) {
    throw new AppError(400, "Reply-to must be a valid email address (or empty).", undefined, "bad_request");
  }
  await saveSettings(next);
  return NextResponse.json(next);
});
