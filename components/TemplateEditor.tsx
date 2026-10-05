"use client";

import { Braces } from "lucide-react";
import { useRef } from "react";
import { Field } from "./ui/Field";

type Props = {
  subject: string;
  body: string;
  onChange: (next: { subject: string; body: string }) => void;
  fields: string[];
  compact?: boolean;
  footer?: React.ReactNode;
};

export default function TemplateEditor({ subject, body, onChange, fields, compact, footer }: Props) {
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastFocused = useRef<"subject" | "body">("body");

  // Insert {{field}} at the cursor of whichever box was last focused.
  function insert(field: string) {
    const token = `{{${field}}}`;
    const target = lastFocused.current;
    const el = target === "subject" ? subjectRef.current : bodyRef.current;
    const value = target === "subject" ? subject : body;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(target === "subject" ? { subject: next, body } : { subject, body: next });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Subject">
        <input
          ref={subjectRef}
          className="input h-10"
          placeholder="e.g. Your documents from PrimeTEK SSC, {{name}}"
          value={subject}
          onFocus={() => (lastFocused.current = "subject")}
          onChange={(e) => onChange({ subject: e.target.value, body })}
        />
      </Field>
      <Field label="Message">
        <div className="overflow-hidden rounded-lg border border-line bg-ink/60 transition focus-within:border-brand/70 focus-within:ring-4 focus-within:ring-brand/15 hover:border-line-strong">
          <textarea
            ref={bodyRef}
            className="block w-full resize-y bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-subtle"
            rows={compact ? 6 : 10}
            placeholder={"Dear {{name}},\n\nPlease find attached…"}
            value={body}
            onFocus={() => (lastFocused.current = "body")}
            onChange={(e) => onChange({ subject, body: e.target.value })}
          />
          <div className="flex flex-wrap items-center gap-1.5 border-t border-line bg-panel-2/60 px-2.5 py-2">
            <span className="mr-1 flex items-center gap-1 text-xs text-subtle">
              <Braces className="size-3.5" /> Insert
            </span>
            {["name", ...fields.filter((f) => f !== "name"), "email"].map((f) => (
              <button
                key={f}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insert(f)}
                className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-muted transition hover:border-brand/50 hover:text-brand-2"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Field>
      {footer}
    </div>
  );
}
