import { Loader2, type LucideIcon } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-2 to-brand text-white shadow-[0_1px_0_0_rgb(255_255_255/0.25)_inset,0_6px_16px_-6px_rgb(239_91_0/0.6)] hover:brightness-110 active:brightness-95",
  secondary: "border border-line-strong bg-panel-2 text-fg hover:border-subtle hover:bg-panel-3",
  ghost: "text-muted hover:bg-panel-2 hover:text-fg",
  danger: "text-red-400 hover:bg-red-500/10 hover:text-red-300",
};
const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-[13px]",
  md: "h-9 gap-2 px-3.5 text-sm",
  lg: "h-11 gap-2 px-5 text-[15px]",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  iconOnly?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "secondary", size = "md", icon: Icon, iconRight: IconRight, loading, iconOnly, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition duration-150 disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        iconOnly && (size === "sm" ? "w-8 px-0" : size === "lg" ? "w-11 px-0" : "w-9 px-0"),
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" strokeWidth={2} />}
      {children}
      {IconRight && !loading && <IconRight className="size-4" strokeWidth={2} />}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin text-muted", className)} />;
}
