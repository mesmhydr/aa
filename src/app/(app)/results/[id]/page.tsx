import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { computeResults, publishResults, unpublishResults } from "@/app/(app)/results/actions";
import { GradeOverrideForm } from "@/components/results/grade-override-form";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResultSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "results.view");
  const canCompute = access.permissions.has("results.compute");
  const canPublish = access.permissions.has("results.publish");
  const canEdit = access.permissions.has("results.edit");
  const { id } = await params;

  const session = await prisma.examSession.findUnique({
    where: { id },
    include: { examType: true, academicSemester: { include: { academicYear: true } } },
  });
  if (!session) notFound();

  const semester = await prisma.academicSemester.findUnique({ where: { id: session.academicSemesterId } });
  if (!semester) notFound();

  const results = await prisma.result.findMany({
    where: { academicSemesterId: semester.id },
    orderBy: { updatedAt: "desc" },
    include: {
      student: { include: { user: true, program: { include: { department: true } }, batch: true } },
      items: { include: { course: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${session.name} — Results`}
        description={`${session.examType.name} · ${session.academicSemester.academicYear.name} · Sem ${session.academicSemester.semesterNumber} · ${formatDate(session.startDate)} — ${formatDate(session.endDate)}`}
        actions={
          <div className="flex gap-2">
            {canCompute && (
              <form action={async () => { "use server"; await computeResults(session.id); }}>
                <button type="submit" className="inline-flex h-9 items-center rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-muted">Recompute</button>
              </form>
            )}
            {canPublish && (
              session.resultsStatus === "PUBLISHED" ? (
                <form action={async () => { "use server"; await unpublishResults(session.id); }}>
                  <button type="submit" className="inline-flex h-9 items-center rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-muted">Unpublish</button>
                </form>
              ) : (
                <form action={async () => { "use server"; await publishResults(session.id); }}>
                  <button type="submit" className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Publish Results</button>
                </form>
              )
            )}
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>Student results ({results.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>USN</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-center">Credits (Earned/Reg)</TableHead>
                <TableHead className="text-right">SGPA</TableHead>
                <TableHead className="text-right">CGPA</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Pub</TableHead>
                {canEdit && <TableHead className="text-right">Override</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-mono">{r.student.usn}</TableCell>
                  <TableCell>{r.student.user?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.student.program.department.shortName ?? r.student.program.department.code}</TableCell>
                  <TableCell className="text-center">{r.creditsEarned}/{r.creditsRegistered}</TableCell>
                  <TableCell className="text-right font-medium">{r.sgpa?.toFixed(2) ?? "—"}</TableCell>
                  <TableCell className="text-right">{r.cgpa?.toFixed(2) ?? "—"}</TableCell>
                  <TableCell className="text-center"><Badge variant={r.status === "PASS" ? "success" : "destructive"}>{r.status}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant={r.publicationStatus === "PUBLISHED" ? "success" : "secondary"}>{r.publicationStatus}</Badge></TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Link href={`/results/${session.id}/student/${r.id}`} className="text-primary hover:underline">View / Override</Link>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {results.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No results computed yet. Click Recompute.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}