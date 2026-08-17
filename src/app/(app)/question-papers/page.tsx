import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { PaperCreateForm } from "@/components/question-papers/paper-form";
import { getActiveSemesterIds, seasonOfSemester } from "@/lib/season";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QuestionPapersPage() {
  const access = await requireAccess();
  requirePermission(access, "questionpaper.create");

  const departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const deptIds = access.departmentIds.length ? access.departmentIds : undefined;

  const [courses, semesters, papers] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true, departmentId: deptIds ? { in: deptIds } : undefined },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.academicSemester.findMany({ include: { academicYear: true }, orderBy: [{ academicYear: { startDate: "asc" } }, { semesterNumber: "asc" }] }),
    prisma.questionPaper.findMany({
      where: { course: { departmentId: deptIds ? { in: deptIds } : undefined } },
      orderBy: { updatedAt: "desc" },
      include: {
        course: true,
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        questions: true,
        academicSemester: { include: { academicYear: true } },
      },
    }),
  ]);

  const activeSemesterIds = new Set(await getActiveSemesterIds());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Papers"
        description="Draft, submit and approve question papers"
        actions={courses.length > 0 ? <PaperCreateForm courses={courses} semesters={semesters.map((s) => ({ id: s.id, label: `${s.academicYear.name} Sem ${s.semesterNumber}${activeSemesterIds.has(s.id) ? " · Active" : ""}` }))} /> : undefined}
      />

      {papers.length === 0 ? (
        <EmptyState title="No question papers yet" description="Create a paper to start building question papers from the question bank." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paper</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Version</TableHead>
                  <TableHead className="text-center">Questions</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved by</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/question-papers/${p.id}`} className="font-medium hover:text-primary hover:underline">{p.title}</Link>
                      <p className="text-xs text-muted-foreground">
                        {p.academicSemester ? `${p.academicSemester.academicYear.name} Sem ${p.academicSemester.semesterNumber}` : "—"}
                        {p.academicSemester && activeSemesterIds.has(p.academicSemesterId ?? "") ? <Badge variant="success" className="ml-2">{seasonOfSemester(p.academicSemester.semesterNumber)}</Badge> : null}
                      </p>
                    </TableCell>
                    <TableCell>{p.course.code}</TableCell>
                    <TableCell className="text-center">v{p.version}</TableCell>
                    <TableCell className="text-center">{p.questions.length}</TableCell>
                    <TableCell className="text-center">{p.questions.reduce((a, q) => a + q.marks, 0)}/{p.totalMarks}</TableCell>
                    <TableCell><Badge variant={p.status === "APPROVED" || p.status === "LOCKED" ? "success" : p.status === "SUBMITTED" ? "warning" : "secondary"}>{p.status}</Badge></TableCell>
                    <TableCell>{p.approvedBy?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/question-papers/${p.id}`}>
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    </TableCell>
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