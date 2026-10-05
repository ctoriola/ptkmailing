"use client";

import { useState } from "react";
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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-semibold">PTK Mailing Admin</h1>
        <p className="mb-4 text-sm text-slate-600">Sign in with the admin account.</p>
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
        <p className="mt-4 text-sm"><a className="text-blue-700 hover:underline" href="/login">Staff sign-in</a></p>
      </div>
    </main>
  );
}
