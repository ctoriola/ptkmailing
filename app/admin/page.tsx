import AdminPanel from "@/components/AdminPanel";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/session";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await getSession();
  return (
    <>
      <SiteHeader email={session?.email} isAdmin />
      <AdminPanel />
    </>
  );
}
