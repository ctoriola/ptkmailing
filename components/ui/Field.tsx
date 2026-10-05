import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export function Field({ label, hint, error, children, className, htmlFor }: { label?: string; hint?: React.ReactNode; error?: string; children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label htmlFor={htmlFor} className="block text-[13px] font-medium text-fg/90">{label}</label>}
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}

export function IconInput({ icon: Icon, className, trailing, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon; trailing?: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <input className={cn("input h-11 pl-9", trailing ? "pr-10" : "", className)} {...rest} />
      {trailing && <div className="absolute top-1/2 right-1.5 -translate-y-1/2">{trailing}</div>}
    </div>
  );
}
