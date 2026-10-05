"use client";

import { AlertCircle, CheckCircle2, Eye, PenLine, Trash2, XCircle } from "lucide-react";
import type { Attachment, Recipient } from "@/lib/types";
import FileDropzone from "./FileDropzone";
import TemplateEditor from "./TemplateEditor";
import { Button } from "./ui/Button";
import { cn } from "./ui/cn";

type Props = {
  index: number;
  recipient: Recipient;
  fields: string[];
  defaults: { subject: string; body: string };
  issues: string[];
  showIssues: boolean;
  onChange: (r: Recipient) => void;
  onAddAttachments: (a: Attachment[]) => void;
  onRemove: () => void;
  onPreview: () => void;
  status?: { ok: boolean; error?: string };
};

export default function RecipientRow({ index, recipient: r, fields, defaults, issues, showIssues, onChange, onAddAttachments, onRemove, onPreview, status }: Props) {
  const flagged = showIssues && issues.length > 0 && !status;

  return (
    <div
      className={cn(
        "card overflow-hidden animate-slide-up",
        status?.ok && "border-emerald-500/30",
        status && !status.ok && "border-red-500/40",
        flagged && "border-amber-500/40",
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-panel-2/40 px-4 py-2.5">
        <span className="grid size-6 place-items-center rounded-md bg-panel-3 font-mono text-[11px] font-medium text-muted">{index + 1}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {r.vars.name || r.email || <span className="text-subtle">New recipient</span>}
        </span>
        {status ? (
          status.ok ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400"><CheckCircle2 className="size-3.5" /> Sent</span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-red-400"><XCircle className="size-3.5" /> Failed</span>
          )
        ) : (
          r.useCustom && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-2 ring-1 ring-brand/20">Custom message</span>
        )}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={PenLine}
            aria-label="Write a custom message"
            title="Write a custom message"
            className={r.useCustom ? "text-brand-2" : ""}
            onClick={() => onChange({ ...r, useCustom: !r.useCustom, subject: r.subject || defaults.subject, body: r.body || defaults.body })}
          />
          <Button variant="ghost" size="sm" iconOnly icon={Eye} aria-label="Preview" title="Preview" onClick={onPreview} />
          <Button variant="danger" size="sm" iconOnly icon={Trash2} aria-label="Remove recipient" title="Remove" onClick={onRemove} />
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Email address</span>
            <input
              className={cn("input h-9", flagged && issues.some((i) => i.includes("email")) && "border-amber-500/60")}
              type="email"
              placeholder="customer@example.com"
              value={r.email}
              onChange={(e) => onChange({ ...r, email: e.target.value.trim() })}
            />
          </label>
          {fields.map((f) => (
            <label key={f} className="space-y-1.5">
              <span className="text-xs font-medium text-muted capitalize">{f}</span>
              <input
                className="input h-9"
                placeholder={f === "name" ? "Full name" : f}
                value={r.vars[f] ?? ""}
                onChange={(e) => onChange({ ...r, vars: { ...r.vars, [f]: e.target.value } })}
              />
            </label>
          ))}
        </div>

        <FileDropzone
          attachments={r.attachments}
          onAdd={onAddAttachments}
          onRemove={(url) => onChange({ ...r, attachments: r.attachments.filter((x) => x.url !== url) })}
        />

        {r.useCustom && (
          <div className="rounded-lg border border-brand/20 bg-brand/[0.03] p-4">
            <p className="mb-3 text-xs font-medium text-brand-2">Custom message for this recipient</p>
            <TemplateEditor compact subject={r.subject} body={r.body} fields={fields} onChange={(t) => onChange({ ...r, ...t })} />
          </div>
        )}

        {flagged && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-300">
            <AlertCircle className="mt-px size-3.5 shrink-0" />
            <span>{issues.join(" · ")}</span>
          </div>
        )}
        {status && !status.ok && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/[0.07] px-3 py-2 text-xs text-red-300">
            <XCircle className="mt-px size-3.5 shrink-0" />
            <span>{status.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
