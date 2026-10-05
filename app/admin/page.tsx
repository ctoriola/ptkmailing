import Link from "next/link";
import AdminPanel from "@/components/AdminPanel";
import { getSession } from "@/lib/session";

export default async function AdminPage() {
  const session = await getSession();
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold">PTK Mailing · Admin</h1>
            <Link href="/" className="text-sm text-blue-700 hover:underline">Dashboard</Link>
          </div>
          <form action="/api/auth/logout" method="post" className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{session?.email}</span>
            <button className="btn-ghost">Sign out</button>
          </form>
        </div>
      </header>
      <AdminPanel />
    </>
  );
}
