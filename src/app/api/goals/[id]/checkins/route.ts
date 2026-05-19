import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { progress, notes, achievements, blockers, nextSteps } = await req.json();

    const progressNum = Number(progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      return NextResponse.json({ message: "Progress must be between 0 and 100" }, { status: 400 });
    }

    const role = session.user.role;
    const currentUserId = session.user.id;

    // Fetch the goal
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 });
    }

    // Only owners or admin can check in
    const isOwner = goal.userId === currentUserId;
    const isAdmin = role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Prevent updates on completed goals
    if (goal.status === "COMPLETED") {
      return NextResponse.json({ message: "Cannot perform check-ins on completed goals" }, { status: 400 });
    }

    // Goal must be APPROVED to perform check-ins (since DRAFT/SUBMITTED are not active for tracking yet)
    if (goal.status !== "APPROVED" && !isAdmin) {
      return NextResponse.json({ message: "Can only check in on approved goals" }, { status: 400 });
    }

    // Start a transaction to create check-in and update goal progress
    const [checkIn, updatedGoal] = await prisma.$transaction([
      prisma.checkIn.create({
        data: {
          progress: progressNum,
          notes: notes || null,
          achievements: achievements || null,
          blockers: blockers || null,
          nextSteps: nextSteps || null,
          goalId: id,
          userId: currentUserId
        }
      }),
      prisma.goal.update({
        where: { id },
        data: {
          progress: progressNum,
          // If progress reaches 100%, set to COMPLETED
          status: progressNum === 100 ? "COMPLETED" : "APPROVED"
        }
      })
    ]);

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "CHECK_IN",
        details: `Checked in on goal "${goal.title}": Progress updated to ${progressNum}%`,
        userId: currentUserId
      }
    });

    return NextResponse.json({ checkIn, goal: updatedGoal });
  } catch (error) {
    console.error("POST /api/goals/[id]/checkins error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 });
  }
}
