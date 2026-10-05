"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, Paperclip, X } from "lucide-react";
import { missingVars, renderText } from "@/lib/template";
import type { Recipient } from "@/lib/types";
import { fileIcon, formatSize } from "./FileDropzone";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

type Props = {
  recipient: Recipient;
  subject: string;
  body: string;
  senderName?: string;
  position: { index: number; total: number };
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

export default function PreviewModal({ recipient: r, subject, body, senderName, position, onPrev, onNext, onClose }: Props) {
  const vars = { ...r.vars, email: r.email };
  const missing = missingVars(subject + body, vars);
  const initials = (senderName || "P").split(/\s+/).map((w) => w[0]).join("").slice(0, 2);

  return (
    <Modal open onClose={onClose} size="lg">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" iconOnly icon={ChevronLeft} onClick={onPrev} disabled={position.index === 0} aria-label="Previous recipient" />
          <span className="min-w-16 text-center text-xs text-muted tabular-nums">{position.index + 1} of {position.total}</span>
          <Button variant="ghost" size="sm" iconOnly icon={ChevronRight} onClick={onNext} disabled={position.index >= position.total - 1} aria-label="Next recipient" />
        </div>
        <span className="text-xs font-medium tracking-wide text-subtle uppercase">Email preview</span>
        <Button variant="ghost" size="sm" iconOnly icon={X} onClick={onClose} aria-label="Close" />
      </div>

      <div className="space-y-4 p-5">
        {missing.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/[0.08] px-3 py-2 text-[13px] text-amber-300">
            <AlertTriangle className="size-4 shrink-0" /> Missing values for: {missing.join(", ")}
          </div>
        )}

        <div className="overflow-hidden rounded-xl bg-white text-neutral-900 shadow-2xl shadow-black/40">
          <div className="h-1 bg-gradient-to-r from-[#f68b08] to-[#ef5b00]" />
          <div className="border-b border-neutral-200 px-6 pt-5 pb-4">
            <h3 className="text-lg leading-snug font-semibold text-neutral-900">
              {renderText(subject, vars) || <span className="text-neutral-400">(no subject)</span>}
            </h3>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#f68b08] to-[#ef5b00] text-xs font-semibold text-white">{initials}</span>
              <div className="min-w-0 text-[13px]">
                <p className="font-semibold">{senderName || "PrimeTEK SSC"}</p>
                <p className="truncate text-neutral-500">to {r.email || "(no email)"}</p>
              </div>
            </div>
          </div>
          <div className="px-6 pt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt="PrimeTEK SSC" width={130} className="h-auto w-[130px]" />
          </div>
          <div className="min-h-40 px-6 py-5 text-[14px] leading-relaxed whitespace-pre-wrap">
            {renderText(body, vars) || <span className="text-neutral-400">(empty message)</span>}
          </div>
          {r.attachments.length > 0 && (
            <div className="border-t border-neutral-200 px-6 py-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                <Paperclip className="size-3.5" /> {r.attachments.length} attachment{r.attachments.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap gap-2">
                {r.attachments.map((a) => {
                  const Icon = fileIcon(a.filename);
                  return (
                    <span key={a.url} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs">
                      <Icon className="size-4 text-[#ef5b00]" />
                      <span className="max-w-48 truncate font-medium">{a.filename}</span>
                      <span className="text-neutral-400">{formatSize(a.size)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
