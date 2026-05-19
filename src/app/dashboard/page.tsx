import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmployeeDashboard } from "@/components/dashboards/EmployeeDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const role = session.user.role;

  if (role === "ADMIN") {
    return <AdminDashboard />;
  }

  if (role === "MANAGER") {
    return <ManagerDashboard />;
  }

  return <EmployeeDashboard />;
}
