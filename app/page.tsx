import Dashboard from "@/components/Dashboard";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  return (
    <>
      <SiteHeader email={session?.email} isAdmin={session?.role === "admin"} />
      <Dashboard />
    </>
  );
}
