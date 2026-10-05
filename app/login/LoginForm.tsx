"use client";

import { ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import ErrorMessage from "@/components/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Field, IconInput } from "@/components/ui/Field";
import type { ErrorBody } from "@/lib/errors";
import { fetchJson, toErrorBody } from "@/lib/fetchJson";

export default function LoginForm({ initialError }: { initialError: ErrorBody | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<ErrorBody | null>(initialError);

  async function request(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await fetchJson("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus("sent");
    } catch (err) {
      setError(toErrorBody(err));
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <AuthShell title="Check your inbox" subtitle="We've emailed you a secure sign-in link.">
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25">
              <MailCheck className="size-5 text-emerald-400" />
            </span>
            <div className="text-sm">
              <p>Link sent to <span className="font-medium">{email}</span></p>
              <p className="mt-1 text-muted">It expires in 15 minutes. Check your spam folder if you don&apos;t see it.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm">
          <button onClick={() => setStatus("idle")} className="inline-flex items-center gap-1.5 text-muted hover:text-fg">
            <ArrowLeft className="size-4" /> Use a different email
          </button>
          <button onClick={() => request()} className="font-medium text-brand-2 hover:text-brand">Resend link</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" subtitle="Use your PrimeTEK SSC work email. We'll send you a one-time sign-in link.">
      <form onSubmit={request} className="space-y-5">
        <Field label="Work email" htmlFor="email">
          <IconInput
            id="email"
            icon={Mail}
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="name@primetekssc.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={status === "sending"} iconRight={ArrowRight}>
          {status === "sending" ? "Sending link" : "Continue with email"}
        </Button>
        <ErrorMessage error={error} />
      </form>
      <p className="mt-10 border-t border-line pt-6 text-xs text-subtle">
        Administrator?{" "}
        <Link href="/admin/login" className="font-medium text-muted hover:text-brand-2">Sign in to the admin console</Link>
      </p>
    </AuthShell>
  );
}
