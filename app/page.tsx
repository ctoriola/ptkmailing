import { getSessionEmail } from "@/lib/session";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const email = await getSessionEmail();
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="font-semibold">PTK Mailing</h1>
          <form action="/api/auth/logout" method="post" className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{email}</span>
            <button className="btn-ghost">Sign out</button>
          </form>
        </div>
      </header>
      <Dashboard />
    </>
  );
}
