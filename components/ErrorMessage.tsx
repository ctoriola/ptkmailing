import type { ErrorBody } from "@/lib/errors";

export default function ErrorMessage({ error }: { error: ErrorBody | null }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
      <p className="font-medium">{error.error}</p>
      {error.hint && <p className="mt-1">{error.hint}</p>}
      {error.requestId && <p className="mt-1 text-xs text-red-400">Reference: {error.requestId}</p>}
    </div>
  );
}
