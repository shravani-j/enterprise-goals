import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    console.log("[REGISTER] Starting registration request");

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[REGISTER] JSON parse error:", parseError);
      return NextResponse.json({ message: "Invalid JSON in request body" }, { status: 400 });
    }

    const { name, email, password, companyCode, role, managerEmail } = body;
    console.log("[REGISTER] Request data:", { name, email, role, hasPassword: !!password, companyCode });

    if (!name || !email || !password) {
      console.log("[REGISTER] Validation failed - missing fields:", { name: !!name, email: !!email, password: !!password });
      return NextResponse.json({ message: "Missing required fields: name, email, password" }, { status: 400 });
    }

    if (companyCode !== "ENTERPRISE2026") {
      console.log("[REGISTER] Invalid company code:", companyCode);
      return NextResponse.json({ message: "Invalid company code. Must be: ENTERPRISE2026" }, { status: 403 });
    }

    console.log("[REGISTER] Checking if user exists:", email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("[REGISTER] User already exists:", email);
      return NextResponse.json({ message: "User already exists with this email" }, { status: 409 });
    }

    console.log("[REGISTER] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role && ["EMPLOYEE", "MANAGER", "ADMIN"].includes(role) ? role : "EMPLOYEE";
    console.log("[REGISTER] Assigned role:", assignedRole);

    let managerIdToSet: string | null = null;
    if (assignedRole === "EMPLOYEE" && managerEmail) {
      console.log("[REGISTER] EMPLOYEE role detected, looking for manager:", managerEmail);
      const manager = await prisma.user.findFirst({
        where: { email: managerEmail, role: "MANAGER" },
      });
      if (!manager) {
        console.log("[REGISTER] Manager not found:", managerEmail);
        return NextResponse.json({
          message: `Manager with email "${managerEmail}" and MANAGER role not found`
        }, { status: 400 });
      }
      managerIdToSet = manager.id;
      console.log("[REGISTER] Manager found:", { managerId: managerIdToSet, managerEmail });
    }

    console.log("[REGISTER] About to create user in database:", {
      email,
      name,
      role: assignedRole,
      managerId: managerIdToSet,
    });

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: assignedRole,
        managerId: managerIdToSet,
      },
    });

    console.log("[REGISTER] User created successfully:", {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER] Caught error:", error);
    if (error instanceof Error) {
      console.error("[REGISTER] Error message:", error.message);
      console.error("[REGISTER] Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        message: "Registration failed - check server logs",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


