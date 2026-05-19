"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: string;
  weightage: number;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export function ManagerDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch reports count
        const reportsRes = await fetch("/api/users/reports", { credentials: "include" });
        if (reportsRes.ok) {
          const reports = await reportsRes.json();
          setReportsCount(reports.length);
        }

        // Fetch team goals
        const goalsRes = await fetch("/api/goals", { credentials: "include" });
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json();
          setGoals(goalsData);
        }
      } catch (err) {
        console.error("ManagerDashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter goals of reports (exclude manager's own goals if they have any)
  const reportGoals = goals.filter((g) => g.user.role === "EMPLOYEE");
  
  // Pending approvals are reports' goals in SUBMITTED state
  const pendingApprovals = reportGoals.filter((g) => g.status === "SUBMITTED");
  
  // Team progress is average progress of all reports' goals
  const teamProgress = reportGoals.length
    ? Math.round(reportGoals.reduce((sum, g) => sum + g.progress, 0) / reportGoals.length)
    : 0;

  const onTrackCount = reportGoals.filter((g) => g.progress >= 70).length;
  const atRiskCount = reportGoals.filter((g) => g.progress < 40 && g.progress > 0).length;
  const notStartedCount = reportGoals.filter((g) => g.progress === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-dijon)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manager Dashboard</h2>
          <p className="text-zinc-500 text-sm">Monitor team progress and handle approvals.</p>
        </div>
        <Link
          href="/dashboard/goals"
          className="text-sm font-semibold bg-[var(--color-dijon)] text-white px-4 py-2 rounded-xl shadow-sm hover:bg-[var(--color-dijon)]/95 transition-colors"
        >
          Team Goal Portal
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-[var(--color-dijon)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsCount}</div>
            <p className="text-xs text-muted-foreground">Direct reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-[var(--color-mimosa)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">Goals awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--color-flax)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamProgress}%</div>
            <Progress value={teamProgress} className="mt-2 [&>div]:bg-[var(--color-dijon)]" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Approval Queue</CardTitle>
            <CardDescription>Goals submitted by your team needing review.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No pending goal approvals in queue.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((goal) => (
                  <div key={goal.id} className="flex justify-between items-center p-4 border border-zinc-100 bg-white shadow-sm rounded-lg">
                    <div>
                      <span className="font-semibold text-sm">{goal.title}</span>
                      <p className="text-xs text-muted-foreground">
                        {goal.user.name || goal.user.email} &bull; Weight: {goal.weightage}% &bull; Priority: {goal.updatedAt.split("T")[0]}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href="/dashboard/goals"
                        className="px-3 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-md transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Team Goal Statuses</CardTitle>
            <CardDescription>Visual summary of total employee targets.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">On Track (&ge;70%)</span>
                  <Badge className="bg-[var(--color-dijon)] text-white">{onTrackCount} goals</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">In Progress (40% - 69%)</span>
                  <Badge className="bg-[var(--color-flax)] text-zinc-800">{reportGoals.length - onTrackCount - atRiskCount - notStartedCount} goals</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">At Risk (&lt;40%)</span>
                  <Badge variant="destructive">{atRiskCount} goals</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Not Started</span>
                  <Badge variant="secondary">{notStartedCount} goals</Badge>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
