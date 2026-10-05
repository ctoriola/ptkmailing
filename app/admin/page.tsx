import AdminPanel from "@/components/AdminPanel";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/session";

export default async function AdminPage() {
  const session = await getSession();
  return (
    <>
      <SiteHeader email={session?.email} badge="Admin" links={[{ href: "/", label: "Dashboard" }]} />
      <section className="mx-auto max-w-6xl px-4 pt-8">
        <p className="eyebrow">Administration</p>
        <h1 className="mt-1 text-3xl font-bold uppercase sm:text-4xl">Admin</h1>
      </section>
      <AdminPanel />
    </>
  );
}
