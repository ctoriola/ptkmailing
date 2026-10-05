"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; icon?: LucideIcon; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map(({ id, label, icon: Icon, count }) => {
        const active = id === value;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              "relative -mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition",
              active ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {Icon && <Icon className={cn("size-4", active ? "text-brand-2" : "")} />}
            {label}
            {count !== undefined && <span className="rounded-full bg-panel-3 px-1.5 text-[11px] text-muted">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
