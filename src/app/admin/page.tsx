import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { ADMIN_COOKIE_NAME, getAdminSessionToken } from "@/lib/adminAuth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (adminCookie !== getAdminSessionToken()) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
