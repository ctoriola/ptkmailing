import type { ErrorBody } from "@/lib/errors";
import LoginForm from "./LoginForm";

const MESSAGES: Record<string, ErrorBody> = {
  expired: { error: "That sign-in link has expired or is invalid.", hint: "Request a new one below.", code: "expired" },
  missing_env: {
    error: "The server is missing required settings.",
    hint: "An admin needs to check the environment variables in Vercel (see /api/auth/health).",
    code: "missing_env",
  },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const initial = error ? MESSAGES[error] ?? { error: "Sign-in failed. Please try again.", code: error } : null;
  return <LoginForm initialError={initial} />;
}
