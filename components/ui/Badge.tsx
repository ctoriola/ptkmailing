import { cn } from "./cn";

type Tone = "success" | "warning" | "danger" | "neutral" | "brand";
const tones: Record<Tone, string> = {
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  danger: "bg-red-500/10 text-red-400 ring-red-500/20",
  neutral: "bg-white/5 text-muted ring-white/10",
  brand: "bg-brand/10 text-brand-2 ring-brand/25",
};
const dots: Record<Tone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  neutral: "bg-subtle",
  brand: "bg-brand-2",
};

export function Badge({ tone = "neutral", dot, children, className }: { tone?: Tone; dot?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}>
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}
