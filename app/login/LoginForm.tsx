"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
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
    <AuthShell eyebrow="Staff portal" title="Mailing dashboard" subtitle="Sign in with your PrimeTEK SSC email. We'll send you a secure sign-in link.">
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
    </AuthShell>
  );
}
