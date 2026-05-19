import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const currentUserId = session.user.id;

    if (role !== "MANAGER" && role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let reports: any[] = [];

    if (role === "MANAGER") {
      reports = await prisma.user.findMany({
        where: { managerId: currentUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { name: "asc" }
      });
    } else if (role === "ADMIN") {
      reports = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          manager: {
            select: { id: true, name: true }
          }
        },
        orderBy: { name: "asc" }
      });
    }

    return NextResponse.json(reports);
  } catch (error) {
    console.error("GET /api/users/reports error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 });
  }
}
