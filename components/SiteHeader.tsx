import Image from "next/image";
import Link from "next/link";

type Props = { email?: string | null; links?: { href: string; label: string }[]; badge?: string };

export default function SiteHeader({ email, links = [], badge }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-white.png" alt="PrimeTEK SSC" width={120} height={34} priority />
            <span className="hidden border-l border-line pl-3 font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wider sm:inline">
              Mailing{badge && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] text-white">{badge}</span>}
            </span>
          </Link>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium uppercase tracking-wide text-muted transition hover:text-brand-2">
              {l.label}
            </Link>
          ))}
        </div>
        <form action="/api/auth/logout" method="post" className="flex items-center gap-3 text-sm">
          {email && <span className="hidden text-muted md:inline">{email}</span>}
          <button className="btn-ghost px-4 py-2 text-xs">Sign out</button>
        </form>
      </div>
    </header>
  );
}
