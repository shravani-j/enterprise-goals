import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { logAudit } from "@/lib/auditLogger";
import { parseDateSafely } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const role = session.user.role;
    const currentUserId = session.user.id;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, managerId: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        checkIns: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 });
    }

    // Access control
    if (role === "EMPLOYEE" && goal.userId !== currentUserId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (role === "MANAGER" && goal.userId !== currentUserId && goal.user.managerId !== currentUserId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("GET /api/goals/[id] error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const role = session.user.role;
    const currentUserId = session.user.id;

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 });
    }

    // Access Control
    const isOwner = goal.userId === currentUserId;
    const isManager = goal.user.managerId === currentUserId;
    const isAdmin = role === "ADMIN";

    if (!isOwner && !isManager && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { title, description, weightage, priority, uomType, target, startDate, dueDate, progress, status, comment } = await req.json();

    const dataToUpdate: any = {};

    // Workflow Actions & Validation
    if (status && status !== goal.status) {
      // Validate workflow transitions
      // Draft -> Submitted
      // Submitted -> Returned for Rework / Approved
      // Returned for Rework -> Submitted
      // Approved -> Completed
      
      if (role === "EMPLOYEE") {
        // Employees can submit drafts, withdraw submissions, respond to rework, or complete approved goals
        if (goal.status === "DRAFT" && status === "SUBMITTED") {
          dataToUpdate.status = "SUBMITTED";
        } else if (goal.status === "SUBMITTED" && status === "DRAFT") {
          dataToUpdate.status = "DRAFT";
        } else if (goal.status === "RETURNED_FOR_REWORK" && status === "SUBMITTED") {
          dataToUpdate.status = "SUBMITTED";
        } else if (goal.status === "APPROVED" && status === "COMPLETED") {
          dataToUpdate.status = "COMPLETED";
        } else if (status === "DRAFT" && goal.status === "RETURNED_FOR_REWORK") {
          dataToUpdate.status = "DRAFT";
        } else {
          return NextResponse.json({ message: `Invalid transition for employee from ${goal.status} to ${status}` }, { status: 400 });
        }
      } else if (role === "MANAGER") {
        // Managers can approve submitted goals, return them for rework, or complete them
        if (goal.status === "SUBMITTED" && (status === "APPROVED" || status === "RETURNED_FOR_REWORK")) {
          dataToUpdate.status = status;
        } else if (goal.status === "APPROVED" && status === "COMPLETED") {
          dataToUpdate.status = "COMPLETED";
        } else {
          return NextResponse.json({ message: `Invalid transition for manager from ${goal.status} to ${status}` }, { status: 400 });
        }
      } else if (role === "ADMIN") {
        // Admins can do any transitions
        dataToUpdate.status = status;
      }
    }

    // Manager Actions (Approve / Return for Rework)
    if (isManager && !isOwner) {
      // Manager can also add a comment during this PUT request
      if (comment) {
        await prisma.comment.create({
          data: {
            content: comment,
            goalId: id,
            userId: currentUserId
          }
        });
      }
    }

    // Employee Actions (Edit details)
    if (isOwner || isAdmin) {
      // Employees can only edit details if in DRAFT or RETURNED_FOR_REWORK,
      // or if they are withdrawing a SUBMITTED goal back to DRAFT.
      const isWithdrawing = goal.status === "SUBMITTED" && status === "DRAFT";

      if (goal.status !== "DRAFT" && goal.status !== "RETURNED_FOR_REWORK" && !isWithdrawing && !isAdmin) {
        // Unless they are just updating the progress of an APPROVED goal
        if (goal.status === "APPROVED" && progress !== undefined) {
          const progNum = Number(progress);
          if (isNaN(progNum) || progNum < 0 || progNum > 100) {
            return NextResponse.json({ message: "Progress must be between 0 and 100" }, { status: 400 });
          }
          dataToUpdate.progress = progNum;
        } else {
          return NextResponse.json({ message: "Can only edit goals in Draft or Returned for Rework status" }, { status: 400 });
        }
      } else {
        // Full fields update
        if (title !== undefined) {
          if (!title) {
            return NextResponse.json({ message: "Title cannot be empty" }, { status: 400 });
          }
          dataToUpdate.title = title;
        }

        if (description !== undefined) {
          dataToUpdate.description = description || null;
        }

        if (weightage !== undefined) {
          const weightNum = Number(weightage);
          if (isNaN(weightNum) || weightNum < 10 || weightNum > 100) {
            return NextResponse.json({ message: "Weightage must be between 10 and 100" }, { status: 400 });
          }

          // Total weightage validation (excluding current goal)
          const otherGoals = await prisma.goal.findMany({
            where: {
              userId: goal.userId,
              id: { not: id }
            }
          });
          const otherTotalWeightage = otherGoals.reduce((sum, g) => sum + g.weightage, 0);

          if (otherTotalWeightage + weightNum > 100) {
            return NextResponse.json({
              message: `Total assigned weightage cannot exceed 100. Remaining allowance: ${100 - otherTotalWeightage}`
            }, { status: 400 });
          }
          dataToUpdate.weightage = weightNum;
        }

        if (priority !== undefined) {
          dataToUpdate.priority = priority;
        }

        if (uomType !== undefined) {
          dataToUpdate.uomType = uomType;
        }

        if (target !== undefined) {
          dataToUpdate.target = target;
        }

        if (startDate !== undefined) {
          dataToUpdate.startDate = parseDateSafely(startDate);
        }

        if (dueDate !== undefined) {
          dataToUpdate.dueDate = parseDateSafely(dueDate);
        }

        if (progress !== undefined) {
          const progNum = Number(progress);
          if (isNaN(progNum) || progNum < 0 || progNum > 100) {
            return NextResponse.json({ message: "Progress must be between 0 and 100" }, { status: 400 });
          }
          dataToUpdate.progress = progNum;
        }
      }
    }

    // Active goals count check (if changing status from COMPLETED back to active)
    if (dataToUpdate.status && dataToUpdate.status !== "COMPLETED" && goal.status === "COMPLETED") {
      const activeGoalsCount = await prisma.goal.count({
        where: {
          userId: goal.userId,
          status: { not: "COMPLETED" }
        }
      });
      if (activeGoalsCount >= 8) {
        return NextResponse.json({ message: "Cannot reactivate goal: maximum of 8 active goals reached" }, { status: 400 });
      }
    }

    // Audit trail logging for changes made to locked goals or status transitions
    const isLocked = goal.status === "APPROVED" || goal.status === "COMPLETED";
    const statusChanged = dataToUpdate.status !== undefined && dataToUpdate.status !== goal.status;
    
    if (isLocked || statusChanged) {
      const fieldsToTrack: (keyof typeof dataToUpdate & string)[] = [
        "title",
        "description",
        "weightage",
        "priority",
        "uomType",
        "target",
        "startDate",
        "dueDate",
        "progress",
        "status"
      ];
      
      for (const field of fieldsToTrack) {
        if (dataToUpdate[field] !== undefined) {
          let prevVal = goal[field as keyof typeof goal];
          let newVal = dataToUpdate[field];
          
          if (prevVal instanceof Date) prevVal = prevVal.toISOString();
          if (newVal instanceof Date) newVal = newVal.toISOString();
          
          if (String(prevVal) !== String(newVal)) {
            let actionType = "GOAL_EDIT";
            if (field === "status") {
              if (newVal === "APPROVED") actionType = "APPROVAL";
              else if (newVal === "RETURNED_FOR_REWORK") actionType = "REWORK_REQUEST";
              else actionType = "STATUS_CHANGE";
            }
            
            if (isLocked || field === "status") {
              await logAudit({
                action: field === "status" ? `Goal status changed to ${String(newVal)}` : `Updated Goal ${field}`,
                details: `Field '${field}' modified from "${prevVal ? String(prevVal) : ''}" to "${newVal ? String(newVal) : ''}"`,
                field: String(field),
                previousValue: prevVal ? String(prevVal) : "",
                newValue: newVal ? String(newVal) : "",
                role: session.user.role,
                actionType,
                goalId: id,
                userId: session.user.id
              });
            }
          }
        }
      }
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        checkIns: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (updatedGoal.isPrimaryOwner) {
  await prisma.goal.updateMany({
    where: {
      parentGoalId: updatedGoal.id,
    },
    data: {
      progress: updatedGoal.progress,
      status: updatedGoal.status,
    },
  });
}

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("PUT /api/goals/[id] error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const role = session.user.role;
    const currentUserId = session.user.id;

    const goal = await prisma.goal.findUnique({
      where: { id }
    });

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 });
    }

    const isOwner = goal.userId === currentUserId;
    const isAdmin = role === "ADMIN";
    const isPrimaryOwner =
  goal.isPrimaryOwner &&
  goal.userId === currentUserId;

    if (!isOwner && !isAdmin && !isPrimaryOwner) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Delete restrictions for employees
    if (role === "EMPLOYEE" && goal.status !== "DRAFT" && goal.status !== "RETURNED_FOR_REWORK") {
      return NextResponse.json({ message: "Can only delete goals in Draft or Returned for Rework status" }, { status: 400 });
    }

    await prisma.goal.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 });
  }
}
