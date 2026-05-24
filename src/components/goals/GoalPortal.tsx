"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  ChevronRight,
  GripVertical,
  Filter,
  X,
  AlertCircle,
  Calendar,
  AlertTriangle,
  UserCheck,
  Send,
  Loader2,
  ArrowRight
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { QuarterlyCheckIn } from "./check-ins/QuarterlyCheckIn";

// Interface definitions
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  managerId?: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    role: string;
  };
}

interface CheckIn {
  id: string;
  progress: number;
  notes: string | null;
  achievements: string | null;
  blockers: string | null;
  nextSteps: string | null;
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  weightage: number;
  status: "DRAFT" | "SUBMITTED" | "RETURNED_FOR_REWORK" | "APPROVED" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  startDate: string | null;
  dueDate: string | null;
  progress: number;
  uomType?: string;
  target?: string | null;
  isShared?: boolean;
  isPrimaryOwner?: boolean;
  parentGoalId?: string | null;
  userId: string;
  user: User;
  comments: Comment[];
  checkIns: CheckIn[];
  createdAt: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

// Status dot colors for column headers
const STATUS_DOT: Record<Goal["status"], string> = {
  DRAFT: "bg-zinc-400",
  SUBMITTED: "bg-blue-500",
  RETURNED_FOR_REWORK: "bg-orange-500",
  APPROVED: "bg-amber-400",
  COMPLETED: "bg-emerald-500",
};

export function GoalPortal() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role || "EMPLOYEE";

  // State Management
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<User[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [activeDragGoal, setActiveDragGoal] = useState<Goal | null>(null);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State (New / Edit Goal)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weightage, setWeightage] = useState(10);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [uomType, setUomType] = useState<"NUMERIC" | "PERCENTAGE" | "TIMELINE" | "ZERO_BASED">("NUMERIC");
  const [target, setTarget] = useState("");

