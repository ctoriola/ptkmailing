"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import ErrorMessage from "@/components/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Field, IconInput } from "@/components/ui/Field";
import type { ErrorBody } from "@/lib/errors";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@primetekssc.ng");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorBody | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fetchJson("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      window.location.href = "/admin";
    } catch (err) {
      setError(toErrorBody(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Admin console" subtitle="Sign in with the PrimeTEK SSC administrator account.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email" htmlFor="email">
          <IconInput id="email" icon={Mail} type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <IconInput
            id="password"
            icon={Lock}
            type={show ? "text" : "password"}
            required
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            trailing={
              <Button type="button" variant="ghost" size="sm" iconOnly icon={show ? EyeOff : Eye} onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} />
            }
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} iconRight={ArrowRight}>
          {busy ? "Signing in" : "Sign in"}
        </Button>
        <ErrorMessage error={error} />
      </form>
      <p className="mt-10 border-t border-line pt-6 text-xs text-subtle">
        Not an administrator? <Link href="/login" className="font-medium text-muted hover:text-brand-2">Staff sign-in</Link>
      </p>
    </AuthShell>
  );
}
