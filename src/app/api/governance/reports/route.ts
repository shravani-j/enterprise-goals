import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDateBoundary(value: string | null, boundary: "start" | "end") {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(
    `${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}Z`
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function buildGoalDateFilter(startDate: Date | null, endDate: Date | null): Prisma.GoalWhereInput {
  if (!startDate && !endDate) {
    return {};
  }

  const rangeStart = startDate ?? new Date(0);
  const rangeEnd = endDate ?? new Date("9999-12-31T23:59:59.999Z");

  return {
    OR: [
      {
        startDate: { lte: rangeEnd },
        dueDate: { gte: rangeStart },
      },
      {
        startDate: null,
        dueDate: { gte: rangeStart, lte: rangeEnd },
      },
      {
        dueDate: null,
        startDate: { gte: rangeStart, lte: rangeEnd },
      },
      {
        startDate: null,
        dueDate: null,
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
    ],
  };
}

async function normalizeLegacyGoalDateStorage() {
  for (const column of ["startDate", "dueDate", "createdAt", "updatedAt"]) {
    await prisma.$executeRawUnsafe(
      `UPDATE Goal SET ${column} = CAST(strftime('%s', ${column}) AS INTEGER) * 1000 WHERE typeof(${column}) = 'text'`
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const exportFormat = searchParams.get("export");
    const employeeId = searchParams.get("employeeId");
    const query = searchParams.get("query") || "";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const currentUserId = session.user.id;
    const role = session.user.role;

    // Build query conditions based on user role and permissions
    let userFilter: Prisma.UserWhereInput = {};

    if (role === "EMPLOYEE") {
      userFilter = { id: currentUserId };
    } else if (role === "MANAGER") {
      userFilter = {
        OR: [
          { id: currentUserId },
          { managerId: currentUserId }
        ]
      };
    } else if (role === "ADMIN") {
      // Admin sees everything, optionally filtering by specific user if provided
      if (employeeId) {
        userFilter = { id: employeeId };
      }
    }

    const parsedStart = parseDateBoundary(startDateParam, "start");
    const parsedEnd = parseDateBoundary(endDateParam, "end");
    const dateFilter = buildGoalDateFilter(parsedStart, parsedEnd);
    const queryFilter: Prisma.GoalWhereInput = query
      ? {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { user: { name: { contains: query } } },
            { user: { email: { contains: query } } },
          ],
        }
      : {};

    await normalizeLegacyGoalDateStorage();

    // Fetch goals
    const goals = await prisma.goal.findMany({
      where: {
        user: {
          ...userFilter,
        },
        AND: [dateFilter, queryFilter],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Create a ReportExport log if downloading
    if (exportFormat === "csv") {
      // Note: reportExport is not defined in the Prisma schema, so we skip logging the export to the database.
      // If logging is required, add ReportExport model to schema.prisma and run prisma db push.

      // Construct CSV data
      const csvHeaders = [
        "Goal ID",
        "Employee Name",
        "Employee Email",
        "Goal Title",
        "Weightage (%)",
        "Priority",
        "Status",
        "UoM Type",
        "Target",
        "Current Progress (%)",
        "Created At"
      ].join(",");

      const csvRows = goals.map((g) => {
        return [
          `"${g.id}"`,
          `"${g.user.name || 'N/A'}"`,
          `"${g.user.email}"`,
          `"${g.title.replace(/"/g, '""')}"`,
          g.weightage,
          `"${g.priority}"`,
          `"${g.status}"`,
          `"${g.uomType}"`,
          `"${(g.target || "").replace(/"/g, '""')}"`,
          `${g.progress}%`,
          `"${new Date(g.createdAt).toLocaleDateString()}"`
        ].join(",");
      });

      const csvContent = [csvHeaders, ...csvRows].join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="achievement-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Paginated JSON response for UI table
    const paginatedGoals = goals.slice(skip, skip + limit);
    
    return NextResponse.json({
      data: paginatedGoals,
      pagination: {
        total: goals.length,
        page,
        limit,
        totalPages: Math.ceil(goals.length / limit)
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 });
  }
}
