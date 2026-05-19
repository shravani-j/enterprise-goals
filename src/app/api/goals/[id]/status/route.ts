import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const body = await req.json();

    const updatedGoal = await prisma.goal.update({
      where: {
        id,
      },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update goal status" },
      { status: 500 }
    );
  }
}