import { NextResponse } from "next/server";
import { withErrors } from "@/lib/errors";
import { getSettings } from "@/lib/settings";

// Settings staff need on the dashboard (default template, sender name, signature).
export const GET = withErrors(async () => {
  const s = await getSettings();
  return NextResponse.json({
    senderName: s.senderName,
    defaultSubject: s.defaultSubject,
    defaultBody: s.defaultBody,
    signature: s.signature,
  });
});
