"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAccess, requirePermission } from "@/lib/access";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { getCurrentAcademicYear } from "@/lib/season";

const studentSchema = z.object({
  id: z.string().optional(),
  institutionId: z.string().min(1),
  usn: z.string().min(1).max(20),
  firstName: z.string().min(1).max(120),
  lastName: z.string().optional().or(z.literal("")),
  email: z.string().email(),
  password: z.string().min(8).max(100).optional(),
  departmentId: z.string().min(1).optional(),
  programId: z.string().min(1),
  schemeId: z.string().min(1),
  admissionYear: z.coerce.number().int().min(2000).max(2100),
  batchId: z.string().optional(),
  admissionType: z.string().optional(),
  dob: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  personalEmail: z.string().optional().or(z.literal("")),
  fatherName: z.string().optional().or(z.literal("")),
  motherName: z.string().optional().or(z.literal("")),
  fatherPhone: z.string().optional().or(z.literal("")),
  motherPhone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

async function ensureBatch(d: z.infer<typeof studentSchema>) {
  if (d.batchId) return d.batchId;
  const batch = await prisma.batch.upsert({
    where: { programId_admissionYear: { programId: d.programId, admissionYear: d.admissionYear } },
    update: {},
    create: {
      institutionId: d.institutionId,
      programId: d.programId,
      admissionYear: d.admissionYear,
      name: String(d.admissionYear),
      schemeId: d.schemeId,
    },
  });
  return batch.id;
}

export async function createStudent(input: z.infer<typeof studentSchema>) {
  try {
    const access = await requireAccess();
    const d = studentSchema.parse(input);
    const isEdit = Boolean(d.id);
    requirePermission(access, isEdit ? "student.edit" : "student.create");

    const usnExists = await prisma.student.findFirst({
      where: { institutionId: d.institutionId, usn: d.usn.toUpperCase(), ...(isEdit ? { id: { not: d.id } } : {}) },
    });
    if (usnExists) return { ok: false as const, error: `USN ${d.usn} already exists` };

    const program = await prisma.program.findUnique({
      where: { id: d.programId },
      select: { departmentId: true },
    });
    if (!program) return { ok: false as const, error: "Program not found" };

    if (d.id) {
      const existing = await prisma.student.findUnique({ where: { id: d.id }, select: { id: true, institutionId: true } });
      if (!existing) return { ok: false as const, error: "Student not found" };
      const batchId = await ensureBatch(d);
      await prisma.student.update({
        where: { id: d.id },
        data: {
          usn: d.usn.toUpperCase(),
          firstName: d.firstName,
          lastName: d.lastName || null,
          programId: d.programId,
          batchId,
          schemeId: d.schemeId,
          admissionType: d.admissionType || "REGULAR",
        },
      });
      await prisma.studentProfile.upsert({
        where: { studentId: d.id },
        update: {
          dob: d.dob ? new Date(d.dob) : null,
          gender: d.gender ? (d.gender as never) : null,
          phone: d.phone || null,
          personalEmail: d.personalEmail || null,
          address: d.address || null,
        },
        create: {
          studentId: d.id,
          dob: d.dob ? new Date(d.dob) : null,
          gender: d.gender ? (d.gender as never) : null,
          phone: d.phone || null,
          personalEmail: d.personalEmail || null,
          address: d.address || null,
        },
      });
      await prisma.parent.upsert({
        where: { studentId: d.id },
        update: {
          fatherName: d.fatherName || null,
          motherName: d.motherName || null,
          fatherPhone: d.fatherPhone || null,
          motherPhone: d.motherPhone || null,
        },
        create: {
          studentId: d.id,
          fatherName: d.fatherName || null,
          motherName: d.motherName || null,
          fatherPhone: d.fatherPhone || null,
          motherPhone: d.motherPhone || null,
        },
      });
      await logAudit({
        userId: access.userId, action: "student.update", module: "student",
        entityType: "Student", entityId: d.id,
        newValues: { usn: d.usn.toUpperCase(), name: d.firstName },
      });
      revalidatePath("/students");
      return { ok: true as const, id: d.id };
    }

    let userId: string | null = null;
    let user = await prisma.user.findUnique({ where: { email: d.email } });
    if (user) {
      userId = user.id;
    } else if (d.password) {
      await auth.api.signUpEmail({ body: { name: d.firstName, email: d.email, password: d.password } });
      user = await prisma.user.findUnique({ where: { email: d.email } });
      if (!user) return { ok: false as const, error: "Failed to create login" };
      userId = user.id;
      await prisma.user.update({ where: { id: user.id }, data: { role: "STUDENT", status: "ACTIVE" } });
    }

    const batchId = await ensureBatch(d);

    const student = await prisma.student.create({
      data: {
        institutionId: d.institutionId,
        userId,
        usn: d.usn.toUpperCase(),
        firstName: d.firstName,
        lastName: d.lastName || null,
        programId: d.programId,
        batchId,
        schemeId: d.schemeId,
        admissionType: d.admissionType || "REGULAR",
        status: "ACTIVE",
        isActive: true,
        profile: {
          create: {
            dob: d.dob ? new Date(d.dob) : null,
            gender: d.gender ? (d.gender as never) : null,
            phone: d.phone || null,
            personalEmail: d.personalEmail || null,
            address: d.address || null,
          },
        },
        parent: {
          create: {
            fatherName: d.fatherName || null,
            motherName: d.motherName || null,
            fatherPhone: d.fatherPhone || null,
            motherPhone: d.motherPhone || null,
          },
        },
      },
    });

    if (userId) {
      const studentRole = await prisma.role.findUnique({ where: { code: "STUDENT" } });
      if (studentRole) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId, roleId: studentRole.id } },
          update: { departmentId: null },
          create: { userId, roleId: studentRole.id, departmentId: null },
        });
      }
    }

    const institution = await prisma.institution.findUnique({
      where: { id: d.institutionId },
      select: { activeSeason: true },
    });
    const season = institution?.activeSeason ?? "ODD";
    const seasonHalf = season === "ODD" ? 1 : 2;
    const currentYear = await getCurrentAcademicYear();
    const academicYearStartYear = currentYear?.startDate.getFullYear() ?? new Date().getFullYear();
    const derivedSemester = Math.max(1, (academicYearStartYear - d.admissionYear) * 2 + seasonHalf);

    let derivedSemRow = await prisma.academicSemester.findFirst({
      where: { semesterNumber: derivedSemester, academicYearId: currentYear?.id ?? undefined },
      select: { id: true },
    });
    if (!derivedSemRow) {
      derivedSemRow = await prisma.academicSemester.findFirst({
        where: { semesterNumber: derivedSemester },
        select: { id: true },
      });
    }
    const enrollmentSemesterId = derivedSemRow?.id ?? null;

    let enrollmentDepartmentId: string | null = null;
    if (enrollmentSemesterId) {
      const basicSciences = await prisma.department.findFirst({
        where: { institutionId: d.institutionId, code: "BASIC_SCIENCES" },
        select: { id: true },
      });
      enrollmentDepartmentId = derivedSemester <= 2 && basicSciences ? basicSciences.id : program.departmentId;
    }

    if (enrollmentSemesterId) {
      await prisma.studentSemesterEnrollment.create({
        data: {
          studentId: student.id,
          academicSemesterId: enrollmentSemesterId,
          departmentId: enrollmentDepartmentId ?? program.departmentId,
          enrollmentType: "REGULAR",
          isActive: true,
        },
      });
    }

    await logAudit({
      userId: access.userId, action: "student.create", module: "student",
      entityType: "Student", entityId: student.id,
      newValues: { usn: student.usn, name: d.firstName },
    });
    revalidatePath("/students");
    return { ok: true as const, id: student.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteStudent(id: string) {
  try {
    const access = await requireAccess();
    requirePermission(access, "student.edit");
    const student = await prisma.student.findUnique({ where: { id }, select: { id: true, userId: true, usn: true } });
    if (!student) return { ok: false as const, error: "Student not found" };

    await prisma.student.delete({ where: { id } });

    // Remove the linked login too, if possible (some linked records like audit logs block deletion).
    let userRemoved = false;
    if (student.userId) {
      try {
        await prisma.user.delete({ where: { id: student.userId } });
        userRemoved = true;
      } catch {
        // Leave the login account; the student record itself is gone.
      }
    }

    await logAudit({
      userId: access.userId, action: "student.delete", module: "student",
      entityType: "Student", entityId: id,
      newValues: { usn: student.usn, userRemoved },
    });
    revalidatePath("/students");
    return { ok: true as const, userRemoved };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setStudentActive(id: string, isActive: boolean) {
  try {
    const access = await requireAccess();
    requirePermission(access, "student.edit");
    await prisma.student.update({
      where: { id },
      data: { isActive, status: isActive ? "ACTIVE" : "INACTIVE" },
    });
    await logAudit({ userId: access.userId, action: isActive ? "student.activate" : "student.archive", module: "student", entityType: "Student", entityId: id, newValues: { isActive } });
    revalidatePath("/students");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}