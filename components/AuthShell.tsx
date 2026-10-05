import { FileStack, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";

/** Split-screen branded layout for the sign-in pages. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-line bg-panel lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.035)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]" />
        <div aria-hidden className="absolute -top-32 -left-24 size-[32rem] rounded-full bg-brand/20 blur-[120px]" />
        <Image src="/logo-white.png" alt="PrimeTEK SSC" width={150} height={43} priority className="relative" />
        <div className="relative max-w-md">
          <p className="eyebrow mb-4">Safety &amp; Security Consultants</p>
          <h2 className="text-4xl leading-[1.1] font-semibold">
            Customer correspondence, <span className="text-brand-2">delivered with precision.</span>
          </h2>
          <ul className="mt-10 space-y-4 text-sm text-muted">
            {[
              { icon: Users, text: "Send personalised emails to many customers at once" },
              { icon: FileStack, text: "Attach the right documents to each recipient" },
              { icon: ShieldCheck, text: "Restricted to PrimeTEK SSC staff" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Icon className="size-4 text-brand-2" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-subtle">Internal tool · Authorised personnel only</p>
      </aside>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[380px] animate-slide-up">
          <Image src="/logo-white.png" alt="PrimeTEK SSC" width={130} height={37} priority className="mb-10 lg:hidden" />
          <h1 className="text-[26px] font-semibold">{title}</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
