import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { ExamAttendanceForm } from "@/components/examinations/exam-attendance-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExamAttendancePage({ params }: { params: Promise<{ id: string; examId: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "exam.edit");
  const { id, examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { course: true, examSession: true, attendance: true },
  });
  if (!exam) notFound();

  const allocations = await prisma.examHallAllocation.findMany({
    where: { examId },
    include: { student: { include: { user: true } } },
    orderBy: { seatNumber: "asc" },
  });

  const statusMap = new Map(exam.attendance.map((a) => [a.studentId, a.status]));
  const students = allocations.map((a) => ({
    id: a.studentId,
    name: a.student.user?.name ?? a.student.usn ?? "",
    usn: a.student.usn ?? "",
    seat: a.seatNumber ?? "",
    status: String(statusMap.get(a.studentId) ?? "PRESENT"),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${exam.course.code} — Attendance`}
        description={`${exam.examSession.name} · ${formatDate(exam.examDate)} · ${students.length} students`}
      />
      <Card>
        <CardHeader><CardTitle>Mark attendance</CardTitle></CardHeader>
        <CardContent>
          <ExamAttendanceForm examId={exam.id} sessionId={exam.examSessionId} students={students} />
        </CardContent>
      </Card>
    </div>
  );
}