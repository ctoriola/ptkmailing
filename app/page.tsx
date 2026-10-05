import Dashboard from "@/components/Dashboard";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  return (
    <>
      <SiteHeader email={session?.email} links={session?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []} />
      <section className="mx-auto max-w-6xl px-4 pt-8">
        <p className="eyebrow">Customer mailing</p>
        <h1 className="mt-1 text-3xl font-bold uppercase sm:text-4xl">Send emails</h1>
      </section>
      <Dashboard />
    </>
  );
}
