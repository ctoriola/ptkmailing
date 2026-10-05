import { getJson, putJson } from "./store";

export type Settings = {
  senderName: string;
  replyTo: string; // empty = reply to the staff member who sent it
  defaultSubject: string;
  defaultBody: string;
  signature: string;
};

export const DEFAULT_SETTINGS: Settings = {
  senderName: "PrimeTEK SSC",
  replyTo: "",
  defaultSubject: "",
  defaultBody: "",
  signature: "",
};

const PATH = "admin/settings.json";

export async function getSettings(): Promise<Settings> {
  try {
    return { ...DEFAULT_SETTINGS, ...(await getJson<Partial<Settings>>(PATH)) };
  } catch (e) {
    console.error("Could not load settings; using defaults", e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings) {
  await putJson(PATH, s, { overwrite: true });
}

/** "PrimeTEK SSC <mailing@primetekssc.ng>" from MAIL_FROM (with or without a name) and the sender name. */
export function formatFrom(mailFrom: string, senderName: string) {
  const address = mailFrom.match(/<([^>]+)>/)?.[1] ?? mailFrom.trim();
  const name = senderName.replace(/["<>]/g, "").trim();
  return name ? `${name} <${address}>` : address;
}
