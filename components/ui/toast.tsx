"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; tone: Tone; title: string; description?: string };

const Ctx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export function useToast() {
  return useContext(Ctx);
}

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const colors = { success: "text-emerald-400", error: "text-red-400", info: "text-brand-2" };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-3), { ...t, id }]);
    setTimeout(() => dismiss(id), t.tone === "error" ? 8000 : 4500);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div key={t.id} className="card pointer-events-auto flex items-start gap-3 bg-panel-2 p-3.5 pr-2 animate-slide-up">
              <Icon className={`mt-0.5 size-4 shrink-0 ${colors[t.tone]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] text-muted">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="rounded p-1 text-subtle hover:bg-panel-3 hover:text-fg">
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
