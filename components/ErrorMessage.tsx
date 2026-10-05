"use client";

import { AlertTriangle, Check, Copy } from "lucide-react";
import { useState } from "react";
import type { ErrorBody } from "@/lib/errors";

export default function ErrorMessage({ error }: { error: ErrorBody | null }) {
  const [copied, setCopied] = useState(false);
  if (!error) return null;
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-red-500/25 bg-red-500/[0.07] p-3.5 text-sm animate-fade-in">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-red-200">{error.error}</p>
        {error.hint && <p className="mt-1 text-[13px] text-red-200/70">{error.hint}</p>}
        {error.requestId && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(error.requestId!);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 font-mono text-[11px] text-red-200/80 hover:bg-red-500/20"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            Ref {error.requestId}
          </button>
        )}
      </div>
    </div>
  );
}
