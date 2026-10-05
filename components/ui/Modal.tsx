"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "./Button";
import { cn } from "./cn";

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () => el?.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])') ?? [];
    (focusables()[0] ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = Array.from(focusables());
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "card flex max-h-[92vh] w-full flex-col overflow-hidden rounded-b-none bg-panel outline-none animate-pop-in sm:rounded-xl",
          size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl",
        )}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">{title}</h2>
              {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
            </div>
            <Button variant="ghost" size="sm" iconOnly icon={X} onClick={onClose} aria-label="Close" />
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-panel-2/50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
