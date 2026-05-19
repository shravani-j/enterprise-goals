import { prisma } from "../prisma";
import { NotificationService } from "./notification.service";

export class EscalationService {
  /**
   * Scans for goals that have been in "SUBMITTED" state for too long (> 3 days)
   * and escalates them to Skip-Level managers or Admin.
   */
  static async processPendingApprovals() {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 3); // 3 days ago

    const overdueGoals = await prisma.goal.findMany({
      where: {
        status: "SUBMITTED",
        updatedAt: {
          lt: thresholdDate
        }
      },
      include: {
        user: { include: { manager: true } }
      }
    });

    for (const goal of overdueGoals) {
      if (goal.user.manager) {
        // Escalate to admin or skip-level
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        if (admin) {
          await NotificationService.send({
            userId: admin.id,
            type: "ESCALATION",
            message: `ESCALATION: Goal "${goal.title}" by ${goal.user.name} has been pending approval from ${goal.user.manager.name} for over 3 days.`,
            emailSubject: `Escalation: Pending Goal Approval`,
            emailBody: `Please review this bottleneck in the system.`
          });

          await prisma.auditLog.create({
            data: {
              action: "ESCALATION",
              details: `Goal ${goal.id} escalated due to manager timeout.`,
              userId: admin.id
            }
          });
        }
      }
    }

    return overdueGoals.length;
  }
}
