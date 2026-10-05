import { getJson, listJson, putJson } from "./store";

export type SendLogEntry = {
  at: string;
  sender: string;
  total: number;
  sent: number;
  items: { email: string; subject: string; attachments: string[]; ok: boolean; id?: string; error?: string }[];
};

export async function writeSendLog(entry: SendLogEntry) {
  try {
    await putJson(`admin/logs/${entry.at.replace(/[:.]/g, "-")}.json`, entry);
  } catch (e) {
    // Logging must never break sending.
    console.error("Could not write send log", e);
  }
}

export async function readSendLogs(limit = 50) {
  const blobs = await listJson("admin/logs/", limit);
  const entries = await Promise.all(blobs.map((b) => getJson<SendLogEntry>(b.url).catch(() => null)));
  return entries.filter((e): e is SendLogEntry => Boolean(e));
}
