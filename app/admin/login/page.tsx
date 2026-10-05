"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import ErrorMessage from "@/components/ErrorMessage";
import type { ErrorBody } from "@/lib/errors";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@primetekssc.ng");
  const [password, setPassword] = useState("");
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
    <AuthShell eyebrow="Administration" title="Admin sign-in" subtitle="Sign in with the PrimeTEK SSC admin account.">
        <form onSubmit={submit} className="space-y-3">
          <input className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="input"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          <ErrorMessage error={error} />
        </form>
        <p className="mt-6 text-sm"><a className="text-brand-2 hover:underline" href="/login">Staff sign-in</a></p>
    </AuthShell>
  );
}
