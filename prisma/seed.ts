import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding enterprise database...');

  const hashedPassword = await bcrypt.hash('Password123', 10);

  // 1. Create Admins
  const admin = await prisma.user.upsert({
    where: { email: 'admin@enterprise.com' },
    update: { password: hashedPassword },
    create: {
      name: 'Sarah Connor',
      email: 'admin@enterprise.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Managers
  const manager = await prisma.user.upsert({
    where: { email: 'manager@enterprise.com' },
    update: { password: hashedPassword },
    create: {
      name: 'James Carter',
      email: 'manager@enterprise.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });

  const managerHr = await prisma.user.upsert({
    where: { email: 'managerhr@gmail.com' },
    update: { password: hashedPassword },
    create: {
      name: 'Helen Ross',
      email: 'managerhr@gmail.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });

  // 3. Create Employees
  const employee1 = await prisma.user.upsert({
    where: { email: 'employee1@enterprise.com' },
    update: { password: hashedPassword, managerId: manager.id },
    create: {
      name: 'John Doe',
      email: 'employee1@enterprise.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager.id,
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'employee2@enterprise.com' },
    update: { password: hashedPassword, managerId: manager.id },
    create: {
      name: 'Jane Smith',
      email: 'employee2@enterprise.com',
      password: hashedPassword,
      role: 'EMPLOYEE',
      managerId: manager.id,
    },
  });

  // 4. Create Goals
  console.log('Seeding Goals...');
  const goal1 = await prisma.goal.create({
    data: {
      title: 'Increase Core Platform Scalability',
      description: 'Optimize DB connections and migrate schema to enterprise standards.',
      weightage: 30,
      status: 'APPROVED',
      priority: 'HIGH',
      startDate: new Date('2026-05-01'),
      dueDate: new Date('2026-08-31'),
      progress: 60,
      uomType: 'MIN',
      target: '99.99%',
      isShared: false,
      userId: employee1.id,
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      title: 'Automate Infrastructure Provisioning',
      description: 'Build CI/CD pipelines and deployment playbooks for secure releases.',
      weightage: 20,
      status: 'APPROVED',
      priority: 'MEDIUM',
      startDate: new Date('2026-05-01'),
      dueDate: new Date('2026-08-31'),
      progress: 80,
      uomType: 'ZERO',
      target: '0 manual deployments',
      isShared: false,
      userId: employee1.id,
    },
  });

  const goal3 = await prisma.goal.create({
    data: {
      title: 'Launch Enterprise Security Audit',
      description: 'Implement secure headers, rate limits, and audit logs.',
      weightage: 25,
      status: 'APPROVED',
      priority: 'HIGH',
      startDate: new Date('2026-05-01'),
      dueDate: new Date('2026-08-31'),
      progress: 100,
      uomType: 'MIN',
      target: '100% compliance',
      isShared: false,
      userId: employee2.id,
    },
  });

  // 5. Create CheckIns & Quarterly Reviews
  console.log('Seeding CheckIns and reviews...');
  await prisma.checkIn.create({
    data: {
      progress: 60,
      notes: 'Completed LibSQL DB driver setup and optimized Prisma index pools.',
      achievements: 'Migration of database is done successfully.',
      blockers: 'None.',
      nextSteps: 'Work on performance optimization of CSV reporting next.',
      goalId: goal1.id,
      userId: employee1.id,
    },
  });

  await prisma.quarterlyReview.create({
    data: {
      quarter: 'Q1',
      planned: 'Complete core connection pooling and driver integration.',
      actual: 'LibSQL adapter configured and dev database fully optimized.',
      progress: 60,
      managerFeedback: 'Exceptional database architecture progress. Keep up the high standards!',
      status: 'On Track',
      goalId: goal1.id,
      userId: employee1.id,
    },
  });

  await prisma.quarterlyReview.create({
    data: {
      quarter: 'Q1',
      planned: 'Pass full OWASP Top-10 security scan and audit.',
      actual: 'Completed full scan and deployed vercel.json headers.',
      progress: 100,
      managerFeedback: 'Outstanding work. 100% compliance target achieved early.',
      status: 'Completed',
      goalId: goal3.id,
      userId: employee2.id,
    },
  });

  // 6. Create AuditLogs (including rework / escalations)
  console.log('Seeding AuditLogs...');
  await prisma.auditLog.create({
    data: {
      action: 'APPROVE_GOAL',
      details: 'Goal "Increase Core Platform Scalability" approved by Manager.',
      field: 'status',
      previousValue: 'SUBMITTED',
      newValue: 'APPROVED',
      role: 'MANAGER',
      actionType: 'APPROVAL',
      goalId: goal1.id,
      userId: manager.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'REWORK_GOAL',
      details: 'Goal "Automate Infrastructure Provisioning" returned for rework by Manager.',
      field: 'status',
      previousValue: 'SUBMITTED',
      newValue: 'RETURNED_FOR_REWORK',
      role: 'MANAGER',
      actionType: 'REWORK_REQUEST',
      goalId: goal2.id,
      userId: manager.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'ADMIN_OVERRIDE',
      details: 'Admin override triggered by System Admin for security compliance review.',
      field: 'status',
      previousValue: 'DRAFT',
      newValue: 'APPROVED',
      role: 'ADMIN',
      actionType: 'ADMIN_OVERRIDE',
      goalId: goal3.id,
      userId: admin.id,
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
