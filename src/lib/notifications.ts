import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";
import { getActiveSemesterIds } from "@/lib/season";

export async function createNotification(params: {
  userId: string;
  title: string;
  message?: string;
  type?: NotificationType;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "GENERAL",
      entityType: params.entityType,
      entityId: params.entityId,
      actionUrl: params.actionUrl,
    },
  });
}

export async function notifyStudentsInDepartment(params: {
  departmentId: string;
  title: string;
  message?: string;
  type?: NotificationType;
  actionUrl?: string;
}) {
  const activeSemesterIds = await getActiveSemesterIds();
  const enrollments = await prisma.studentSemesterEnrollment.findMany({
    where: {
      departmentId: params.departmentId,
      isActive: true,
      ...(activeSemesterIds.length ? { academicSemesterId: { in: activeSemesterIds } } : {}),
      student: { userId: { not: null } },
    },
    select: { student: { select: { userId: true } } },
  });
  const userIds = [...new Set(enrollments.map((e) => e.student.userId).filter(Boolean))] as string[];
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "GENERAL",
      actionUrl: params.actionUrl,
    })),
  });
}

export async function notifySection(params: {
  departmentId: string;
  title: string;
  message?: string;
  type?: NotificationType;
  actionUrl?: string;
}) {
  const activeSemesterIds = await getActiveSemesterIds();
  const enrollments = await prisma.studentSemesterEnrollment.findMany({
    where: {
      departmentId: params.departmentId,
      isActive: true,
      ...(activeSemesterIds.length ? { academicSemesterId: { in: activeSemesterIds } } : {}),
      student: { userId: { not: null } },
    },
    select: { student: { select: { userId: true } } },
  });
  const userIds = [...new Set(enrollments.map((e) => e.student.userId).filter(Boolean))] as string[];
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "GENERAL",
      actionUrl: params.actionUrl,
    })),
  });
}

export async function getNotificationsForUser(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}
