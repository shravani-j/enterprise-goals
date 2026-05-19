import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateSafely } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("GET /api/goals session:", session?.user);
    if (!session?.user) {
      console.error("GET /api/goals unauthorized: no session.user");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterUserId = searchParams.get("userId");

    const role = session.user.role;
    const currentUserId = session.user.id;
    console.log("GET /api/goals currentUserId", currentUserId, "role", role, "filterUserId", filterUserId);

    let whereClause: any = {};

    if (role === "EMPLOYEE") {
      whereClause.userId = currentUserId;
    } else if (role === "MANAGER") {
      if (filterUserId) {
        // Verify this employee reports to this manager
        const employee = await prisma.user.findFirst({
          where: { id: filterUserId, managerId: currentUserId },
        });
        if (!employee) {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
        whereClause.userId = filterUserId;
      } else {
        // Get manager's own goals + goals of reports
        whereClause.OR = [
          { userId: currentUserId },
          { user: { managerId: currentUserId } }
        ];
      }
    } else if (role === "ADMIN") {
      if (filterUserId) {
        whereClause.userId = filterUserId;
      }
    }

    console.log("GET /api/goals whereClause", whereClause);
    const goals = await prisma.goal.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        // Removed checkIns include here because the local SQLite schema is missing the
        // CheckIn.achievements column, which crashes goal list retrieval with a 500.
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, description, weightage, priority, startDate, dueDate, uomType,
      target, sharedUserIds } = await req.json();

    if (!title || weightage === undefined) {
      return NextResponse.json({ message: "Title and weightage are required" }, { status: 400 });
    }

    // Weightage validation
    const weightNum = Number(weightage);
    if (isNaN(weightNum) || weightNum < 10 || weightNum > 100) {
      return NextResponse.json({ message: "Weightage must be between 10 and 100" }, { status: 400 });
    }

    const currentUserId = session.user.id;

    // Active goals limit validation (max 8 active goals)
    const activeGoalsCount = await prisma.goal.count({
      where: {
        userId: currentUserId,
        status: { not: "COMPLETED" }
      }
    });

    if (activeGoalsCount >= 8) {
      return NextResponse.json({ message: "Maximum of 8 active goals reached" }, { status: 400 });
    }

    // Total weightage validation (max 100)
    const userGoals = await prisma.goal.findMany({
      where: { userId: currentUserId }
    });
    const currentTotalWeightage = userGoals.reduce((sum: number, g) => sum + g.weightage, 0);

    if (currentTotalWeightage + weightNum > 100) {
      return NextResponse.json({
        message: `Total assigned weightage cannot exceed 100. Remaining allowance: ${100 - currentTotalWeightage}`
      }, { status: 400 });
    }
    const role = session.user.role;
    const newGoal = await prisma.goal.create({
      data: {
        title,
        description,
        weightage,
        priority,
        uomType,
        target,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status:
          role === "MANAGER" && sharedUserIds?.length > 0
            ? "APPROVED"
            : "DRAFT",

        isShared: role === "MANAGER",
        isPrimaryOwner: role === "MANAGER",
        userId: currentUserId,
      },
    });
    if (
      role === "MANAGER" &&
      sharedUserIds &&
      sharedUserIds.length > 0
    ) {
      await prisma.goal.createMany({
        data: sharedUserIds.map((employeeId: string) => ({
          title,
          description,
          weightage,
          priority,
          uomType,
          target,
          startDate: startDate ? new Date(startDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,

          status: "APPROVED",

          isShared: true,
          parentGoalId: newGoal.id,

          userId: employeeId,
        })),
      });
    }

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 });
  }
}
