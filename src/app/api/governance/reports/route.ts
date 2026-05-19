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
    const exportFormat = searchParams.get("export");
    const department = searchParams.get("department");
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
    let userFilter: any = {};

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

    // Fetch goals
    const goals = await prisma.goal.findMany({
      where: {
        ...dateFilter,
        user: {
          ...userFilter,
          ...(query && {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } }
            ]
          })
        },
        ...(query && !employeeId && {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } }
          ]
        })
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        quarterlyReviews: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Create a ReportExport log if downloading
    if (exportFormat === "csv") {
      await prisma.reportExport.create({
        data: {
          reportType: "ACHIEVEMENT",
          format: "CSV",
          fileName: `achievement-report-${Date.now()}.csv`,
          filters: JSON.stringify({ department, employeeId, query, startDateParam, endDateParam }),
          userId: currentUserId
        }
      });

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

      const csvRows = goals.map((g: any) => {
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
