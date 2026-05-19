import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding enterprise database with customized hackathon submission credentials...');

  // Helper to hash passwords securely
  const hash = async (pwd: string) => await bcrypt.hash(pwd, 10);

  // 1. Create Admins
  const adminPassword = await hash('Password123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@enterprise.com' },
    update: { password: adminPassword },
    create: {
      name: 'Sarah Connor',
      email: 'admin@enterprise.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Managers
  const pmPassword = await hash('projectmgr');
  const managerPm = await prisma.user.upsert({
    where: { email: 'project@manager.com' },
    update: { password: pmPassword },
    create: {
      name: 'James Carter',
      email: 'project@manager.com',
      password: pmPassword,
      role: 'MANAGER',
    },
  });

  const salesPassword = await hash('saless');
  const managerSales = await prisma.user.upsert({
    where: { email: 'salesmgr@gmail.com' },
    update: { password: salesPassword },
    create: {
      name: 'Helen Ross',
      email: 'salesmgr@gmail.com',
      password: salesPassword,
      role: 'MANAGER',
    },
  });

  // 3. Create Employees
  const nehaPassword = await hash('neha1');
  const employeeNeha = await prisma.user.upsert({
    where: { email: 'neha@emp.com' },
    update: { password: nehaPassword, managerId: managerPm.id },
    create: {
      name: 'Neha Sharma',
      email: 'neha@emp.com',
      password: nehaPassword,
      role: 'EMPLOYEE',
      managerId: managerPm.id,
    },
  });

  const swethaPassword = await hash('swetha1');
  const employeeSwetha = await prisma.user.upsert({
    where: { email: 'swetha@emp.com' },
    update: { password: swethaPassword, managerId: managerPm.id },
    create: {
      name: 'Swetha Patel',
      email: 'swetha@emp.com',
      password: swethaPassword,
      role: 'EMPLOYEE',
      managerId: managerPm.id,
    },
  });

  const preetiPassword = await hash('preeti1');
  const employeePreeti = await prisma.user.upsert({
    where: { email: 'preeti@emp.com' },
    update: { password: preetiPassword, managerId: managerSales.id },
    create: {
      name: 'Preeti Deshmukh',
      email: 'preeti@emp.com',
      password: preetiPassword,
      role: 'EMPLOYEE',
      managerId: managerSales.id,
    },
  });

  // 4. Create Goals
  console.log('Seeding Goals...');
  
  // Clean existing goals first to ensure fresh seed
  await prisma.goal.deleteMany({});
  await prisma.quarterlyReview.deleteMany({});
  await prisma.checkIn.deleteMany({});

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
      userId: employeeNeha.id,
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
      userId: employeeNeha.id,
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
      userId: employeeSwetha.id,
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
      userId: employeeNeha.id,
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
      userId: employeeNeha.id,
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
      userId: employeeSwetha.id,
    },
  });

  // 6. Create AuditLogs (including rework / escalations)
  console.log('Seeding AuditLogs...');
  await prisma.auditLog.deleteMany({});
  
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
      userId: managerPm.id,
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
      userId: managerPm.id,
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

  console.log('Database seeded successfully with custom hackathon credentials.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
