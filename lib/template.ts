export type Vars = Record<string, string>;

const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Replace {{key}} with plain-text values (used for subject lines). */
export function renderText(tpl: string, vars: Vars) {
  return tpl.replace(PLACEHOLDER, (m, k) => (k in vars ? vars[k] : m));
}

export function missingVars(tpl: string, vars: Vars) {
  const missing = new Set<string>();
  for (const [, k] of tpl.matchAll(PLACEHOLDER)) if (!(k in vars) || !vars[k]) missing.add(k);
  return [...missing];
}

/** Parse "email,name,company,..." CSV text (first row = headers if it contains "email"). */
export function parseCsv(text: string): Vars[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (l: string) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  let headers = ["email", "name"];
  if (split(lines[0]).some((h) => h.toLowerCase() === "email")) {
    headers = split(lines.shift()!).map((h) => h.toLowerCase());
  }
  return lines.map((l) => {
    const cells = split(l);
    const row: Vars = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}
