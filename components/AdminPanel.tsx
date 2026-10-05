"use client";

import { useCallback, useEffect, useState } from "react";
import type { ErrorBody } from "@/lib/errors";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";
import type { SendLogEntry } from "@/lib/sendLog";
import type { Settings } from "@/lib/settings";
import ErrorMessage from "./ErrorMessage";

type Tab = "history" | "settings" | "status";

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("history");
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <nav className="flex gap-2">
        {(["history", "settings", "status"] as Tab[]).map((t) => (
          <button key={t} className={t === tab ? "btn-primary" : "btn-ghost"} onClick={() => setTab(t)}>
            {{ history: "Send history", settings: "Settings", status: "System status" }[t]}
          </button>
        ))}
      </nav>
      {tab === "history" && <History />}
      {tab === "settings" && <SettingsForm />}
      {tab === "status" && <Status />}
    </main>
  );
}

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

function History() {
  const { data, error, loading, reload } = useLoad<{ logs: SendLogEntry[] }>("/api/admin/logs");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const logs = (data?.logs ?? []).filter(
    (l) => !q || l.sender.includes(q) || l.items.some((i) => i.email.toLowerCase().includes(q) || i.subject.toLowerCase().includes(q)),
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" placeholder="Search by email, sender or subject" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn-ghost" onClick={reload} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
      </div>
      <ErrorMessage error={error} />
      {!loading && !error && logs.length === 0 && <p className="text-sm text-muted">No emails sent yet.</p>}
      {logs.map((l) => (
        <details key={l.at} className="card">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{new Date(l.at).toLocaleString()}</span>
            <span className="text-sm text-muted">by {l.sender}</span>
            <span className={`text-sm font-medium ${l.sent === l.total ? "text-green-400" : "text-amber-300"}`}>
              {l.sent}/{l.total} sent
            </span>
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr><th className="py-1 pr-3">Recipient</th><th className="pr-3">Subject</th><th className="pr-3">Files</th><th>Status</th></tr>
              </thead>
              <tbody>
                {l.items.map((i, n) => (
                  <tr key={n} className="border-t border-line align-top">
                    <td className="py-1 pr-3">{i.email}</td>
                    <td className="pr-3">{i.subject}</td>
                    <td className="pr-3">{i.attachments.join(", ") || "—"}</td>
                    <td className={i.ok ? "text-green-400" : "text-red-400"}>{i.ok ? "Sent" : i.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </section>
  );
}

function SettingsForm() {
  const { data, setData, error, loading } = useLoad<Settings>("/api/admin/settings");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ErrorBody | null>(null);
  const [saved, setSaved] = useState(false);

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!data) return <ErrorMessage error={error} />;

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setData({ ...data, [k]: e.target.value });
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      setData(await fetchJson<Settings>("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }));
      setSaved(true);
    } catch (err) {
      setSaveError(toErrorBody(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card space-y-4">
      <Field label="Sender name" help="Shown as the “From” name in recipients' inboxes.">
        <input className="input" value={data.senderName} onChange={set("senderName")} required />
      </Field>
      <Field label="Reply-to address" help="Leave empty to send replies to the staff member who sent the email.">
        <input className="input" type="email" value={data.replyTo} onChange={set("replyTo")} placeholder="info@primetekssc.ng" />
      </Field>
      <Field label="Default subject" help="Pre-filled for staff when they start a new batch. Placeholders like {{name}} work.">
        <input className="input" value={data.defaultSubject} onChange={set("defaultSubject")} />
      </Field>
      <Field label="Default message">
        <textarea className="input font-mono" rows={7} value={data.defaultBody} onChange={set("defaultBody")} />
      </Field>
      <Field label="Signature" help="Added to the end of every email.">
        <textarea className="input font-mono" rows={4} value={data.signature} onChange={set("signature")} placeholder={"Best regards,\nPrimeTEK SSC"} />
      </Field>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save settings"}</button>
        {saved && <span className="text-sm text-green-400">Saved ✓</span>}
      </div>
      <ErrorMessage error={saveError} />
    </form>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {help && <span className="block text-xs text-muted">{help}</span>}
    </label>
  );
}

type StatusData = { env: Record<string, boolean>; domains: { name: string; status: string }[]; resendError: string | null; fromDomain: string };

function Status() {
  const { data, error, loading, reload } = useLoad<StatusData>("/api/admin/status");
  if (loading) return <p className="text-sm text-muted">Checking…</p>;
  if (!data) return <ErrorMessage error={error} />;
  const fromDomain = data.domains.find((d) => d.name === data.fromDomain);

  return (
    <section className="space-y-4">
      <div className="card">
        <h2 className="mb-2 text-lg font-bold uppercase tracking-wide">Configuration</h2>
        <ul className="space-y-1 text-sm">
          {Object.entries(data.env).map(([k, ok]) => (
            <li key={k}>{ok ? "✅" : "❌"} <code>{k}</code></li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2 className="mb-2 text-lg font-bold uppercase tracking-wide">Email domain (Resend)</h2>
        {data.resendError && <p className="text-sm text-red-400">Could not reach Resend: {data.resendError}</p>}
        {data.domains.length === 0 && !data.resendError && <p className="text-sm text-amber-300">No domains added in Resend yet.</p>}
        <ul className="space-y-1 text-sm">
          {data.domains.map((d) => (
            <li key={d.name}>{d.status === "verified" ? "✅" : "⚠️"} {d.name}: {d.status}</li>
          ))}
        </ul>
        {data.fromDomain && (
          <p className="mt-2 text-sm">
            MAIL_FROM domain <code>{data.fromDomain}</code>:{" "}
            {fromDomain?.status === "verified" ? (
              <span className="text-green-400">verified</span>
            ) : (
              <span className="text-red-400">not verified; emails to customers will fail until it is verified in Resend.</span>
            )}
          </p>
        )}
      </div>
      <button className="btn-ghost" onClick={reload}>Re-check</button>
    </section>
  );
}
