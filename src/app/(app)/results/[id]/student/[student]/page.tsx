import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { GradeOverrideForm } from "@/components/results/grade-override-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentResultPage({ params }: { params: Promise<{ id: string; student: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "results.view");
  const canEdit = access.permissions.has("results.edit");
  const { id, student } = await params;

  const result = await prisma.result.findUnique({
    where: { id: student },
    include: {
      student: { include: { user: true, program: { include: { department: true } } } },
      items: { include: { course: true } },
      academicSemester: { include: { academicYear: true } },
    },
  });
  if (!result) notFound();

  const grades = await prisma.grade.findMany({ where: { isActive: true }, orderBy: { gradePoint: "desc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${result.student.user?.name ?? result.student.usn} — Sem ${result.academicSemester.semesterNumber}`}
        description={`${result.student.usn} · ${result.student.program.department.name} · ${result.academicSemester.academicYear.name}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">SGPA</span><span className="font-semibold">{result.sgpa?.toFixed(2) ?? "—"}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">CGPA</span><span>{result.cgpa?.toFixed(2) ?? "—"}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Credits</span><span>{result.creditsEarned}/{result.creditsRegistered}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={result.status === "PASS" ? "success" : "destructive"}>{result.status}</Badge></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Published</span><Badge variant={result.publicationStatus === "PUBLISHED" ? "success" : "secondary"}>{result.publicationStatus}</Badge></p>
            {result.publishedAt && <p className="text-xs text-muted-foreground">Published {formatDate(result.publishedAt)}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Course-wise results</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">CIE</TableHead>
                <TableHead className="text-right">SEE</TableHead>
                <TableHead className="text-right">Prac</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {canEdit && <TableHead className="text-right">Override</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    <p className="font-medium">{it.course.code}</p>
                    <p className="text-xs text-muted-foreground">{it.course.name}</p>
                  </TableCell>
                  <TableCell className="text-right">{it.cieMarks ?? "—"}</TableCell>
                  <TableCell className="text-right">{it.seeMarks ?? "—"}</TableCell>
                  <TableCell className="text-right">{it.practicalMarks ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{it.totalMarks ?? "—"}</TableCell>
                  <TableCell className="text-center"><Badge variant={it.status === "PASS" ? "success" : "destructive"}>{it.grade}</Badge></TableCell>
                  <TableCell className="text-center">{it.creditsEarned}/{it.credits}</TableCell>
                  <TableCell className="text-center"><Badge variant={it.status === "PASS" ? "success" : "destructive"}>{it.status}</Badge></TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <GradeOverrideForm
                        resultItemId={it.id}
                        sessionId={id}
                        grades={grades}
                        current={{ grade: it.grade ?? "F", remark: it.remark }}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}