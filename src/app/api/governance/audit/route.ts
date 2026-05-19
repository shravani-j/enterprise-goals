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

    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get("actionType");
    const query = searchParams.get("query") || "";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const currentUserId = session.user.id;
    const role = session.user.role;

    // Enforce role-based access to Audit Trail
    if (role === "EMPLOYEE") {
      return NextResponse.json({ message: "Forbidden: Employees do not have access to governance audit logs." }, { status: 403 });
    }

    let userFilter: any = {};
    if (role === "MANAGER") {
      // Manager can only view audit logs of their direct reports
      userFilter = {
        user: {
          OR: [
            { id: currentUserId },
            { managerId: currentUserId }
          ]
        }
      };
    } else if (role === "ADMIN") {
      // Admin sees everything
      userFilter = {};
    }

    // Filter by actionType
    let typeFilter: any = {};
    if (actionType) {
      typeFilter = { actionType };
    }

    // Date filters
    let dateFilter: any = {};
    const parsedStart = startDateParam && startDateParam.trim() !== "" ? new Date(startDateParam) : null;
    const parsedEnd = endDateParam && endDateParam.trim() !== "" ? new Date(endDateParam) : null;
    
    const startValid = parsedStart && !isNaN(parsedStart.getTime());
    const endValid = parsedEnd && !isNaN(parsedEnd.getTime());

    if (startValid || endValid) {
      dateFilter = {
        createdAt: {
          ...(startValid && { gte: parsedStart }),
          ...(endValid && { lte: parsedEnd })
        }
      };
    }

    // Search query on User name / email, Action description
    let searchQuery: any = {};
    if (query) {
      searchQuery = {
        OR: [
          { action: { contains: query } },
          { details: { contains: query } },
          { user: { name: { contains: query } } },
          { user: { email: { contains: query } } }
        ]
      };
    }

    const totalLogs = await prisma.auditLog.count({
      where: {
        ...userFilter,
        ...typeFilter,
        ...dateFilter,
        ...searchQuery
      }
    });

    const logs = await prisma.auditLog.findMany({
      where: {
        ...userFilter,
        ...typeFilter,
        ...dateFilter,
        ...searchQuery
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    });

    return NextResponse.json({
      data: logs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        totalPages: Math.ceil(totalLogs / limit)
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch audit logs" }, { status: 500 });
  }
}
