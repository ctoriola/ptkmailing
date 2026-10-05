import { cn } from "./cn";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...rest}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  actions,
  step,
  icon: Icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  step?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {step !== undefined && (
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-semibold text-brand-2 ring-1 ring-brand/30">
            {step}
          </span>
        )}
        {Icon && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-panel-2 ring-1 ring-line">
            <Icon className="size-4 text-muted" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[28px] font-semibold leading-tight text-fg sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
