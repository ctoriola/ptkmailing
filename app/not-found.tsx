import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-5 grid size-12 place-items-center rounded-xl bg-panel-2 ring-1 ring-line">
        <Compass className="size-5 text-brand-2" />
      </div>
      <p className="eyebrow mb-2">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="mt-6 text-sm font-medium text-brand-2 hover:text-brand">Back to the dashboard</Link>
    </main>
  );
}
