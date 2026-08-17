"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";

const facultySchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100).optional(),
  departmentId: z.string().min(1),
  designation: z.string().min(1).max(80),
  qualification: z.string().optional().or(z.literal("")),
  specialization: z.string().optional().or(z.literal("")),
  experienceYears: z.coerce.number().min(0).max(60).optional().or(z.literal("").transform(() => undefined)),
  joiningDate: z.string().optional().or(z.literal("")),
  employmentType: z.string().optional(),
  phone: z.string().optional().or(z.literal("")),
});

export async function createFaculty(input: z.infer<typeof facultySchema>) {
  try {
    const access = await requireAccess();
    const d = facultySchema.parse(input);
    const isEdit = Boolean(d.id);
    requirePermission(access, isEdit ? "faculty.edit" : "faculty.create");

    const empExists = await prisma.faculty.findFirst({
      where: { employeeId: d.employeeId.toUpperCase(), ...(isEdit ? { id: { not: d.id } } : {}) },
    });
    if (empExists) return { ok: false as const, error: `Employee ID ${d.employeeId} already exists` };

    if (isEdit) {
      const existing = await prisma.faculty.findUnique({ where: { id: d.id }, select: { id: true } });
      if (!existing) return { ok: false as const, error: "Faculty not found" };
      await prisma.faculty.update({
        where: { id: d.id },
        data: {
          employeeId: d.employeeId.toUpperCase(),
          departmentId: d.departmentId,
          designation: d.designation,
          qualification: d.qualification || null,
          specialization: d.specialization || null,
          experienceYears: d.experienceYears ?? null,
          joiningDate: d.joiningDate ? new Date(d.joiningDate) : null,
          employmentType: (d.employmentType as never) ?? "PERMANENT",
          email: d.email,
          phone: d.phone || null,
        },
      });
      const user = await prisma.faculty.findUnique({ where: { id: d.id }, select: { userId: true } }).then((f) => f?.userId);
      if (user) {
        await prisma.user.update({ where: { id: user }, data: { name: d.name } });
      }
      await logAudit({
        userId: access.userId, action: "faculty.update", module: "faculty",
        entityType: "Faculty", entityId: d.id,
        newValues: { employeeId: d.employeeId.toUpperCase(), name: d.name },
      });
      revalidatePath("/faculty");
      return { ok: true as const, id: d.id };
    }

    let userId: string | null = null;
    let user = await prisma.user.findUnique({ where: { email: d.email } });
    if (user) {
      userId = user.id;
    } else if (d.password) {
      await auth.api.signUpEmail({ body: { name: d.name, email: d.email, password: d.password } });
      user = await prisma.user.findUnique({ where: { email: d.email } });
      if (!user) return { ok: false as const, error: "Failed to create login" };
      userId = user.id;
      await prisma.user.update({ where: { id: user.id }, data: { role: "FACULTY", status: "ACTIVE" } });
    }

    const faculty = await prisma.faculty.create({
      data: {
        userId,
        employeeId: d.employeeId.toUpperCase(),
        departmentId: d.departmentId,
        designation: d.designation,
        qualification: d.qualification || null,
        specialization: d.specialization || null,
        experienceYears: d.experienceYears ?? null,
        joiningDate: d.joiningDate ? new Date(d.joiningDate) : null,
        employmentType: (d.employmentType as never) ?? "PERMANENT",
        email: d.email,
        phone: d.phone || null,
      },
    });

    if (userId) {
      const role = await prisma.role.findUnique({ where: { code: "FACULTY" } });
      if (role) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId, roleId: role.id } },
          update: { departmentId: d.departmentId },
          create: { userId, roleId: role.id, departmentId: d.departmentId },
        });
      }
    }

    await logAudit({
      userId: access.userId, action: "faculty.create", module: "faculty",
      entityType: "Faculty", entityId: faculty.id,
      newValues: { employeeId: faculty.employeeId, name: d.name },
    });
    revalidatePath("/faculty");
    return { ok: true as const, id: faculty.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteFaculty(id: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "faculty.edit");
    const faculty = await prisma.faculty.findUnique({ where: { id }, select: { id: true, userId: true, employeeId: true } });
    if (!faculty) return { ok: false as const, error: "Faculty not found" };

    // Remove the records that reference the faculty so the delete isn't blocked by RESTRICT FKs.
    // FacultyCourse cascades automatically; timetable entries keep a plain (non-FK) reference we null out.
    await prisma.$transaction([
      prisma.facultyAssignment.deleteMany({ where: { facultyId: id } }),
      prisma.examInvigilator.deleteMany({ where: { facultyId: id } }),
      prisma.timetableEntry.updateMany({ where: { facultyId: id }, data: { facultyId: null } }),
      prisma.faculty.delete({ where: { id } }),
    ]);

    // Remove the linked login too, if possible (some linked records like audit logs block deletion).
    let userRemoved = false;
    if (faculty.userId) {
      try {
        await prisma.user.delete({ where: { id: faculty.userId } });
        userRemoved = true;
      } catch {
        // Leave the login account; the faculty record itself is gone.
      }
    }

    await logAudit({
      userId: access.userId, action: "faculty.delete", module: "faculty",
      entityType: "Faculty", entityId: id,
      newValues: { employeeId: faculty.employeeId, userRemoved },
    });
    revalidatePath("/faculty");
    return { ok: true as const, userRemoved };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setFacultyActive(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "faculty.edit");
    await prisma.faculty.update({ where: { id }, data: { isActive } });
    await logAudit({ userId: access.userId, action: isActive ? "faculty.activate" : "faculty.deactivate", module: "faculty", entityType: "Faculty", entityId: id, newValues: { isActive } });
    revalidatePath("/faculty");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}