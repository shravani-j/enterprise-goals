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
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { message: "Comment content is required" },
        { status: 400 }
      );
    }

    const role = session.user.role;
    const currentUserId = session.user.id;

    // Fetch goal
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { message: "Goal not found" },
        { status: 404 }
      );
    }

    console.log("COMMENT GOAL:", goal);

    // Shared goals:
    // - owner can comment
    // - linked employees can comment
    // - managers/admins can comment

    const canComment =
      goal.userId === currentUserId ||
      goal.isShared ||
      role === "MANAGER" ||
      role === "ADMIN";

    if (!canComment) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        goalId: id,
        userId: currentUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "ADD_COMMENT",
        details: `Added comment to goal "${goal.title}"`,
        userId: currentUserId,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(
      "POST /api/goals/[id]/comments error:",
      error
    );

    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: String(error),
      },
      { status: 500 }
    );
  }
}