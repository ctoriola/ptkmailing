import Image from "next/image";

/** Branded layout for the sign-in pages. */
export default function AuthShell({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center overflow-hidden p-4">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
      <div className="card relative w-full max-w-md p-8">
        <Image src="/logo-white.png" alt="PrimeTEK SSC" width={150} height={43} priority className="mb-8" />
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="text-3xl font-bold uppercase leading-tight">{title}</h1>
        <p className="mb-6 mt-2 text-sm text-muted">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
