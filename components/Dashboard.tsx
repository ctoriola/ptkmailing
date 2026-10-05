"use client";

import { useEffect, useMemo, useState } from "react";
import type { ErrorBody } from "@/lib/errors";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";
import { missingVars, parseCsv } from "@/lib/template";
import ErrorMessage from "./ErrorMessage";
import type { Attachment, Recipient, SendResult } from "@/lib/types";
import PreviewModal from "./PreviewModal";
import RecipientRow from "./RecipientRow";
import TemplateEditor from "./TemplateEditor";

const DRAFT_KEY = "ptk-mailing-draft";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newRecipient(email = "", vars: Record<string, string> = {}): Recipient {
  return { id: crypto.randomUUID(), email, vars, attachments: [], useCustom: false, subject: "", body: "" };
}

type Draft = { fields: string[]; subject: string; body: string; recipients: Recipient[] };

export default function Dashboard() {
  const [fields, setFields] = useState<string[]>(["name"]);
  const [template, setTemplate] = useState({ subject: "", body: "" });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [csv, setCsv] = useState("");
  const [newField, setNewField] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Record<string, SendResult>>({});
  const [error, setError] = useState<ErrorBody | null>(null);

  // Restore the unsent draft on load, and save it as it changes.
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Draft | null;
      if (d) {
        setFields(d.fields);
        setTemplate({ subject: d.subject, body: d.body });
        setRecipients(d.recipients);
      } else setRecipients([newRecipient()]);
    } catch {
      setRecipients([newRecipient()]);
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ fields, ...template, recipients } satisfies Draft));
    } catch {}
  }, [loaded, fields, template, recipients]);

  const update = (id: string, fn: (r: Recipient) => Recipient) =>
    setRecipients((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));

  const problems = useMemo(() => {
    const out: string[] = [];
    if (!recipients.length) out.push("Add at least one recipient.");
    recipients.forEach((r, i) => {
      const subject = r.useCustom ? r.subject : template.subject;
      const body = r.useCustom ? r.body : template.body;
      if (!EMAIL_RE.test(r.email)) out.push(`#${i + 1}: invalid email address.`);
      if (!subject.trim() || !body.trim()) out.push(`#${i + 1}: subject and message are required.`);
      const missing = missingVars(subject + body, { ...r.vars, email: r.email });
      if (missing.length) out.push(`#${i + 1}: missing ${missing.join(", ")}.`);
    });
    return out;
  }, [recipients, template]);

  function importCsv() {
    const rows = parseCsv(csv);
    if (!rows.length) return;
    const extra = new Set(fields);
    rows.forEach((row) => Object.keys(row).forEach((k) => k !== "email" && extra.add(k)));
    setFields([...extra]);
    setRecipients((rs) => [
      ...rs.filter((r) => r.email || r.attachments.length),
      ...rows.map(({ email, ...vars }) => newRecipient(email ?? "", vars)),
    ]);
    setCsv("");
  }

  function addField() {
    const f = newField.trim().toLowerCase().replace(/[^\w.-]/g, "_");
    if (f && f !== "email" && !fields.includes(f)) setFields([...fields, f]);
    setNewField("");
  }

  async function send() {
    if (problems.length) return;
    if (!confirm(`Send ${recipients.length} email(s)?`)) return;
    setSending(true);
    setError(null);
    try {
      const json = await fetchJson<{ results: SendResult[] }>("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, ...template }),
      });
      const byEmail: Record<string, SendResult> = {};
      recipients.forEach((r, i) => (byEmail[r.id] = json.results[i]));
      setResults(byEmail);
    } catch (e) {
      setError(toErrorBody(e));
    } finally {
      setSending(false);
    }
  }

  function clearSent() {
    setRecipients((rs) => {
      const left = rs.filter((r) => !results[r.id]?.ok);
      return left.length ? left : [newRecipient()];
    });
    setResults({});
  }

  const preview = recipients.find((r) => r.id === previewId);
  const sentCount = Object.values(results).filter((r) => r?.ok).length;

  if (!loaded) return null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4">
      <section className="card space-y-3">
        <h2 className="font-semibold">Default email</h2>
        <p className="text-sm text-slate-600">
          Used for every recipient unless you write a custom email for them. Placeholders are filled from each recipient&apos;s fields.
        </p>
        <TemplateEditor {...template} fields={fields} onChange={setTemplate} />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-600">Fields:</span>
          {fields.map((f) => (
            <span key={f} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1">
              {f}
              <button aria-label={`Remove field ${f}`} className="text-slate-500 hover:text-red-600" onClick={() => setFields(fields.filter((x) => x !== f))}>✕</button>
            </span>
          ))}
          <input
            className="input w-36"
            placeholder="new field"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addField()}
          />
          <button className="btn-ghost" onClick={addField}>Add field</button>
        </div>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Bulk add from CSV</h2>
        <p className="text-sm text-slate-600">
          Paste rows like <code>email,name,company</code>. A header row with an &quot;email&quot; column sets the field names.
        </p>
        <textarea className="input font-mono" rows={3} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"email,name\nada@example.com,Ada"} />
        <button className="btn-ghost" onClick={importCsv} disabled={!csv.trim()}>Import</button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recipients ({recipients.length})</h2>
          <button className="btn-ghost" onClick={() => setRecipients([...recipients, newRecipient()])}>+ Add recipient</button>
        </div>
        {recipients.map((r, i) => (
          <RecipientRow
            key={r.id}
            index={i}
            recipient={r}
            fields={fields}
            defaults={template}
            status={results[r.id]}
            onChange={(next) => update(r.id, () => next)}
            onAddAttachments={(a: Attachment[]) => update(r.id, (cur) => ({ ...cur, attachments: [...cur.attachments, ...a] }))}
            onRemove={() => setRecipients(recipients.filter((x) => x.id !== r.id))}
            onPreview={() => setPreviewId(r.id)}
          />
        ))}
      </section>

      <section className="card sticky bottom-4 space-y-2">
        {problems.length > 0 && (
          <ul className="max-h-24 overflow-auto text-sm text-amber-800">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
        <ErrorMessage error={error} />
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" disabled={sending || problems.length > 0} onClick={send}>
            {sending ? "Sending…" : `Send ${recipients.length} email${recipients.length === 1 ? "" : "s"}`}
          </button>
          {Object.keys(results).length > 0 && (
            <>
              <span className="text-sm">{sentCount} of {Object.keys(results).length} sent.</span>
              <button className="btn-ghost" onClick={clearSent}>Clear sent recipients</button>
            </>
          )}
        </div>
      </section>

      {preview && (
        <PreviewModal
          recipient={preview}
          subject={preview.useCustom ? preview.subject : template.subject}
          body={preview.useCustom ? preview.body : template.body}
          onClose={() => setPreviewId(null)}
        />
      )}
    </main>
  );
}
