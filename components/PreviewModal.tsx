"use client";

import { missingVars, renderText } from "@/lib/template";
import type { Recipient } from "@/lib/types";

type Props = { recipient: Recipient; subject: string; body: string; senderName?: string; onClose: () => void };

export default function PreviewModal({ recipient: r, subject, body, senderName, onClose }: Props) {
  const vars = { ...r.vars, email: r.email };
  const missing = missingVars(subject + body, vars);
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="text-sm">
            {senderName && <div><span className="text-muted">From:</span> {senderName}</div>}
            <div><span className="text-muted">To:</span> {r.email || <i>no email</i>}</div>
            <div className="font-semibold"><span className="font-normal text-muted">Subject:</span> {renderText(subject, vars)}</div>
          </div>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
        {missing.length > 0 && (
          <p className="mb-3 rounded bg-amber-950/40 p-2 text-sm text-amber-300">Missing values: {missing.join(", ")}</p>
        )}
        <div className="whitespace-pre-wrap rounded border border-line p-3 text-sm">{renderText(body, vars)}</div>
        {r.attachments.length > 0 && (
          <p className="mt-3 text-sm text-muted">Attachments: {r.attachments.map((a) => a.filename).join(", ")}</p>
        )}
      </div>
    </div>
  );
}
