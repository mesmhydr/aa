import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, Input, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { StudentForm } from "@/components/students/student-form";
import { DeleteButton } from "@/components/delete-button";
import { deleteStudent } from "@/app/(app)/students/actions";
import { getActiveSemesterIds } from "@/lib/season";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; dept?: string; batch?: string; section?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "student.view");
  const canCreate = access.permissions.has("student.create");
  const canDelete = access.permissions.has("student.edit");
  const { q, dept, batch, section } = await searchParams;

  const departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const visibleDepts = access.departmentIds.length ? departments.filter((d) => access.departmentIds.includes(d.id)) : departments;
  const deptIds = access.departmentIds.length ? access.departmentIds : undefined;

  const institution = await prisma.institution.findFirst({ select: { id: true } });

  const activeSemesterIds = await getActiveSemesterIds();

  const studentWhere: Prisma.StudentWhereInput = {
    batchId: batch || undefined,
    program: dept ? { departmentId: dept } : deptIds ? { departmentId: { in: deptIds } } : undefined,
    ...(section ? { enrollments: { some: { sectionId: section, isActive: true } } } : {}),
    OR: q ? [
      { usn: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
    ] : undefined,
  };

  const [programs, schemes, batches, students, sections] = await Promise.all([
    prisma.program.findMany({ where: { isActive: true }, select: { id: true, name: true, code: true, departmentId: true }, orderBy: { name: "asc" } }),
    prisma.scheme.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.student.findMany({
      where: deptIds ? { program: { departmentId: { in: deptIds } } } : undefined,
      distinct: ["batchId"],
      orderBy: { batchId: "asc" },
      select: { batchId: true, batch: { select: { id: true, name: true, admissionYear: true } } },
    }),
    prisma.student.findMany({
      where: studentWhere,
      orderBy: [{ batch: { admissionYear: "desc" } }, { usn: "asc" }],
      include: {
        user: { select: { name: true, email: true } },
        program: { include: { department: true } },
        batch: true,
        profile: true,
        parent: true,
        enrollments: {
          orderBy: { academicSemester: { semesterNumber: "desc" } },
          include: { academicSemester: true },
        },
        _count: { select: { cieConsolidations: true, results: true } },
      },
    }),
    prisma.section.findMany({
      where: {
        isActive: true,
        academicSemesterId: { in: activeSemesterIds },
        ...(dept ? { departmentId: dept } : deptIds ? { departmentId: { in: deptIds } } : {}),
      },
      orderBy: [{ department: { code: "asc" } }, { academicSemester: { semesterNumber: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        department: { select: { code: true, shortName: true } },
        academicSemester: { select: { semesterNumber: true } },
      },
    }),
  ]);

  const sectionId = sections.some((s) => s.id === section) ? section : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${students.length} student records`}
        actions={canCreate ? <StudentForm institutionId={institution?.id ?? ""} departments={visibleDepts} programs={programs} schemes={schemes} /> : undefined}
      />

      <form className="flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search USN or name…" className="max-w-xs" />
        <select name="dept" defaultValue={dept} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All departments</option>
          {visibleDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select name="batch" defaultValue={batch} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All batches</option>
          {batches.map((b) => b.batch).sort((a, b) => b.admissionYear - a.admissionYear).map((b) => (
            <option key={b.id} value={b.id}>{b.name ?? String(b.admissionYear)}</option>
          ))}
        </select>
        {sections.length > 0 && (
          <select name="section" defaultValue={sectionId ?? ""} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {dept ? "" : `${s.department.shortName ?? s.department.code} · `}Section {s.name} · Sem {s.academicSemester.semesterNumber}
              </option>
            ))}
          </select>
        )}
        <Button type="submit" size="sm">Filter</Button>
      </form>

      {students.length === 0 ? (
        <EmptyState title="No students found" description="Add students to begin managing admissions and academics." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Sem</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                  {canDelete && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const currentSem = s.enrollments[0]?.academicSemester.semesterNumber ?? null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/students/${s.id}`} className="font-medium hover:text-primary hover:underline">{s.user?.name ?? s.usn}</Link>
                        <p className="text-xs text-muted-foreground">{s.usn}</p>
                      </TableCell>
                      <TableCell>{s.program.department.name}</TableCell>
                      <TableCell className="text-center">{currentSem ?? "—"}</TableCell>
                      <TableCell>{s.batch.name ?? String(s.batch.admissionYear)}</TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? "success" : "destructive"}>{s.isActive ? s.status : "Inactive"}</Badge>
                      </TableCell>
                      {canDelete && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <StudentForm
                              institutionId={institution?.id ?? ""}
                              departments={visibleDepts}
                              programs={programs}
                              schemes={schemes}
                              existing={{
                                id: s.id,
                                usn: s.usn ?? "",
                                firstName: s.firstName,
                                lastName: s.lastName,
                                email: s.user?.email ?? null,
                                departmentId: s.program.departmentId,
                                programId: s.programId,
                                schemeId: s.schemeId,
                                admissionYear: s.batch.admissionYear,
                                admissionType: s.admissionType,
                                profile: s.profile
                                  ? { dob: s.profile.dob, gender: s.profile.gender, phone: s.profile.phone, personalEmail: s.profile.personalEmail, address: s.profile.address }
                                  : null,
                                parent: s.parent
                                  ? { fatherName: s.parent.fatherName, motherName: s.parent.motherName, fatherPhone: s.parent.fatherPhone, motherPhone: s.parent.motherPhone }
                                  : null,
                              }}
                            />
                            <DeleteButton
                              action={deleteStudent}
                              id={s.id}
                              confirmText={`Delete ${s.user?.name ?? s.usn} (${s.usn})? This removes the student record, profile, enrollments and attendance.`}
                            />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}