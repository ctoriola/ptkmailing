"use client";

import { missingVars, renderText } from "@/lib/template";
import type { Recipient } from "@/lib/types";

type Props = { recipient: Recipient; subject: string; body: string; onClose: () => void };

export default function PreviewModal({ recipient: r, subject, body, onClose }: Props) {
  const vars = { ...r.vars, email: r.email };
  const missing = missingVars(subject + body, vars);
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="text-sm">
            <div><span className="text-slate-500">To:</span> {r.email || <i>no email</i>}</div>
            <div className="font-semibold"><span className="font-normal text-slate-500">Subject:</span> {renderText(subject, vars)}</div>
          </div>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
        {missing.length > 0 && (
          <p className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-800">Missing values: {missing.join(", ")}</p>
        )}
        <div className="whitespace-pre-wrap rounded border border-slate-200 p-3 text-sm">{renderText(body, vars)}</div>
        {r.attachments.length > 0 && (
          <p className="mt-3 text-sm text-slate-600">Attachments: {r.attachments.map((a) => a.filename).join(", ")}</p>
        )}
      </div>
    </div>
  );
}
