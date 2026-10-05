"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";
import type { Attachment, Recipient } from "@/lib/types";
import TemplateEditor from "./TemplateEditor";

type Props = {
  index: number;
  recipient: Recipient;
  fields: string[];
  defaults: { subject: string; body: string };
  onChange: (r: Recipient) => void;
  onAddAttachments: (a: Attachment[]) => void;
  onRemove: () => void;
  onPreview: () => void;
  status?: { ok: boolean; error?: string };
};

/** @vercel/blob hides the server's error message; ask /api/upload directly to find out why. */
async function explainUploadError(e: unknown, pathname: string) {
  const msg = (e as Error)?.message || "";
  if (!/client token/i.test(msg)) return msg || "Upload failed.";
  try {
    await fetchJson("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "blob.generate-client-token", payload: { pathname, clientPayload: null, multipart: false } }),
    });
    return msg;
  } catch (err) {
    const b = toErrorBody(err);
    return [b.error, b.hint].filter(Boolean).join(" ");
  }
}

function formatSize(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
}

export default function RecipientRow({ index, recipient: r, fields, defaults, onChange, onAddAttachments, onRemove, onPreview, status }: Props) {
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError("");
    setUploading((n) => n + files.length);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const blob = await upload(`attachments/${file.name}`, file, { access: "public", handleUploadUrl: "/api/upload" });
        added.push({ url: blob.url, pathname: blob.pathname, filename: file.name, size: file.size });
      } catch (e) {
        setUploadError(`${file.name}: ${await explainUploadError(e, `attachments/${file.name}`)}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length) onAddAttachments(added);
  }

  return (
    <div className={`card space-y-3 ${status ? (status.ok ? "border-green-400" : "border-red-400") : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">#{index + 1}</span>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={onPreview}>Preview</button>
          <button type="button" className="btn-ghost text-red-700" onClick={onRemove}>Remove</button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="input"
          type="email"
          placeholder="customer@example.com"
          value={r.email}
          onChange={(e) => onChange({ ...r, email: e.target.value.trim() })}
        />
        {fields.map((f) => (
          <input
            key={f}
            className="input"
            placeholder={f}
            value={r.vars[f] ?? ""}
            onChange={(e) => onChange({ ...r, vars: { ...r.vars, [f]: e.target.value } })}
          />
        ))}
      </div>

      <div>
        <label className="btn-ghost cursor-pointer">
          Attach files
          <input type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </label>
        {uploading > 0 && <span className="ml-3 text-sm text-slate-500">Uploading {uploading}…</span>}
        {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
        {r.attachments.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {r.attachments.map((a) => (
              <li key={a.url} className="flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-xs">
                {a.filename} <span className="text-slate-500">{formatSize(a.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${a.filename}`}
                  className="text-slate-500 hover:text-red-600"
                  onClick={() => onChange({ ...r, attachments: r.attachments.filter((x) => x.url !== a.url) })}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={r.useCustom}
          onChange={(e) =>
            onChange({
              ...r,
              useCustom: e.target.checked,
              subject: r.subject || defaults.subject,
              body: r.body || defaults.body,
            })
          }
        />
        Write a custom email for this recipient
      </label>
      {r.useCustom && (
        <TemplateEditor compact subject={r.subject} body={r.body} fields={fields} onChange={(t) => onChange({ ...r, ...t })} />
      )}

      {status && (
        <p className={`text-sm ${status.ok ? "text-green-700" : "text-red-600"}`}>
          {status.ok ? "Sent ✓" : `Failed: ${status.error}`}
        </p>
      )}
    </div>
  );
}
