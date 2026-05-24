import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COMPANY_CODE = "ENTERPRISE2026";
const VALID_ROLES = ["EMPLOYEE", "MANAGER", "ADMIN"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid registration request" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid registration request" },
        { status: 400 }
      );
    }

    const registration = body as Record<string, unknown>;

    const name =
      typeof registration.name === "string" ? registration.name.trim() : "";
    const email = normalizeEmail(registration.email);
    const password =
      typeof registration.password === "string" ? registration.password : "";
    const companyCode =
      typeof registration.companyCode === "string"
        ? registration.companyCode.trim()
        : "";
    const managerEmail = normalizeEmail(registration.managerEmail);
    const requestedRole =
      typeof registration.role === "string"
        ? registration.role.toUpperCase()
        : "EMPLOYEE";

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (companyCode !== COMPANY_CODE) {
      return NextResponse.json(
        { message: "Invalid company code" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(requestedRole as ValidRole)) {
      return NextResponse.json(
        { message: "Invalid role selected" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const normalizedRole = requestedRole as ValidRole;
    let managerId: string | undefined;

    if (normalizedRole === "EMPLOYEE" && managerEmail) {
      const manager = await prisma.user.findUnique({
        where: { email: managerEmail },
        select: { id: true, role: true },
      });

      if (!manager || manager.role !== "MANAGER") {
        return NextResponse.json(
          { message: "Manager email must belong to an existing manager" },
          { status: 400 }
        );
      }

      managerId = manager.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: normalizedRole,
        ...(managerId ? { managerId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER] Registration failed:", error);

    return NextResponse.json(
      {
        message: "Registration failed",
      },
      { status: 500 }
    );
  }
}
