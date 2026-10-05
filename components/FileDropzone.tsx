"use client";

import { uploadPresigned } from "@vercel/blob/client";
import { File, FileImage, FileSpreadsheet, FileText, Loader2, Paperclip, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";
import type { Attachment } from "@/lib/types";
import { cn } from "./ui/cn";

// Must match the Blob store's access setting in Vercel (new stores default to private).
let blobAccess: "public" | "private" = process.env.NEXT_PUBLIC_BLOB_ACCESS === "public" ? "public" : "private";

async function uploadFile(file: File) {
  const send = () => uploadPresigned(`attachments/${file.name}`, file, { access: blobAccess, handleUploadUrl: "/api/upload" });
  try {
    return await send();
  } catch (e) {
    // If the store uses the other access mode, switch once and retry.
    if (!/access|private|public/i.test((e as Error)?.message || "")) throw e;
    blobAccess = blobAccess === "private" ? "public" : "private";
    return send();
  }
}

/** @vercel/blob hides the server's error message; ask /api/upload directly to find out why. */
async function explainUploadError(e: unknown, pathname: string) {
  const msg = (e as Error)?.message || "";
  if (!/client token|presigned/i.test(msg)) return msg || "Upload failed.";
  try {
    await fetchJson("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "blob.generate-presigned-url", payload: { pathname, clientPayload: null, multipart: false } }),
    });
    return msg;
  } catch (err) {
    const b = toErrorBody(err);
    return [b.error, b.hint].filter(Boolean).join(" ");
  }
}

export function formatSize(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(n / 1024))} KB`;
}

export function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "heic"].includes(ext)) return FileImage;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) return FileText;
  return File;
}

type Props = { attachments: Attachment[]; onAdd: (a: Attachment[]) => void; onRemove: (url: string) => void };

export default function FileDropzone({ attachments, onAdd, onRemove }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);

  async function addFiles(files: FileList | File[] | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setError("");
    setPending((p) => [...p, ...list.map((f) => f.name)]);
    const added: Attachment[] = [];
    for (const file of list) {
      try {
        const blob = await uploadFile(file);
        added.push({ url: blob.url, pathname: blob.pathname, filename: file.name, size: file.size });
      } catch (e) {
        setError(`${file.name}: ${await explainUploadError(e, `attachments/${file.name}`)}`);
      } finally {
        setPending((p) => {
          const i = p.indexOf(file.name);
          return i < 0 ? p : [...p.slice(0, i), ...p.slice(i + 1)];
        });
      }
    }
    if (added.length) onAdd(added);
  }

  const hasFiles = attachments.length > 0 || pending.length > 0;

  return (
    <div className="space-y-2">
      {hasFiles && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {attachments.map((a) => {
            const Icon = fileIcon(a.filename);
            return (
              <li key={a.url} className="group flex items-center gap-2.5 rounded-lg border border-line bg-panel-2/60 py-2 pr-1.5 pl-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand/10 ring-1 ring-brand/20">
                  <Icon className="size-4 text-brand-2" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{a.filename}</p>
                  <p className="text-[11px] text-subtle">{formatSize(a.size)}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${a.filename}`}
                  onClick={() => onRemove(a.url)}
                  className="rounded-md p-1.5 text-subtle opacity-70 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
          {pending.map((name, i) => (
            <li key={`${name}-${i}`} className="flex items-center gap-2.5 rounded-lg border border-dashed border-line-strong py-2 pr-2 pl-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-panel-3">
                <Loader2 className="size-4 animate-spin text-muted" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-muted">{name}</p>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-panel-3">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-brand/60" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-dashed px-4 text-[13px] transition",
          hasFiles ? "py-2.5" : "py-5",
          over ? "border-brand bg-brand/5 text-brand-2" : "border-line-strong text-muted hover:border-subtle hover:bg-panel-2/50 hover:text-fg",
        )}
      >
        {hasFiles ? <Paperclip className="size-4" /> : <UploadCloud className="size-5" />}
        <span>
          {over ? "Drop to attach" : <><span className="font-medium text-fg/90">{hasFiles ? "Add more files" : "Attach files"}</span> {!hasFiles && "· drag & drop or click to browse"}</>}
        </span>
        <input
          ref={input}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
