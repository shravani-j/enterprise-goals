import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveQuarterWindow } from "@/lib/quarterlyUtils";
import { logAudit } from "@/lib/auditLogger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    const reviews = await prisma.quarterlyReview.findMany({
      where: { goalId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching quarterly reviews" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const { id } = resolvedParams;
  const currentUserId = session.user.id;
  const role = session.user.role;

  try {
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!goal) return NextResponse.json({ message: "Goal not found" }, { status: 404 });

    const isOwner = goal.userId === currentUserId;
    const isManager = goal.user.managerId === currentUserId;

    if (!isOwner && !isManager && role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { quarter, planned, actual, status, managerFeedback } = body;

    // Check Window Enforcement
    const activeWindow = getActiveQuarterWindow();
    if (activeWindow !== quarter && role !== "ADMIN") {
      return NextResponse.json({ message: `Updates for ${quarter} are currently closed.` }, { status: 400 });
    }

    // Determine computed progress if planned & actual are passed
    let computedProgress = goal.progress;
    
    // Simple basic check for Planned vs Actual if both are numbers
    const plannedNum = parseFloat(planned);
    const actualNum = parseFloat(actual);
    if (!isNaN(plannedNum) && !isNaN(actualNum)) {
      if (goal.uomType === "MIN") {
        computedProgress = Math.min(100, Math.round((actualNum / plannedNum) * 100));
      } else if (goal.uomType === "MAX") {
        computedProgress = Math.min(100, Math.round((plannedNum / actualNum) * 100));
      } else if (goal.uomType === "ZERO") {
        computedProgress = actualNum === 0 ? 100 : 0;
      }
    }

    const review = await prisma.quarterlyReview.create({
      data: {
        quarter,
        planned,
        actual,
        progress: computedProgress,
        status: status || "Not Started",
        managerFeedback: isManager ? managerFeedback : null,
        goalId: id,
        userId: currentUserId
      }
    });

    // Save Progress History
    await prisma.progressHistory.create({
      data: {
        progress: computedProgress,
        goalId: id
      }
    });

    // Update Goal Master Progress
    await prisma.goal.update({
      where: { id },
      data: { progress: computedProgress }
    });

    // Write Audit Log
    await logAudit({
      action: `Submitted Quarterly Check-in (${quarter})`,
      details: `Planned target vs Actual achievement captured. Progress: ${computedProgress}%`,
      field: "quarterlyCheckin",
      previousValue: `${goal.progress}%`,
      newValue: `${computedProgress}%`,
      role: session.user.role,
      actionType: "QUARTERLY_UPDATE",
      goalId: id,
      userId: session.user.id
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error saving quarterly review" }, { status: 500 });
  }
}
