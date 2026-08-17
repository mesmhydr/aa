import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { SessionForm } from "@/components/examinations/session-form";
import { toggleSession } from "@/app/(app)/examinations/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExaminationsPage() {
  const access = await requireAccess();
  requirePermission(access, "exam.view");
  const canCreate = access.permissions.has("exam.create");
  const canEdit = access.permissions.has("exam.edit");

  const [examTypes, academicSemesters, sessions] = await Promise.all([
    prisma.examType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.academicSemester.findMany({ include: { academicYear: true }, orderBy: { semesterNumber: "asc" } }),
    prisma.examSession.findMany({
      orderBy: { startDate: "desc" },
      include: {
        examType: true,
        academicSemester: { include: { academicYear: true } },
        _count: { select: { exams: true, registrations: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Examinations"
        description="Exam sessions, schedules, eligibility and hall allocation"
        actions={canCreate && examTypes.length > 0 ? <SessionForm examTypes={examTypes} academicSemesters={academicSemesters} /> : undefined}
      />

      {sessions.length === 0 ? (
        <EmptyState title="No exam sessions" description="Create an exam session to schedule exams and manage eligibility." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-center">Sem</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-center">Exams</TableHead>
                  <TableHead className="text-center">Registered</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/examinations/${s.id}`} className="font-medium hover:text-primary hover:underline">{s.name}</Link>
                    </TableCell>
                    <TableCell>{s.examType.name}</TableCell>
                    <TableCell>{s.academicSemester.academicYear.name}</TableCell>
                    <TableCell className="text-center">{s.academicSemester.semesterNumber}</TableCell>
                    <TableCell>{formatDate(s.startDate)} — {formatDate(s.endDate)}</TableCell>
                    <TableCell className="text-center">{s._count.exams}</TableCell>
                    <TableCell className="text-center">{s._count.registrations}</TableCell>
                    <TableCell><Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <form action={async () => { "use server"; await toggleSession(s.id, !s.isActive); }}>
                          <Button type="submit" size="sm" variant="outline">{s.isActive ? "Deactivate" : "Activate"}</Button>
                        </form>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}