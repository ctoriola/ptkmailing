"use client";

import {
  AlertCircle, CheckCircle2, FileSpreadsheet, Mail, Paperclip, Plus, RotateCcw, Send, Sparkles, Tag, Trash2, UserPlus, Users, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ErrorBody } from "@/lib/errors";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";
import { missingVars } from "@/lib/template";
import type { Attachment, Recipient, SendResult } from "@/lib/types";
import ErrorMessage from "./ErrorMessage";
import ImportCsvModal from "./ImportCsvModal";
import PreviewModal from "./PreviewModal";
import RecipientRow from "./RecipientRow";
import TemplateEditor from "./TemplateEditor";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader, PageHeader } from "./ui/Card";
import { EmptyState, Skeleton } from "./ui/EmptyState";
import { Modal } from "./ui/Modal";
import { useToast } from "./ui/toast";

const DRAFT_KEY = "ptk-mailing-draft";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newRecipient(email = "", vars: Record<string, string> = {}): Recipient {
  return { id: crypto.randomUUID(), email, vars, attachments: [], useCustom: false, subject: "", body: "" };
}

type Draft = { fields: string[]; subject: string; body: string; recipients: Recipient[] };

export default function Dashboard() {
  const toast = useToast();
  const [fields, setFields] = useState<string[]>(["name"]);
  const [template, setTemplate] = useState({ subject: "", body: "" });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newField, setNewField] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [triedSend, setTriedSend] = useState(false);
  const [results, setResults] = useState<Record<string, SendResult>>({});
  const [error, setError] = useState<ErrorBody | null>(null);
  const [sendAs, setSendAs] = useState<{ senderName: string; signature: string } | null>(null);

  // Restore the unsent draft on load (or start from the admin's default template), and save it as it changes.
  useEffect(() => {
    (async () => {
      type Shared = { senderName: string; defaultSubject: string; defaultBody: string; signature: string };
      const shared = await fetchJson<Shared>("/api/settings").catch(() => null);
      if (shared) setSendAs({ senderName: shared.senderName, signature: shared.signature });
      let d: Draft | null = null;
      try {
        d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      } catch {}
      if (d) {
        setFields(d.fields);
        setTemplate({ subject: d.subject, body: d.body });
        setRecipients(d.recipients);
      } else {
        setTemplate({ subject: shared?.defaultSubject ?? "", body: shared?.defaultBody ?? "" });
        setRecipients([newRecipient()]);
      }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ fields, ...template, recipients } satisfies Draft));
    } catch {}
  }, [loaded, fields, template, recipients]);

  const update = (id: string, fn: (r: Recipient) => Recipient) =>
    setRecipients((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));

  const issuesById = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const r of recipients) {
      const subject = r.useCustom ? r.subject : template.subject;
      const body = r.useCustom ? r.body : template.body;
      const list: string[] = [];
      if (!r.email) list.push("Add an email address");
      else if (!EMAIL_RE.test(r.email)) list.push("Invalid email address");
      if (r.useCustom && (!subject.trim() || !body.trim())) list.push("Custom message needs a subject and message");
      const missing = missingVars(subject + body, { ...r.vars, email: r.email });
      if (missing.length) list.push(`Missing ${missing.join(", ")}`);
      if (list.length) out[r.id] = list;
    }
    return out;
  }, [recipients, template]);

  const pending = recipients.filter((r) => !results[r.id]?.ok);
  const templateMissing = !template.subject.trim() || !template.body.trim();
  const needsTemplate = pending.some((r) => !r.useCustom);
  const blockers = [
    !pending.length && "Add at least one recipient",
    needsTemplate && templateMissing && "Write a subject and message",
    Object.keys(issuesById).length > 0 && `${Object.keys(issuesById).length} recipient${Object.keys(issuesById).length === 1 ? " needs" : "s need"} attention`,
  ].filter(Boolean) as string[];
  const attachmentCount = pending.reduce((n, r) => n + r.attachments.length, 0);
  const attachmentBytes = pending.reduce((n, r) => n + r.attachments.reduce((m, a) => m + a.size, 0), 0);

  function importRows(rows: Record<string, string>[]) {
    const extra = new Set(fields);
    rows.forEach((row) => Object.keys(row).forEach((k) => k !== "email" && extra.add(k)));
    setFields([...extra]);
    setRecipients((rs) => [
      ...rs.filter((r) => r.email || r.attachments.length),
      ...rows.map(({ email, ...vars }) => newRecipient(email ?? "", vars)),
    ]);
    toast({ tone: "success", title: `Imported ${rows.length} recipient${rows.length === 1 ? "" : "s"}` });
  }

  function addField() {
    const f = newField.trim().toLowerCase().replace(/[^\w.-]/g, "_");
    if (f && f !== "email" && !fields.includes(f)) setFields([...fields, f]);
    setNewField("");
  }

  function requestSend() {
    setTriedSend(true);
    if (blockers.length) {
      toast({ tone: "error", title: "Not ready to send", description: blockers.join(" · ") });
      return;
    }
    setConfirmOpen(true);
  }

  async function send() {
    setConfirmOpen(false);
    setSending(true);
    setError(null);
    try {
      const json = await fetchJson<{ results: SendResult[] }>("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: pending, ...template }),
      });
      const next = { ...results };
      pending.forEach((r, i) => (next[r.id] = json.results[i]));
      setResults(next);
      const ok = json.results.filter((r) => r.ok).length;
      const failed = json.results.length - ok;
      toast(
        failed
          ? { tone: "error", title: `${ok} sent, ${failed} failed`, description: "Failed recipients are highlighted. Fix them and send again." }
          : { tone: "success", title: `${ok} email${ok === 1 ? "" : "s"} sent`, description: "Delivered to the email provider." },
      );
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
    setTriedSend(false);
  }

  function startOver() {
    setRecipients([newRecipient()]);
    setResults({});
    setTriedSend(false);
  }

  const previewIndex = recipients.findIndex((r) => r.id === previewId);
  const preview = recipients[previewIndex];
  const resultList = Object.values(results);
  const sentCount = resultList.filter((r) => r?.ok).length;

  if (!loaded) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6"><Skeleton className="h-80" /><Skeleton className="h-64" /></div>
          <Skeleton className="h-72" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Customer mailing"
        title="Compose & send"
        description="Write one message, personalise it for each customer, attach their documents and send them all at once."
      />

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Step 1 */}
          <Card>
            <CardHeader step={1} title="Compose the message" description="Used for every recipient unless you write a custom message for them." />
            <CardBody>
              <TemplateEditor
                {...template}
                fields={fields}
                onChange={setTemplate}
                footer={
                  sendAs?.signature ? (
                    <p className="flex items-center gap-1.5 text-xs text-subtle">
                      <Sparkles className="size-3.5 text-brand-2" /> Your company signature is added automatically at the end.
                    </p>
                  ) : null
                }
              />
              <div className="mt-5 border-t border-line pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-muted">
                    <Tag className="size-3.5" /> Recipient fields
                  </span>
                  {fields.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-md border border-line bg-panel-2 py-0.5 pr-1 pl-2 text-xs capitalize">
                      {f}
                      <button
                        aria-label={`Remove field ${f}`}
                        className="rounded p-0.5 text-subtle hover:bg-panel-3 hover:text-red-400"
                        onClick={() => setFields(fields.filter((x) => x !== f))}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <form
                    className="flex items-center"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addField();
                    }}
                  >
                    <input className="input h-7 w-32 rounded-r-none text-xs" placeholder="Add a field…" value={newField} onChange={(e) => setNewField(e.target.value)} />
                    <Button type="submit" size="sm" icon={Plus} iconOnly className="h-7 w-7 rounded-l-none border-l-0" aria-label="Add field" disabled={!newField.trim()} />
                  </form>
                </div>
                <p className="mt-2 text-xs text-subtle">Fields like company or invoice number appear as columns for each recipient and can be used in the message.</p>
              </div>
            </CardBody>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader
              step={2}
              title={<>Recipients <span className="ml-1 text-muted tabular-nums">{recipients.length}</span></>}
              description="Add each customer and attach their files."
              actions={
                <>
                  <Button size="sm" icon={FileSpreadsheet} onClick={() => setImportOpen(true)}>Import CSV</Button>
                  <Button size="sm" variant="primary" icon={UserPlus} onClick={() => setRecipients([...recipients, newRecipient()])}>Add recipient</Button>
                </>
              }
            />
            <div className="space-y-4 bg-ink/30 p-4 sm:p-5">
              {recipients.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No recipients yet"
                  description="Add customers one at a time, or import a list from a spreadsheet."
                  action={<Button variant="primary" icon={UserPlus} onClick={() => setRecipients([newRecipient()])}>Add recipient</Button>}
                />
              ) : (
                recipients.map((r, i) => (
                  <RecipientRow
                    key={r.id}
                    index={i}
                    recipient={r}
                    fields={fields}
                    defaults={template}
                    issues={issuesById[r.id] ?? []}
                    showIssues={triedSend}
                    status={results[r.id]}
                    onChange={(next) => update(r.id, () => next)}
                    onAddAttachments={(a: Attachment[]) => update(r.id, (cur) => ({ ...cur, attachments: [...cur.attachments, ...a] }))}
                    onRemove={() => setRecipients(recipients.filter((x) => x.id !== r.id))}
                    onPreview={() => setPreviewId(r.id)}
                  />
                ))
              )}
              {recipients.length > 0 && (
                <button
                  onClick={() => setRecipients([...recipients, newRecipient()])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-3 text-sm text-muted transition hover:border-brand/50 hover:text-brand-2"
                >
                  <Plus className="size-4" /> Add another recipient
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Step 3: summary */}
        <aside className="lg:sticky lg:top-24">
          <Card>
            <CardHeader step={3} title="Review & send" />
            <CardBody className="space-y-4">
              <dl className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted"><Mail className="size-4" /> From</dt>
                  <dd className="truncate font-medium">{sendAs?.senderName ?? "PrimeTEK SSC"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted"><Users className="size-4" /> Recipients</dt>
                  <dd className="font-medium tabular-nums">{pending.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-muted"><Paperclip className="size-4" /> Attachments</dt>
                  <dd className="font-medium tabular-nums">
                    {attachmentCount}
                    {attachmentBytes > 0 && <span className="ml-1 font-normal text-subtle">({(attachmentBytes / 1024 / 1024).toFixed(1)} MB)</span>}
                  </dd>
                </div>
              </dl>

              <div className="h-px bg-line" />

              {blockers.length ? (
                <ul className="space-y-2">
                  {blockers.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13px] text-amber-300/90">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-[13px] text-emerald-400">
                  <CheckCircle2 className="size-4" /> Ready to send
                </p>
              )}

              <Button variant="primary" size="lg" className="w-full" icon={Send} loading={sending} onClick={requestSend} disabled={!pending.length}>
                {sending ? `Sending ${pending.length}…` : `Send ${pending.length} email${pending.length === 1 ? "" : "s"}`}
              </Button>
              <ErrorMessage error={error} />

              {resultList.length > 0 && (
                <div className="rounded-lg border border-line bg-panel-2/60 p-3.5 animate-fade-in">
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="font-medium">Last send</span>
                    <span className="text-muted tabular-nums">{sentCount} / {resultList.length} delivered</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-panel-3">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(sentCount / resultList.length) * 100}%` }} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" icon={Trash2} onClick={clearSent} className="flex-1">Clear sent</Button>
                    <Button size="sm" variant="ghost" icon={RotateCcw} onClick={startOver}>Start over</Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
          <p className="mt-3 px-1 text-xs text-subtle">Your draft is saved automatically in this browser.</p>
        </aside>
      </div>

      <ImportCsvModal open={importOpen} onClose={() => setImportOpen(false)} onImport={importRows} />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
        title={`Send ${pending.length} email${pending.length === 1 ? "" : "s"}?`}
        description="Emails go out immediately and can't be recalled."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Send} onClick={send}>Send now</Button>
          </>
        }
      >
        <dl className="space-y-2.5 p-5 text-[13px]">
          <div className="flex justify-between"><dt className="text-muted">From</dt><dd className="font-medium">{sendAs?.senderName ?? "PrimeTEK SSC"}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Recipients</dt><dd className="font-medium">{pending.length}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Attachments</dt><dd className="font-medium">{attachmentCount}</dd></div>
          <div className="flex justify-between gap-6"><dt className="shrink-0 text-muted">Subject</dt><dd className="truncate font-medium">{template.subject || "Custom per recipient"}</dd></div>
        </dl>
      </Modal>

      {preview && (
        <PreviewModal
          recipient={preview}
          subject={preview.useCustom ? preview.subject : template.subject}
          body={(preview.useCustom ? preview.body : template.body) + (sendAs?.signature ? `\n\n${sendAs.signature}` : "")}
          senderName={sendAs?.senderName}
          position={{ index: previewIndex, total: recipients.length }}
          onPrev={() => setPreviewId(recipients[previewIndex - 1]?.id ?? previewId)}
          onNext={() => setPreviewId(recipients[previewIndex + 1]?.id ?? previewId)}
          onClose={() => setPreviewId(null)}
        />
      )}
    </main>
  );
}
