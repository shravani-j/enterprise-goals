"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: string;
  weightage: number;
  updatedAt: string;
}

export function EmployeeDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        console.log("EmployeeDashboard: fetching /api/goals");
        const res = await fetch("/api/goals", { credentials: "include" });
        console.log("EmployeeDashboard: /api/goals status", res.status, res.statusText);
        const data = await res.json();
        console.log("EmployeeDashboard: /api/goals response", data);
        if (res.ok) {
          setGoals(data);
        } else {
          console.error("EmployeeDashboard: /api/goals failed", res.status, data);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeGoals = goals.filter((g) => g.status !== "COMPLETED");
  const overallProgress = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SUBMITTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "RETURNED_FOR_REWORK":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "DRAFT":
        return "bg-zinc-50 text-zinc-700 border-zinc-200";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

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
          <h2 className="text-2xl font-bold tracking-tight">Employee Dashboard</h2>
          <p className="text-zinc-500 text-sm">Track your goals, check-ins, and performance.</p>
        </div>
        <Link
          href="/dashboard/goals"
          className="text-sm font-semibold bg-[var(--color-dijon)] text-white px-4 py-2 rounded-xl shadow-sm hover:bg-[var(--color-dijon)]/95 transition-colors"
        >
          Manage Goals
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-[var(--color-dijon)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length} / 8</div>
            <p className="text-xs text-muted-foreground">Within allowed limit (max 8)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[var(--color-mimosa)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2 [&>div]:bg-[var(--color-dijon)]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goal Weightage</CardTitle>
            <Clock className="h-4 w-4 text-[var(--color-flax)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.reduce((sum, g) => sum + g.weightage, 0)}% / 100%
            </div>
            <p className="text-xs text-muted-foreground">Must be between 10% and 100% total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Current Goals</CardTitle>
            <CardDescription>Your objectives for this quarter.</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No goals added yet. Go to <Link href="/dashboard/goals" className="text-[var(--color-dijon)] hover:underline">Manage Goals</Link> to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex flex-col space-y-2 p-4 border border-zinc-100 bg-white shadow-sm rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{goal.title}</span>
                      <Badge variant="outline" className={getStatusColor(goal.status)}>
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="w-full flex-1"><Progress value={goal.progress} className="h-2 [&>div]:bg-[var(--color-dijon)]" /></span>
                      <span className="w-12 text-right">{goal.progress}%</span>
                      <span className="w-16">Weight: {goal.weightage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your objectives.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4 text-sm">
               {goals.length === 0 ? (
                 <div className="text-zinc-500 italic text-xs py-4">No recent activity.</div>
               ) : (
                 goals.slice(0, 3).map((goal, idx) => (
                   <div key={idx} className="flex items-start gap-4">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--color-dijon)] shrink-0" />
                      <div>
                        <p className="font-medium text-xs">Goal &ldquo;{goal.title}&rdquo; is in state {goal.status}</p>
                        <p className="text-[10px] text-muted-foreground">Last updated: {new Date(goal.updatedAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
