"use client";

import {
  Activity, AlertTriangle, CheckCircle2, ChevronRight, Clock, Globe, HardDrive, History, Inbox, KeyRound, Lock, Mail,
  RefreshCw, Save, Search, Send, Settings as SettingsIcon, ShieldCheck, Signature, TrendingUp, Users, XCircle,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { ErrorBody } from "@/lib/errors";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";
import type { SendLogEntry } from "@/lib/sendLog";
import type { Settings } from "@/lib/settings";
import ErrorMessage from "./ErrorMessage";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader, PageHeader } from "./ui/Card";
import { cn } from "./ui/cn";
import { EmptyState, Skeleton } from "./ui/EmptyState";
import { Field } from "./ui/Field";
import { Tabs } from "./ui/Tabs";
import { useToast } from "./ui/toast";

type Tab = "history" | "settings" | "status";

function useLoad<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ErrorBody | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchJson<T>(url));
    } catch (e) {
      setError(toErrorBody(e));
    } finally {
      setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, setData, error, loading, reload: load };
}

function relativeTime(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("history");
  const logs = useLoad<{ logs: SendLogEntry[] }>("/api/admin/logs");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Administration" title="Admin console" description="Monitor sending activity, manage defaults for staff and check system health." />
      <Stats logs={logs.data?.logs} loading={logs.loading} />
      <div className="mt-8">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "history", label: "Send history", icon: History },
            { id: "settings", label: "Settings", icon: SettingsIcon },
            { id: "status", label: "System status", icon: Activity },
          ]}
        />
        <div className="pt-6">
          {tab === "history" && <HistoryTab {...logs} />}
          {tab === "settings" && <SettingsTab />}
          {tab === "status" && <StatusTab />}
        </div>
      </div>
    </main>
  );
}

function Stats({ logs, loading }: { logs?: SendLogEntry[]; loading: boolean }) {
  const s = useMemo(() => {
    const since = Date.now() - 30 * 86400_000;
    const recent = (logs ?? []).filter((l) => new Date(l.at).getTime() >= since);
    const total = recent.reduce((n, l) => n + l.total, 0);
    const sent = recent.reduce((n, l) => n + l.sent, 0);
    const senders = new Set(recent.map((l) => l.sender)).size;
    return { sent, rate: total ? Math.round((sent / total) * 100) : null, batches: recent.length, senders, last: logs?.[0]?.at };
  }, [logs]);

  const items = [
    { label: "Emails sent", value: s.sent.toLocaleString(), sub: "Last 30 days", icon: Send },
    { label: "Delivery rate", value: s.rate === null ? "—" : `${s.rate}%`, sub: "Accepted by provider", icon: TrendingUp },
    { label: "Active senders", value: String(s.senders), sub: `${s.batches} batch${s.batches === 1 ? "" : "es"}`, icon: Users },
    { label: "Last activity", value: s.last ? relativeTime(s.last) : "—", sub: s.last ? new Date(s.last).toLocaleString() : "No sends yet", icon: Clock },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, sub, icon: Icon }) => (
        <Card key={label} className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted">{label}</p>
            <Icon className="size-4 text-subtle" />
          </div>
          {loading ? <Skeleton className="mt-3 h-7 w-20" /> : <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">{value}</p>}
          <p className="mt-1 truncate text-xs text-subtle">{sub}</p>
        </Card>
      ))}
    </div>
  );
}

