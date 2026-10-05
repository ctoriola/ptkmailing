"use client";

import { ChevronDown, LayoutDashboard, LogOut, Send, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "./ui/cn";

export default function SiteHeader({ email, isAdmin }: { email?: string | null; isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const nav = [
    { href: "/", label: "Send", icon: Send },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: LayoutDashboard }] : []),
  ];
  const initials = (email || "?").split("@")[0].split(/[._-]/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-white.png" alt="PrimeTEK SSC" width={104} height={30} priority />
          <span className="hidden h-5 w-px bg-line-strong sm:block" />
          <span className="hidden text-sm font-medium text-muted sm:block">Mailing</span>
        </Link>

        <nav className="flex h-full items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex h-full items-center gap-2 px-3 text-sm font-medium transition",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                <Icon className={cn("size-4", active && "text-brand-2")} />
                {label}
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </nav>

        <div ref={menuRef} className="relative ml-auto">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-2.5 rounded-lg py-1.5 pr-2 pl-1.5 transition hover:bg-panel-2"
          >
            <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand-2 to-brand text-[11px] font-semibold text-white">
              {initials}
            </span>
            <span className="hidden max-w-[200px] truncate text-sm text-fg/90 md:block">{email}</span>
            <ChevronDown className={cn("size-4 text-subtle transition", open && "rotate-180")} />
          </button>
          {open && (
            <div className="card absolute right-0 mt-2 w-64 overflow-hidden bg-panel-2 p-1.5 animate-pop-in">
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium">{email}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  {isAdmin ? <><Shield className="size-3 text-brand-2" /> Administrator</> : "Staff"}
                </p>
              </div>
              <div className="my-1 h-px bg-line" />
              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg/90 hover:bg-panel-3">
                  <LayoutDashboard className="size-4 text-muted" /> Admin console
                </Link>
              )}
              <form action="/api/auth/logout" method="post">
                <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg/90 hover:bg-panel-3">
                  <LogOut className="size-4 text-muted" /> Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
