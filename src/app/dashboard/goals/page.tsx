import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GoalPortal } from "@/components/goals/GoalPortal";

export const metadata = {
  title: "My Goals | EnterpriseGoals Portal",
  description: "Set, track, and complete your quarterly objectives and career targets.",
};

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return <GoalPortal />;
}