function HistoryTab({ data, error, loading, reload }: ReturnType<typeof useLoad<{ logs: SendLogEntry[] }>>) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "failed">("all");
  const [open, setOpen] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const logs = (data?.logs ?? []).filter(
    (l) =>
      (filter === "all" || l.sent < l.total) &&
      (!q || l.sender.includes(q) || l.items.some((i) => i.email.toLowerCase().includes(q) || i.subject.toLowerCase().includes(q))),
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <input className="input h-9 pl-9" placeholder="Search recipient, sender or subject" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex rounded-lg border border-line bg-ink/60 p-0.5 text-[13px]">
          {(["all", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("rounded-md px-3 py-1.5 transition", filter === f ? "bg-panel-3 font-medium text-fg" : "text-muted hover:text-fg")}
            >
              {f === "all" ? "All" : "With failures"}
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" icon={RefreshCw} onClick={reload} loading={loading}>Refresh</Button>
      </div>

      {error ? (
        <div className="p-4"><ErrorMessage error={error} /></div>
      ) : loading && !data ? (
        <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-11" />)}</div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={data?.logs.length ? "No matching sends" : "No emails sent yet"}
          description={data?.logs.length ? "Try a different search or filter." : "When staff send emails, every batch will appear here with its delivery results."}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-panel-2/50 text-xs text-muted">
              <tr>
                <th className="w-8 py-2.5 pl-4" />
                <th className="px-3 py-2.5 font-medium">Sent</th>
                <th className="px-3 py-2.5 font-medium">Sender</th>
                <th className="px-3 py-2.5 font-medium">Subject</th>
                <th className="px-3 py-2.5 text-right font-medium">Recipients</th>
                <th className="px-4 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const isOpen = open === l.at;
                const failed = l.total - l.sent;
                const subjects = [...new Set(l.items.map((i) => i.subject))];
                return (
                  <Fragment key={l.at}>
                    <tr onClick={() => setOpen(isOpen ? null : l.at)} className={cn("cursor-pointer border-t border-line transition hover:bg-panel-2/60", isOpen && "bg-panel-2/60")}>
                      <td className="py-3 pl-4"><ChevronRight className={cn("size-4 text-subtle transition", isOpen && "rotate-90")} /></td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="font-medium">{relativeTime(l.at)}</p>
                        <p className="text-xs text-subtle">{new Date(l.at).toLocaleString()}</p>
                      </td>
                      <td className="px-3 py-3 text-fg/90">{l.sender}</td>
                      <td className="max-w-72 truncate px-3 py-3 text-muted">{subjects.length > 1 ? `${subjects[0]} +${subjects.length - 1} more` : subjects[0]}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{l.total}</td>
                      <td className="px-4 py-3 text-right">
                        {failed === 0 ? <Badge tone="success" dot>Delivered</Badge> : l.sent === 0 ? <Badge tone="danger" dot>Failed</Badge> : <Badge tone="warning" dot>{failed} failed</Badge>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-ink/40">
                        <td colSpan={6} className="px-4 pt-1 pb-4 sm:pl-12">
                          <div className="overflow-hidden rounded-lg border border-line animate-fade-in">
                            {l.items.map((i, n) => (
                              <div key={n} className={cn("grid gap-1 px-4 py-2.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,14rem)] sm:items-center sm:gap-4", n > 0 && "border-t border-line")}>
                                <span className="truncate font-medium">{i.email}</span>
                                <span className="truncate text-muted">{i.subject}</span>
                                <span className="truncate text-xs text-subtle">{i.attachments.length ? `${i.attachments.length} file${i.attachments.length === 1 ? "" : "s"}: ${i.attachments.join(", ")}` : "No attachments"}</span>
                                <span className="sm:text-right">
                                  {i.ok ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" /> Sent</span>
                                  ) : (
                                    <span className="inline-flex max-w-full items-center gap-1 text-xs text-red-400" title={i.error}><XCircle className="size-3.5 shrink-0" /> <span className="truncate">{i.error || "Failed"}</span></span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function SettingsTab() {
  const toast = useToast();
  const { data, error, loading } = useLoad<Settings>("/api/admin/settings");
  const [draft, setDraft] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ErrorBody | null>(null);
  const [saved, setSaved] = useState<Settings | null>(null);

  const base = saved ?? data;
  const form = draft ?? base;
  const dirty = Boolean(draft && base && JSON.stringify(draft) !== JSON.stringify(base));

  if (loading) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
  if (!form) return <ErrorMessage error={error} />;

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...form, [k]: e.target.value });

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const next = await fetchJson<Settings>("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(next);
      setDraft(null);
      toast({ tone: "success", title: "Settings saved", description: "Staff will see the changes on their next visit." });
    } catch (err) {
      setSaveError(toErrorBody(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <Card>
        <CardHeader icon={Mail} title="Sender identity" description="How emails appear in customers' inboxes." />
        <CardBody className="grid gap-5 md:grid-cols-2">
          <Field label="Sender name" hint="Shown as the “From” name.">
            <input className="input h-10" value={form.senderName} onChange={set("senderName")} required />
          </Field>
          <Field label="Reply-to address" hint="Leave empty to send replies to the staff member who sent the email.">
            <input className="input h-10" type="email" value={form.replyTo} onChange={set("replyTo")} placeholder="info@primetekssc.ng" />
          </Field>
          <div className="flex items-center gap-3 rounded-lg border border-line bg-ink/50 px-4 py-3 md:col-span-2">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-2 to-brand text-xs font-semibold text-white">
              {(form.senderName || "P").split(/\s+/).map((w) => w[0]).join("").slice(0, 2)}
            </span>
            <div className="min-w-0 text-[13px]">
              <p className="font-semibold">{form.senderName || "—"}</p>
              <p className="truncate text-subtle">Replies go to {form.replyTo || "the sender's own address"}</p>
            </div>
            <span className="ml-auto text-xs text-subtle">Inbox preview</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={Inbox} title="Default template" description="Pre-filled for staff when they start a new batch. Placeholders like {{name}} are supported." />
        <CardBody className="space-y-5">
          <Field label="Subject">
            <input className="input h-10" value={form.defaultSubject} onChange={set("defaultSubject")} placeholder="Your documents from PrimeTEK SSC" />
          </Field>
          <Field label="Message">
            <textarea className="input min-h-44 leading-relaxed" value={form.defaultBody} onChange={set("defaultBody")} placeholder={"Dear {{name}},\n\nPlease find attached…"} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={Signature} title="Signature" description="Appended to the end of every email." />
        <CardBody>
          <textarea className="input min-h-32 leading-relaxed" value={form.signature} onChange={set("signature")} placeholder={"Kind regards,\nPrimeTEK Safety & Security Consultants\nwww.primetekssc.ng"} />
        </CardBody>
      </Card>

      <ErrorMessage error={saveError} />

      <div className={cn("fixed inset-x-0 bottom-0 z-30 transition duration-300", dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0")}>
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
          <div className="card flex items-center justify-between gap-4 bg-panel-2/95 px-4 py-3 backdrop-blur">
            <p className="flex items-center gap-2 text-[13px] text-muted"><span className="size-2 rounded-full bg-brand-2" /> You have unsaved changes</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>Discard</Button>
              <Button variant="primary" icon={Save} loading={saving} onClick={save}>Save changes</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type StatusData = { env: Record<string, boolean>; domains: { name: string; status: string }[]; resendError: string | null; fromDomain: string };

const CHECKS: { group: string; icon: React.ComponentType<{ className?: string }>; items: { key: string; label: string; description: string; fix: string }[] }[] = [
  {
    group: "Authentication",
    icon: KeyRound,
    items: [{ key: "AUTH_SECRET", label: "Session signing key", description: "Secures staff sign-in links and sessions.", fix: "Set AUTH_SECRET in Vercel → Settings → Environment Variables." }],
  },
  {
    group: "Email delivery",
    icon: Send,
    items: [
      { key: "RESEND_API_KEY", label: "Email provider connected", description: "Resend API key used to deliver emails.", fix: "Set RESEND_API_KEY from resend.com/api-keys." },
      { key: "MAIL_FROM", label: "Sending address", description: "The address emails are sent from.", fix: "Set MAIL_FROM, e.g. mailing@primetekssc.ng." },
    ],
  },
  {
    group: "File storage",
    icon: HardDrive,
    items: [
      { key: "Blob store connected", label: "Attachment storage", description: "Vercel Blob store for uploaded files and admin data.", fix: "Connect a Blob store in Vercel → Storage." },
      { key: "BLOB_WEBHOOK_PUBLIC_KEY", label: "Upload verification", description: "Verifies browser uploads to the store.", fix: "Reconnect the Blob store so Vercel adds this key." },
    ],
  },
  {
    group: "Admin access",
    icon: Lock,
    items: [{ key: "ADMIN_PASSWORD", label: "Admin password", description: "Protects this admin console.", fix: "Set ADMIN_PASSWORD in Vercel." }],
  },
];

function StatusTab() {
  const { data, error, loading, reload } = useLoad<StatusData>("/api/admin/status");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  useEffect(() => {
    if (data) setCheckedAt(new Date());
  }, [data]);

  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-72" /></div>;
  if (!data) return <ErrorMessage error={error} />;

  const fromDomain = data.domains.find((d) => d.name === data.fromDomain);
  const domainOk = fromDomain?.status === "verified";
  const failing = CHECKS.flatMap((g) => g.items).filter((i) => !data.env[i.key]).length + (domainOk ? 0 : 1);
  const healthy = failing === 0;

  return (
    <div className="space-y-6">
      <div className={cn("card flex flex-wrap items-center gap-4 p-5", healthy ? "border-emerald-500/25" : "border-amber-500/30")}>
        <span className={cn("grid size-11 place-items-center rounded-full ring-1", healthy ? "bg-emerald-500/10 ring-emerald-500/25" : "bg-amber-500/10 ring-amber-500/25")}>
          {healthy ? <ShieldCheck className="size-5 text-emerald-400" /> : <AlertTriangle className="size-5 text-amber-400" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{healthy ? "All systems operational" : `${failing} item${failing === 1 ? " needs" : "s need"} attention`}</h2>
          <p className="text-[13px] text-muted">{healthy ? "Sign-in, email delivery and file storage are configured correctly." : "Some features won't work until these are fixed."}</p>
        </div>
        <div className="flex items-center gap-3">
          {checkedAt && <span className="text-xs text-subtle">Checked {checkedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
          <Button size="sm" icon={RefreshCw} loading={loading} onClick={reload}>Re-check</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {CHECKS.map(({ group, icon, items }) => (
          <Card key={group}>
            <CardHeader icon={icon} title={group} />
            <ul>
              {items.map((i, n) => {
                const ok = data.env[i.key];
                return (
                  <li key={i.key} className={cn("flex items-start gap-3 px-5 py-3.5", n > 0 && "border-t border-line")}>
                    {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-400" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{i.label}</p>
                      <p className="text-[13px] text-muted">{ok ? i.description : i.fix}</p>
                      <p className="mt-1 font-mono text-[11px] text-subtle">{i.key}</p>
                    </div>
                    <Badge tone={ok ? "success" : "danger"}>{ok ? "Configured" : "Missing"}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader icon={Globe} title="Sending domain" description="Customers only receive email from domains verified with the email provider." />
        <ul>
          {data.resendError && (
            <li className="flex items-center gap-3 px-5 py-3.5 text-[13px] text-red-300"><XCircle className="size-4 text-red-400" /> Couldn&apos;t reach the email provider: {data.resendError}</li>
          )}
          {!data.resendError && data.domains.length === 0 && (
            <li className="px-5 py-3.5 text-[13px] text-amber-300">No domains have been added to Resend yet.</li>
          )}
          {data.domains.map((d, n) => (
            <li key={d.name} className={cn("flex items-center gap-3 px-5 py-3.5", n > 0 && "border-t border-line")}>
              <Globe className="size-4 text-subtle" />
              <span className="flex-1 text-sm font-medium">
                {d.name}
                {d.name === data.fromDomain && <span className="ml-2 text-xs font-normal text-subtle">Used for sending</span>}
              </span>
              <Badge tone={d.status === "verified" ? "success" : "warning"} dot>{d.status === "verified" ? "Verified" : d.status}</Badge>
            </li>
          ))}
          {data.fromDomain && !fromDomain && !data.resendError && (
            <li className="flex items-start gap-3 border-t border-line px-5 py-3.5 text-[13px] text-amber-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> The sending address uses {data.fromDomain}, which isn&apos;t added in Resend.
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