  // Action State (Check-in & Comment)
  const [commentText, setCommentText] = useState("");
  const [reworkCommentText, setReworkCommentText] = useState("");
  const [showReworkInput, setShowReworkInput] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // DnD Sensors config to prevent collision with clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Toast Trigger
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load Initial Data
  const loadData = async () => {
    try {
      setLoading(true);
      if (currentUserRole === "MANAGER" || currentUserRole === "ADMIN") {
        const repRes = await fetch("/api/users/reports");
        if (repRes.ok) {
          const repData = await repRes.json();
          setReports(repData);
        }
      }

      const url = selectedReportId
        ? `/api/goals?userId=${selectedReportId}`
        : "/api/goals";
      const goalRes = await fetch(url);
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        setGoals(goalData);
      } else {
        triggerToast("Failed to fetch goals", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error connecting to database", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setIsEditMode(false);
    setTitle("");
    setDescription("");
    setWeightage(10);
    setPriority("MEDIUM" as any);
    setStartDate("");
    setDueDate("");
    setUomType("NUMERIC");
    setTarget("");
  };

  useEffect(() => {
    if (session) {
      loadData();
    }
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/users/reports");
        const data = await res.json();
        setEmployees(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, [session, selectedReportId]);

  // Statistics Computations
  const activeGoals = goals.filter((g) => g.status !== "COMPLETED");
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const remainingWeightage = 100 - totalWeightage;
  const averageProgress = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const handleDragStart = (event: DragStartEvent) => {
    const goal = goals.find((g) => g.id === event.active.id);
    setActiveDragGoal(goal ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragGoal(null);
    const { active, over } = event;
    if (!over) return;

    const goalId = active.id as string;
    const targetStatus = over.id as Goal["status"];

    const draggedGoal = goals.find((g) => g.id === goalId);
    if (!draggedGoal) return;
    if (draggedGoal.status === targetStatus) return;

    let isValid = false;
    if (currentUserRole === "EMPLOYEE") {
      if (
        (draggedGoal.status === "DRAFT" && targetStatus === "SUBMITTED") ||
        (draggedGoal.status === "SUBMITTED" && targetStatus === "DRAFT") ||
        (draggedGoal.status === "RETURNED_FOR_REWORK" && targetStatus === "SUBMITTED") ||
        (draggedGoal.status === "APPROVED" && targetStatus === "COMPLETED") ||
        (draggedGoal.status === "RETURNED_FOR_REWORK" && targetStatus === "DRAFT")
      ) {
        isValid = true;
      }
    } else if (currentUserRole === "MANAGER") {
      if (
        (draggedGoal.status === "SUBMITTED" &&
          (targetStatus === "APPROVED" || targetStatus === "RETURNED_FOR_REWORK")) ||
        (draggedGoal.status === "APPROVED" && targetStatus === "COMPLETED")
      ) {
        isValid = true;
      }
    } else if (currentUserRole === "ADMIN") {
      isValid = true;
    }

    if (!isValid) {
      triggerToast(
        `Invalid action for your role: Cannot transition goal from ${draggedGoal.status} to ${targetStatus}`,
        "error"
      );
      return;
    }

    if (targetStatus === "RETURNED_FOR_REWORK") {
      setSelectedGoal(draggedGoal);
      setIsEditMode(false);
      setShowReworkInput(true);
      triggerToast("Please provide feedback comments to return for rework", "info");
      return;
    }

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
        triggerToast(`Goal updated to ${targetStatus} successfully!`);
      } else {
        const errData = await res.json();
        triggerToast(errData.message || "Failed to update goal state", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error updating goal status", "error");
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (weightage < 10 || weightage > 100) {
      triggerToast("Weightage must be between 10 and 100", "error");
      return;
    }
    if (activeGoals.length >= 8) {
      triggerToast("Employee cannot have more than 8 active goals", "error");
      return;
    }
    if (totalWeightage + weightage > 100) {
      triggerToast(`Total assigned weightage cannot exceed 100. Remaining allowance: ${100 - totalWeightage}`, "error");
      return;
    }
    try {
      setSubmittingAction(true);
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, weightage, priority, uomType, target,
          sharedUserIds: selectedEmployees,
          startDate: startDate || null,
          dueDate: dueDate || null
        })
      });
      if (res.ok) {
        const newGoal = await res.json();
        setGoals((prev) => [newGoal, ...prev]);
        setIsCreateOpen(false);
        triggerToast("Goal created in DRAFT successfully!");
        setTitle(""); setDescription(""); setWeightage(10); setPriority("MEDIUM");
        setStartDate(""); setDueDate("");
      } else {
        const errData = await res.json();
        triggerToast(errData.error ? `${errData.message}: ${errData.error}` : (errData.message || "Failed to create goal"), "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error connecting to create goal", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      setSubmittingAction(true);
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, weightage, priority, uomType, target, startDate: startDate || null, dueDate: dueDate || null })
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === selectedGoal.id ? updated : g)));
        setSelectedGoal(updated);
        setIsEditMode(false);
        triggerToast("Goal edited successfully!");
      } else {
        const errData = await res.json();
        triggerToast(errData.message || "Failed to edit goal", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error editing goal", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
        setSelectedGoal(null);
        setShowCheckInForm(false);
        triggerToast("Goal deleted successfully!");
      } else {
        const errData = await res.json();
        triggerToast(errData.message || "Failed to delete goal", "error");
      }
    } catch (err) {
      triggerToast("Error deleting goal", "error");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !commentText.trim()) return;
    try {
      setSubmittingAction(true);
      const res = await fetch(`/api/goals/${selectedGoal.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText })
      });
      if (res.ok) {
        const newComment = await res.json();
        const updatedGoal = { ...selectedGoal, comments: [...(selectedGoal.comments || []), newComment] };
        setGoals((prev) => prev.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
        setSelectedGoal(updatedGoal);
        setCommentText("");
        triggerToast("Comment added!");
      } else {
        triggerToast("Failed to add comment", "error");
      }
    } catch (err) {
      triggerToast("Error adding comment", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCheckInSuccess = (data: any) => {
    if (!selectedGoal) return;
    const updatedGoal = { 
      ...selectedGoal, 
      progress: data.goal.progress, 
      status: data.goal.status, 
      checkIns: [data.checkIn, ...(selectedGoal.checkIns || [])] 
    };
    setGoals((prev) => prev.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
    setSelectedGoal(updatedGoal);
    setShowCheckInForm(false);
  };

  const handleApprove = async () => {
    if (!selectedGoal) return;
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" })
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === selectedGoal.id ? updated : g)));
        setSelectedGoal(updated);
        triggerToast("Goal approved successfully!");
      } else {
        triggerToast("Failed to approve goal", "error");
      }
    } catch (err) {
      triggerToast("Error approving goal", "error");
    }
  };

  const handleReturnForRework = async () => {
    if (!selectedGoal || !reworkCommentText.trim()) {
      triggerToast("Please provide a reason or feedback comment", "error");
      return;
    }
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RETURNED_FOR_REWORK", comment: reworkCommentText })
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === selectedGoal.id ? updated : g)));
        setSelectedGoal(updated);
        setShowReworkInput(false);
        setReworkCommentText("");
        triggerToast("Goal returned for rework with feedback!");
      } else {
        triggerToast("Failed to process action", "error");
      }
    } catch (err) {
      triggerToast("Error processing request", "error");
    }
  };

  const handleSubmitGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED" })
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
        if (selectedGoal?.id === id) setSelectedGoal(updated);
        triggerToast("Goal submitted to manager for approval!");
      } else {
        const errData = await res.json();
        triggerToast(errData.message || "Failed to submit goal", "error");
      }
    } catch (err) {
      triggerToast("Error submitting goal", "error");
    }
  };

  const handleWithdrawGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" })
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
        if (selectedGoal?.id === id) setSelectedGoal(updated);
        triggerToast("Goal withdrawn back to Draft successfully!");
      } else {
        const errData = await res.json();
        triggerToast(errData.message || "Failed to withdraw goal", "error");
      }
    } catch (err) {
      triggerToast("Error withdrawing goal", "error");
    }
  };

  const handleOpenDetails = async (goal: Goal) => {
    setCommentText("");
    setReworkCommentText("");
    setShowReworkInput(false);
    setSelectedGoal(goal);
    setShowCheckInForm(false);
    try {
      const res = await fetch(`/api/goals/${goal.id}`);
      if (res.ok) {
        const freshGoal = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === goal.id ? freshGoal : g)));
        setSelectedGoal(freshGoal);
      }
    } catch (err) {
      console.error("Error loading fresh goal details:", err);
    }
  };

  const openEditMode = (goal: Goal) => {
    setTitle(goal.title);
    setDescription(goal.description || "");
    setWeightage(goal.weightage);
    setPriority(goal.priority);
    setStartDate(goal.startDate ? goal.startDate.split("T")[0] : "");
    setDueDate(goal.dueDate ? goal.dueDate.split("T")[0] : "");
    setIsEditMode(true);
  };

  const exportGoalsCSV = () => {
    if (!goals.length) return;
    const rows = goals.map((goal) => ({
      Title: goal.title,
      Owner: goal.user?.email || "",
      Description: goal.description || "",
      Status: goal.status,
      Priority: goal.priority,
      Progress: goal.progress,
      Weightage: goal.weightage,
      UOM: goal.uomType || "",
      Target: goal.target || "",
      CreatedAt: goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : "",
      DueDate: goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : "",
    }));
    const csvContent = [
      Object.keys(rows[0]).join(","),
      ...rows.map((row) => Object.values(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "goals-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0 pb-16">

      {/* HEADER CARD */}
      <div className="bg-white border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Goal Setting &amp; <span className="text-[var(--color-dijon)]">Workflow</span> Portal
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            Build, execute, review, and track performance goals inside the secure enterprise sandbox.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[var(--color-dijon)] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgba(229,169,61,0.39)] hover:shadow-[0_6px_20px_rgba(229,169,61,0.23)] hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* Active Goals */}
        <div className="bg-white border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Active Goals Limit
            </span>
            <div className="text-4xl font-extrabold mt-2 text-zinc-800">
              {activeGoals.length} <span className="text-2xl text-zinc-400">/ 8</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Maximum allowed is 8 active</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50/50 flex items-center justify-center border border-amber-100/50">
            <Target className="w-5 h-5 text-[var(--color-dijon)]" />
          </div>
        </div>

        {/* Total Weightage */}
        <div className="bg-white border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Goals Weightage
            </span>
            <div className="text-4xl font-extrabold mt-2 text-zinc-800">
              {totalWeightage} <span className="text-2xl">%</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Remaining allowance: {remainingWeightage}%</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50/50 flex items-center justify-center border border-amber-100/50">
            <Sparkles className="w-5 h-5 text-[var(--color-dijon)]" />
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-6 rounded-2xl flex items-center justify-between">
          <div className="w-full">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Overall Average Progress
            </span>
            <div className="text-4xl font-extrabold mt-2 text-zinc-800">
              {averageProgress}<span className="text-2xl">%</span>
            </div>
            <div className="mt-3 w-32 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-dijon)] rounded-full transition-all"
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50/50 flex items-center justify-center border border-amber-100/50 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-dijon)]" />
          </div>
        </div>

      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-[var(--color-dijon)] animate-spin" />
          <p className="text-zinc-500 text-sm mt-4 font-semibold">Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <Target className="w-16 h-16 text-zinc-300 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-800 mt-6">No Goals Configured</h2>
          <p className="text-zinc-500 mt-2 text-sm">
            {selectedReportId
              ? "This team member hasn't created any goals yet."
              : "You haven't set up any performance goals for this cycle yet. Create one to get started."}
          </p>
          {!selectedReportId && currentUserRole === "EMPLOYEE" && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-6 inline-flex items-center gap-2 bg-[var(--color-dijon)] text-white font-semibold py-2.5 px-6 rounded-xl hover:opacity-90 shadow-sm text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Set First Goal
            </button>
          )}
        </div>
      ) : (

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragGoal(null)}
        >
          <div className="flex gap-4 items-start overflow-x-auto pb-6">

            <DroppableColumn
              id="DRAFT"
              title="DRAFT"
              status="DRAFT"
              count={goals.filter((g) => g.status === "DRAFT").length}
            >
              {goals.filter((g) => g.status === "DRAFT").map((goal) => (
                <DraggableGoalCard key={goal.id} goal={goal} onClick={() => handleOpenDetails(goal)} />
              ))}
            </DroppableColumn>

            <DroppableColumn
              id="SUBMITTED"
              title="SUBMITTED"
              status="SUBMITTED"
              count={goals.filter((g) => g.status === "SUBMITTED").length}
            >
              {goals.filter((g) => g.status === "SUBMITTED").map((goal) => (
                <DraggableGoalCard key={goal.id} goal={goal} onClick={() => handleOpenDetails(goal)} />
              ))}
            </DroppableColumn>

            <DroppableColumn
              id="RETURNED_FOR_REWORK"
              title="REWORK"
              status="RETURNED_FOR_REWORK"
              count={goals.filter((g) => g.status === "RETURNED_FOR_REWORK").length}
            >
              {goals.filter((g) => g.status === "RETURNED_FOR_REWORK").map((goal) => (
                <DraggableGoalCard key={goal.id} goal={goal} onClick={() => handleOpenDetails(goal)} />
              ))}
            </DroppableColumn>

            <DroppableColumn
              id="APPROVED"
              title="APPROVED"
              status="APPROVED"
              count={goals.filter((g) => g.status === "APPROVED").length}
            >
              {goals.filter((g) => g.status === "APPROVED").map((goal) => (
                <DraggableGoalCard key={goal.id} goal={goal} onClick={() => handleOpenDetails(goal)} />
              ))}
            </DroppableColumn>

            <DroppableColumn
              id="COMPLETED"
              title="COMPLETED"
              status="COMPLETED"
              count={goals.filter((g) => g.status === "COMPLETED").length}
            >
              {goals.filter((g) => g.status === "COMPLETED").map((goal) => (
                <DraggableGoalCard key={goal.id} goal={goal} onClick={() => handleOpenDetails(goal)} />
              ))}
            </DroppableColumn>

          </div>
          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
            {activeDragGoal ? (
              <div className="w-[248px]">
                <GoalCard goal={activeDragGoal} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create / Edit Goal Modal */}
      <AnimatePresence>
        {(isCreateOpen || isEditMode) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
                <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--color-dijon)]" />
                  {isEditMode ? "Edit Goal" : "Create New Goal"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-zinc-200/50 text-zinc-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form id="goal-form" onSubmit={isEditMode ? handleEditGoal : handleCreateGoal} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Goal Title <span className="text-rose-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm"
                      placeholder="e.g., Launch new Q3 Marketing Campaign"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm resize-none min-h-[100px]"
                      placeholder="Detailed objectives and key results..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">Weightage (%) <span className="text-rose-500">*</span></label>
                      <input
                        required
                        type="number"
                        min="10"
                        max="100"
                        value={weightage}
                        onChange={(e) => setWeightage(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm"
                      />
                      <p className="text-[10px] text-zinc-500">Value between 10-100.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">Priority <span className="text-rose-500">*</span></label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm appearance-none bg-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">UoM Type <span className="text-rose-500">*</span></label>
                      <select
                        value={uomType}
                        onChange={(e) => setUomType(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm appearance-none bg-white"
                      >
                        <option value="NUMERIC">Numeric</option>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="TIMELINE">Timeline</option>
                        <option value="ZERO_BASED">Zero Based</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">Target Value</label>
                      <input
                        type="text"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm"
                        placeholder="e.g. 100k, Q3 Delivery"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  
                  {currentUserRole === "MANAGER" && !isEditMode && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">Assign to Employees (Shared Goal)</label>
                      <div className="border border-zinc-200 rounded-xl max-h-[150px] overflow-y-auto p-2 space-y-1">
                        {employees.map(emp => (
                          <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-zinc-50 rounded-lg cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedEmployees.includes(emp.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedEmployees(prev => [...prev, emp.id]);
                                else setSelectedEmployees(prev => prev.filter(id => id !== emp.id));
                              }}
                              className="w-4 h-4 text-[var(--color-dijon)] rounded focus:ring-[var(--color-dijon)]"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-zinc-800">{emp.name || emp.email}</span>
                              <span className="text-xs text-zinc-500">{emp.role}</span>
                            </div>
                          </label>
                        ))}
                        {employees.length === 0 && <p className="text-xs text-zinc-500 p-2">No employees report to you.</p>}
                      </div>
                    </div>
                  )}

                </form>
              </div>

              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setIsEditMode(false); }}
                  className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  form="goal-form"
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-dijon)] text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditMode ? "Save Changes" : "Create Goal"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Details Panel / Modal */}
      <AnimatePresence>
        {selectedGoal && !isEditMode && !showReworkInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedGoal(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col border-l border-zinc-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 pb-6 overflow-y-auto custom-scrollbar relative flex-1">
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Badges */}
                <div className="flex items-center gap-3 mb-5">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border tracking-wide uppercase ${selectedGoal.priority === 'LOW' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-200' : selectedGoal.priority === 'MEDIUM' ? 'bg-amber-50/50 text-amber-600 border-amber-200' : 'bg-rose-50/50 text-rose-600 border-rose-200'}`}>
                    {selectedGoal.priority} PRIORITY
                  </span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 tracking-wide uppercase">
                    {selectedGoal.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Title and Owner */}
                <h2 className="text-[28px] leading-tight font-extrabold text-zinc-900 mb-2 pr-12">{selectedGoal.title}</h2>
                <div className="text-[13px] text-zinc-500 mb-8">
                  Owner: <span className="font-bold text-zinc-700">{selectedGoal.user?.name || 'Unknown'}</span> <span className="text-zinc-400">({selectedGoal.user?.email || ''})</span>
                </div>

                <div className="w-full h-px bg-zinc-100 mb-8" />

                {/* Metrics Card */}
                <div className="bg-zinc-50/30 border border-zinc-200 rounded-2xl py-6 flex items-center justify-between mb-10">
                  <div className="flex-1 text-center border-r border-zinc-200">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Weightage</div>
                    <div className="text-[26px] font-extrabold text-zinc-900">{selectedGoal.weightage}%</div>
                  </div>
                  <div className="flex-1 text-center border-r border-zinc-200">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Progress</div>
                    <div className="text-[26px] font-extrabold text-zinc-900">{selectedGoal.progress}%</div>
                  </div>
                  <div className="flex-1 text-center border-r border-zinc-200">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Target</div>
                    <div className="text-[20px] mt-1 font-extrabold text-zinc-900">{selectedGoal.target ? `${selectedGoal.target} (${selectedGoal.uomType})` : '-'}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Due Date</div>
                    <div className="text-[20px] mt-1 font-extrabold text-zinc-900">{selectedGoal.dueDate ? new Date(selectedGoal.dueDate).toLocaleDateString() : '-'}</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-10">
                  <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-4">Goal Description</h3>
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 text-[15px] text-zinc-900 leading-relaxed shadow-sm">
                    {selectedGoal.description || 'No description provided.'}
                  </div>
                  <div className="flex gap-4 mt-5 text-[13px] text-zinc-500">
                    <span>Start: <span className="font-bold text-zinc-700">{selectedGoal.startDate ? new Date(selectedGoal.startDate).toLocaleDateString() : '-'}</span></span>
                    <span>Created: <span className="font-bold text-zinc-700">{new Date(selectedGoal.createdAt).toLocaleDateString()}</span></span>
                  </div>
                </div>

                <div className="border-t border-zinc-200 mt-8 pt-8">
                  <QuarterlyCheckIn
                    goalId={selectedGoal.id}
                    isManager={currentUserRole === "MANAGER"}
                    onSuccess={() => {
                      fetch(`/api/goals/${selectedGoal.id}`)
                        .then(res => res.json())
                        .then(updated => {
                          setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
                          setSelectedGoal(updated);
                        });
                    }}
                  />
                </div>

                <div className="w-full h-px bg-zinc-100 my-8" />

                {/* Discussion */}
                <div>
                  <h3 className="text-[13px] font-extrabold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Discussion Feedback Loop
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    {selectedGoal.comments?.map((comment) => (
                      <div key={comment.id} className={`flex flex-col ${comment.user.id === currentUserId ? "items-end" : "items-start"}`}>
                        <div className={`px-6 py-4 rounded-3xl max-w-[85%] ${
                          comment.user.id === currentUserId 
                            ? "bg-zinc-50 border border-zinc-200 rounded-tr-sm" 
                            : "bg-white border border-zinc-200 rounded-tl-sm shadow-sm"
                        }`}>
                          <div className={`text-[10px] text-zinc-500 mb-2 flex items-center gap-2 ${comment.user.id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                            <span className="font-bold text-zinc-700">{comment.user.name}</span>
                            <span className="px-1.5 py-[2px] bg-zinc-200 rounded text-[9px] font-bold text-zinc-600 uppercase">{comment.user.role}</span>
                            • {new Date(comment.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className={`text-[14px] text-zinc-800 ${comment.user.id === currentUserId ? 'text-right' : 'text-left'}`}>
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!selectedGoal.comments || selectedGoal.comments.length === 0) && (
                      <p className="text-sm text-zinc-400 text-center py-4">No comments yet.</p>
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type your response/feedback..."
                      className="flex-1 px-6 py-3.5 rounded-full border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-4 focus:ring-[var(--color-dijon)]/10 outline-none transition-all text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submittingAction}
                      className="px-6 py-3.5 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-bold"
                    >
                      {submittingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Post Comment
                    </button>
                  </form>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-6 border-t border-zinc-100 bg-zinc-50/30 flex justify-between items-center shrink-0">
                <div>
                  {(selectedGoal.status === "DRAFT" || selectedGoal.status === "RETURNED_FOR_REWORK") && (selectedGoal.userId === currentUserId || currentUserRole === "ADMIN") && (
                    <button
                      onClick={() => handleDeleteGoal(selectedGoal.id)}
                      className="px-6 py-3 rounded-full border border-rose-200 bg-white text-rose-600 text-sm font-bold hover:bg-rose-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  {(selectedGoal.status === "DRAFT" || selectedGoal.status === "RETURNED_FOR_REWORK") && (selectedGoal.userId === currentUserId || currentUserRole === "ADMIN") && (
                    <button
                      onClick={() => openEditMode(selectedGoal)}
                      className="px-6 py-3 rounded-full border border-zinc-200 bg-white text-zinc-900 text-sm font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Details
                    </button>
                  )}
                  {(selectedGoal.status === "DRAFT" || selectedGoal.status === "RETURNED_FOR_REWORK") && (selectedGoal.userId === currentUserId || currentUserRole === "ADMIN") && (
                    <button
                      onClick={() => handleSubmitGoal(selectedGoal.id)}
                      className="px-6 py-3 rounded-full bg-[var(--color-dijon)] text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-[0_4px_14px_0_rgba(229,169,61,0.39)]"
                    >
                      <Send className="w-4 h-4" /> Submit to Manager
                    </button>
                  )}

                  {selectedGoal.status === "SUBMITTED" && (selectedGoal.userId === currentUserId || currentUserRole === "ADMIN") && (
                    <button
                      onClick={() => handleWithdrawGoal(selectedGoal.id)}
                      className="px-6 py-3 rounded-full border border-zinc-200 bg-white text-zinc-900 text-sm font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" /> Withdraw to Draft
                    </button>
                  )}

                  {selectedGoal.status === "SUBMITTED" && (currentUserRole === "MANAGER" || currentUserRole === "ADMIN") && (
                    <>
                      <button
                        onClick={() => setShowReworkInput(true)}
                        className="px-6 py-3 rounded-full border border-orange-200 bg-white text-orange-600 text-sm font-bold hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4" /> Return for Rework
                      </button>
                      <button
                        onClick={handleApprove}
                        className="px-6 py-3 rounded-full bg-[var(--color-dijon)] text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-[0_4px_14px_0_rgba(229,169,61,0.39)]"
                      >
                        <UserCheck className="w-4 h-4" /> Approve Goal
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rework Modal (Manager Action) */}
      <AnimatePresence>
        {showReworkInput && selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowReworkInput(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Return for Rework
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Please provide feedback on why this goal needs adjustments.
                </p>
              </div>
              <div className="p-6">
                <textarea
                  autoFocus
                  value={reworkCommentText}
                  onChange={(e) => setReworkCommentText(e.target.value)}
                  placeholder="e.g., Please make the target more measurable..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-sm resize-none min-h-[120px]"
                />
              </div>
              <div className="p-6 pt-0 flex justify-end gap-3 bg-zinc-50/50">
                <button
                  onClick={() => setShowReworkInput(false)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnForRework}
                  disabled={!reworkCommentText.trim()}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Return to Employee
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] ${
                toast.type === "success" ? "bg-emerald-50/90 border-emerald-200 text-emerald-800" :
                toast.type === "error" ? "bg-rose-50/90 border-rose-200 text-rose-800" :
                "bg-blue-50/90 border-blue-200 text-blue-800"
              }`}
            >
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-500" />}
              {toast.type === "info" && <AlertCircle className="w-5 h-5 text-blue-500" />}
              <span className="text-sm font-semibold flex-1">{toast.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}

// ── DroppableColumn ───────────────────────────────────────────────────────────

function DroppableColumn({
  id,
  title,
  status,
  count,
  children,
}: {
  id: string;
  title: string;
  status: Goal["status"];
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });

  const dotColor: Record<Goal["status"], string> = {
    DRAFT: "bg-zinc-400",
    SUBMITTED: "bg-blue-500",
    RETURNED_FOR_REWORK: "bg-orange-500",
    APPROVED: "bg-amber-400",
    COMPLETED: "bg-emerald-500",
  };

  return (
    <div
      ref={setNodeRef}
      className="min-w-[280px] w-[280px] rounded-2xl border border-zinc-100 bg-white/40 p-4"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor[status]}`} />
          <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <span className="text-xs bg-white border border-zinc-100 shadow-sm rounded-full w-6 h-6 flex items-center justify-center text-zinc-500 font-bold">
          {count}
        </span>
      </div>

      <div className="space-y-3 min-h-[500px]">
        {children}
      </div>
    </div>
  );
}

// ── DraggableGoalCard ─────────────────────────────────────────────────────────

function DraggableGoalCard({
  goal,
  onClick,
}: {
  goal: Goal;
  onClick: () => void;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({ id: goal.id });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    touchAction: "none",
    transition: isDragging ? undefined : "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={isDragging ? "opacity-30" : undefined}
    >
      <GoalCard goal={goal} onDetails={onClick} />
    </div>
  );
}

function GoalCard({
  goal,
  isOverlay = false,
  onDetails,
}: {
  goal: Goal;
  isOverlay?: boolean;
  onDetails?: () => void;
}) {

  const priorityColor: Record<Goal["priority"], string> = {
    HIGH: "bg-rose-50 text-rose-600 border-rose-200",
    MEDIUM: "bg-amber-50 text-amber-600 border-amber-200",
    LOW: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  const formattedDate = goal.dueDate
    ? new Date(goal.dueDate).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
    : null;

  return (
    <div
      className={`box-border flex h-[278px] w-full max-w-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition-[box-shadow,border-color,transform] duration-200 group ${
        isOverlay
          ? "cursor-grabbing border-zinc-200 shadow-2xl ring-1 ring-black/5"
          : "cursor-pointer hover:border-zinc-200 hover:shadow-md"
      }`}
    >
      {/* Priority badge + grip */}
      <div className="mb-4 flex h-8 shrink-0 items-center justify-between">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${priorityColor[goal.priority]}`}>
          {goal.priority}
        </span>
        <GripVertical className="w-4 h-4 text-zinc-300 group-hover:text-zinc-400 transition-colors" />
      </div>

      {/* Title */}
      <h4 className="line-clamp-2 min-h-[40px] font-bold text-zinc-800 text-[13px] leading-relaxed">
        {goal.title}
      </h4>

      {/* Description */}
      <p className="mt-2 line-clamp-2 min-h-[34px] text-[11px] text-zinc-400 leading-relaxed">
        {goal.description || "No description provided."}
      </p>

      {/* Progress + Weight */}
      <div className="mt-4 flex shrink-0 items-center gap-4 text-[11px] font-bold text-zinc-500">
        <span>Progress: {goal.progress}%</span>
        <span>Weight: {goal.weightage}%</span>
      </div>
      
      <div className="mt-2 w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full bg-[var(--color-dijon)] rounded-full" style={{ width: `${goal.progress}%` }} />
      </div>

      <div className="w-full h-px bg-zinc-100 my-4" />

      {/* Due date + Details link */}
      <div className="mt-auto flex shrink-0 items-center justify-between">
        {formattedDate ? (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={isOverlay}
          onClick={(e) => {
            e.stopPropagation();
            onDetails?.();
          }}
          className="flex items-center gap-0.5 text-[11px] text-[var(--color-dijon)] font-bold hover:opacity-80 transition-opacity"
        >
          Details <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
