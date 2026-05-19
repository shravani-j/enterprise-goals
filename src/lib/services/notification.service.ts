import { prisma } from "../prisma";

export type NotificationType = 
  | "GOAL_SUBMITTED"
  | "GOAL_APPROVED"
  | "GOAL_RETURNED"
  | "CHECK_IN_REMINDER"
  | "ESCALATION"
  | "GOAL_SHARED";

interface SendNotificationOptions {
  userId: string;
  message: string;
  type: NotificationType;
  emailSubject?: string;
  emailBody?: string;
}

export class NotificationService {
  /**
   * Sends an in-app notification and attempts to send an email.
   */
  static async send(options: SendNotificationOptions) {
    try {
      // 1. Create In-App Notification
      await prisma.notification.create({
        data: {
          userId: options.userId,
          message: options.message,
          isRead: false,
        }
      });

      // 2. Mock Email Sending (Nodemailer/Resend implementation)
      // In a real environment, you would use resend.emails.send() here.
      console.log(`[NotificationService] Sending email to User ${options.userId}`);
      console.log(`Subject: ${options.emailSubject || options.type}`);
      console.log(`Body: ${options.emailBody || options.message}`);
      
      return { success: true };
    } catch (error) {
      console.error("[NotificationService] Failed to send notification:", error);
      return { success: false, error };
    }
  }

  /**
   * Dispatches notifications to managers when an employee submits a goal.
   */
  static async notifyManagerOnSubmit(employeeId: string, goalTitle: string) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: { manager: true }
    });

    if (employee?.manager) {
      await this.send({
        userId: employee.manager.id,
        type: "GOAL_SUBMITTED",
        message: `${employee.name} has submitted a new goal for your approval: "${goalTitle}"`,
        emailSubject: `Action Required: New Goal Submission from ${employee.name}`,
        emailBody: `Please log in to the portal to review and approve the new goal.`
      });
    }
  }

  /**
   * Dispatches notifications to employees when a goal is approved/returned.
   */
  static async notifyEmployeeOnReview(employeeId: string, goalTitle: string, status: "APPROVED" | "RETURNED_FOR_REWORK") {
    const action = status === "APPROVED" ? "approved" : "returned for rework";
    await this.send({
      userId: employeeId,
      type: status === "APPROVED" ? "GOAL_APPROVED" : "GOAL_RETURNED",
      message: `Your goal "${goalTitle}" has been ${action}.`,
      emailSubject: `Goal Update: ${goalTitle}`,
      emailBody: `Your manager has ${action} your goal. Please review the comments.`
    });
  }
}
