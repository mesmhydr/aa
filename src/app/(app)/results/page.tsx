import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { computeResults, publishResults, unpublishResults } from "@/app/(app)/results/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const access = await requireAccess();
  requirePermission(access, "results.view");
  const canCompute = access.permissions.has("results.compute");
  const canPublish = access.permissions.has("results.publish");

  const sessions = await prisma.examSession.findMany({
    orderBy: { startDate: "desc" },
    include: {
      examType: true,
      academicSemester: { include: { academicYear: true } },
      _count: { select: { exams: true, registrations: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Results" description="Compute SGPA, publish and manage semester results" />

      {sessions.length === 0 ? (
        <EmptyState title="No exam sessions" description="Create an exam session under Examinations to compute results." />
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
                  <TableHead>Status</TableHead>
                  {canCompute && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/results/${s.id}`} className="font-medium hover:text-primary hover:underline">{s.name}</Link>
                    </TableCell>
                    <TableCell>{s.examType.name}</TableCell>
                    <TableCell>{s.academicSemester.academicYear.name}</TableCell>
                    <TableCell className="text-center">{s.academicSemester.semesterNumber}</TableCell>
                    <TableCell>{formatDate(s.startDate)} — {formatDate(s.endDate)}</TableCell>
                    <TableCell><Badge variant={s.resultsStatus === "PUBLISHED" ? "success" : "secondary"}>{s.resultsStatus}</Badge></TableCell>
                    {canCompute && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <form action={async () => { "use server"; await computeResults(s.id); }}>
                            <Button type="submit" size="sm" variant="outline">Compute</Button>
                          </form>
                          {canPublish && (
                            s.resultsStatus === "PUBLISHED" ? (
                              <form action={async () => { "use server"; await unpublishResults(s.id); }}>
                                <Button type="submit" size="sm" variant="ghost">Unpublish</Button>
                              </form>
                            ) : (
                              <form action={async () => { "use server"; await publishResults(s.id); }}>
                                <Button type="submit" size="sm">Publish</Button>
                              </form>
                            )
                          )}
                        </div>
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