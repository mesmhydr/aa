"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";

const announcementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  audience: z.enum(["INSTITUTION", "DEPARTMENT", "SECTION", "COURSE", "PROGRAM"]),
  departmentId: z.string().optional().or(z.literal("")),
  programId: z.string().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});

export async function saveAnnouncement(input: z.infer<typeof announcementSchema>) {
  try {
    const access = await requireAccess();
    requirePermission(access, "announcement.create");
    const d = announcementSchema.parse(input);
    const institution = await prisma.institution.findFirst();
    if (!institution) return { ok: false as const, error: "No institution configured" };

    let announcementId: string;
    if (d.id) {
      const existing = await prisma.announcement.findUnique({ where: { id: d.id } });
      if (!existing) return { ok: false as const, error: "Announcement not found" };
      await prisma.announcement.update({
        where: { id: d.id },
        data: {
          title: d.title,
          message: d.message,
          audience: d.audience,
          departmentId: d.departmentId || null,
          expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        },
      });
      announcementId = d.id;
    } else {
      const a = await prisma.announcement.create({
        data: {
          institutionId: institution.id,
          title: d.title,
          message: d.message,
          audience: d.audience,
          departmentId: d.departmentId || null,
          expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
          publishedById: access.userId,
        },
      });
      announcementId = a.id;
    }

    await notifyAudience(access.userId, d, announcementId);

    await logAudit({ userId: access.userId, action: d.id ? "announcement.update" : "announcement.create", module: "announcement", entityType: "Announcement", entityId: announcementId, newValues: { title: d.title, audience: d.audience } });
    revalidatePath("/announcements");
    return { ok: true as const, id: announcementId };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

async function notifyAudience(fromUserId: string, d: { title: string; message: string; audience: string; departmentId?: string }, announcementId: string) {
  const users: Array<{ id: string }> = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT DISTINCT u."id" FROM "user" u
     LEFT JOIN "UserRole" ur ON ur."userId" = u."id"
     LEFT JOIN "Student" st ON st."userId" = u."id"
     LEFT JOIN "Faculty" f ON f."userId" = u."id"
     LEFT JOIN "StudentSemesterEnrollment" e ON e."studentId" = st."id"
     LEFT JOIN "Section" s ON s."id" = e."sectionId"
     LEFT JOIN "CourseOffering" co ON co."sectionId" = s."id"
     LEFT JOIN "Course" c ON c."id" = co."courseId"
     WHERE u."id" != $1
       AND (
         $2 = 'INSTITUTION'
         OR ($2 = 'DEPARTMENT' AND (ur."departmentId" = $3 OR st."departmentId" = $3 OR f."departmentId" = $3))
         OR ($2 = 'SECTION' AND s."departmentId" = $3)
         OR ($2 = 'PROGRAM' AND st."departmentId" = $3)
         OR ($2 = 'COURSE' AND c."departmentId" = $3)
       )
       AND u."id" IS NOT NULL`,
    fromUserId,
    d.audience,
    d.departmentId || null
  );

  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: d.title,
      message: d.message,
      type: "ANNOUNCEMENT",
      entityType: "Announcement",
      entityId: announcementId,
      actionUrl: "/announcements",
    })),
  });
}

export async function toggleAnnouncement(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "announcement.edit");
    await prisma.announcement.update({ where: { id }, data: { isActive } });
    revalidatePath("/announcements");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "announcement.edit");
    await prisma.announcement.delete({ where: { id } });
    await logAudit({ userId: access.userId, action: "announcement.delete", module: "announcement", entityType: "Announcement", entityId: id });
    revalidatePath("/announcements");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function markNotificationRead(id: string) {
  try {
    const access = await requireAccess();
    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function markAllNotificationsRead() {
  try {
    const access = await requireAccess();
    await prisma.notification.updateMany({
      where: { userId: access.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    revalidatePath("/notifications");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}