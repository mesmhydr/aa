import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { ExamForm } from "@/components/examinations/exam-form";
import { ExamAttendanceForm } from "@/components/examinations/exam-attendance-form";
import { removeExam, registerSessionStudents, computeEligibility, allocateHalls } from "@/app/(app)/examinations/actions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "exam.view");
  const canEdit = access.permissions.has("exam.edit");
  const canEligibility = access.permissions.has("exam.eligibility");
  const canAllocate = access.permissions.has("exam.hallallocation");
  const { id } = await params;

  const session = await prisma.examSession.findUnique({
    where: { id },
    include: {
      examType: true,
      academicSemester: { include: { academicYear: true } },
      exams: {
        orderBy: { examDate: "asc" },
        include: {
          course: true,
          hallAllocations: { include: { room: true, student: { include: { user: true } } } },
          attendance: { include: { student: { include: { user: true } } } },
        },
      },
      registrations: { include: { student: { include: { user: true } } } },
      eligibilities: { include: { student: { include: { user: true } }, course: true } },
    },
  });
  if (!session) notFound();

  const deptIds = access.departmentIds.length ? access.departmentIds : undefined;
  const courses = await prisma.course.findMany({
    where: { isActive: true, departmentId: deptIds ? { in: deptIds } : undefined },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const eligibleCount = session.eligibilities.filter((e) => e.isEligible).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={session.name}
        description={`${session.examType.name} · ${session.academicSemester.academicYear.name} · Sem ${session.academicSemester.semesterNumber} · ${formatDate(session.startDate)} — ${formatDate(session.endDate)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit && <ExamForm sessionId={session.id} courses={courses} />}
            {canEdit && (
              <form action={async () => { "use server"; await registerSessionStudents(session.id); }}>
                <Button type="submit" variant="outline">Register Students</Button>
              </form>
            )}
            {canEligibility && (
              <form action={async () => { "use server"; await computeEligibility(session.id); }}>
                <Button type="submit" variant="outline">Compute Eligibility</Button>
              </form>
            )}
            {canAllocate && (
              <form action={async () => { "use server"; await allocateHalls(session.id); }}>
                <Button type="submit" variant="secondary">Allocate Halls</Button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Registered</span><span>{session.registrations.length}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Eligible</span><span>{eligibleCount}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Exams</span><span>{session.exams.length}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Results</span><Badge variant={session.resultsStatus === "PUBLISHED" ? "success" : "secondary"}>{session.resultsStatus}</Badge></p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Exam Schedule ({session.exams.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-center">Max</TableHead>
                <TableHead className="text-center">Allocated</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Attendance</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {session.exams.map((ex) => (
                <TableRow key={ex.id}>
                  <TableCell>
                    <p className="font-medium">{ex.course.code}</p>
                    <p className="text-xs text-muted-foreground">{ex.course.name}</p>
                  </TableCell>
                  <TableCell>{formatDate(ex.examDate)}</TableCell>
                  <TableCell>{ex.startTime ?? "—"}{ex.endTime ? ` - ${ex.endTime}` : ""}</TableCell>
                  <TableCell className="text-center">{ex.maxMarks}{ex.isPractical ? " (P)" : ""}</TableCell>
                  <TableCell className="text-center">{ex.hallAllocations.length}</TableCell>
                  <TableCell>{[...new Set(ex.hallAllocations.map((h) => h.room.code))].join(", ") || "—"}</TableCell>
                  <TableCell>
                    <Link href={`/examinations/${session.id}/exam/${ex.id}`} className="text-primary hover:underline">Mark attendance</Link>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <form action={async () => { "use server"; await removeExam(ex.id, session.id); }}>
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">Remove</Button>
                      </form>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {session.exams.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No exams scheduled yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}