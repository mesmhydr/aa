import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { CieMarksForm } from "@/components/assessments/cie-marks-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AssessmentMarksPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "ciemarks.enter");
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      component: true,
      courseOffering: { include: { course: true, department: true } },
      cieMarks: { include: { student: { include: { user: true } } } },
    },
  });
  if (!assessment) notFound();

  const registrations = await prisma.courseRegistration.findMany({
    where: { courseOfferingId: assessment.courseOfferingId, status: "REGISTERED" },
    include: { student: { include: { user: true } } },
    orderBy: { student: { usn: "asc" } },
  });

  const markMap = new Map(assessment.cieMarks.map((m) => [m.studentId, m]));
  const students = registrations.map((r) => {
    const mark = markMap.get(r.studentId);
    return {
      id: r.studentId,
      name: r.student.user?.name ?? ([r.student.firstName, r.student.lastName].filter(Boolean).join(" ") || r.student.usn || ""),
      usn: r.student.usn ?? "",
      marksObtained: mark?.marksObtained ?? null,
      isAbsent: mark?.isAbsent ?? false,
    };
  });

  const filled = assessment.cieMarks.filter((m) => m.marksObtained != null || m.isAbsent).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={assessment.name}
        description={`${assessment.courseOffering.course.code} · ${assessment.courseOffering.department?.name ?? "—"} · ${formatDate(assessment.assessmentDate)} · Max ${assessment.maxMarks} · ${filled}/${students.length} entered`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Enter Marks ({assessment.component.name})</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <CieMarksForm assessmentId={assessment.id} students={students} />
        </CardContent>
      </Card>
    </div>
  );
}