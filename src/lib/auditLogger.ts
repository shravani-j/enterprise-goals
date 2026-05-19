import { prisma } from "@/lib/prisma";

export async function logAudit({
  action,
  details,
  field,
  previousValue,
  newValue,
  role,
  actionType,
  goalId,
  userId,
}: {
  action: string;
  details?: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  role?: string;
  actionType?: string;
  goalId?: string;
  userId?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details,
        field,
        previousValue: previousValue ? String(previousValue) : null,
        newValue: newValue ? String(newValue) : null,
        role,
        actionType,
        goalId,
        userId,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
