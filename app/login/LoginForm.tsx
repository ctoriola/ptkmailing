"use client";

import { useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import type { ErrorBody } from "@/lib/errors";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";

export default function LoginForm({ initialError }: { initialError: ErrorBody | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<ErrorBody | null>(initialError);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await fetchJson("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus("sent");
    } catch (e) {
      setError(toErrorBody(e));
      setStatus("idle");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-semibold">PTK Mailing</h1>
        <p className="mb-4 text-sm text-slate-600">Sign in with your Primetek SSC email.</p>
        {status === "sent" ? (
          <p className="text-sm">Check <b>{email}</b> for a sign-in link. It expires in 15 minutes.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              className="input"
              type="email"
              required
              placeholder="you@primetekssc.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn-primary w-full" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            <ErrorMessage error={error} />
          </form>
        )}
      </div>
    </main>
  );
}
