import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, Input, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { QuestionForm } from "@/components/question-bank/question-form";
import { approveQuestion, toggleQuestion } from "@/app/(app)/question-bank/actions";

export const dynamic = "force-dynamic";

export default async function QuestionBankPage({ searchParams }: { searchParams: Promise<{ q?: string; course?: string; unit?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "questionbank.view");
  const canCreate = access.permissions.has("questionbank.create");
  const canApprove = access.permissions.has("questionbank.approve");
  const canEdit = access.permissions.has("questionbank.edit");
  const { q, course, unit } = await searchParams;

  const departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const deptIds = access.departmentIds.length ? access.departmentIds : undefined;

  const [courses, questionTypes, questions] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true, departmentId: deptIds ? { in: deptIds } : undefined },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, departmentId: true },
    }),
    prisma.questionType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.questionBankItem.findMany({
      where: {
        isActive: true,
        courseId: course || undefined,
        unit: unit || undefined,
        OR: q ? [{ questionText: { contains: q, mode: "insensitive" } }, { topic: { contains: q, mode: "insensitive" } }] : undefined,
        course: { departmentId: deptIds ? { in: deptIds } : undefined },
      },
      orderBy: { createdAt: "desc" },
      include: { course: true, questionType: true, createdBy: { select: { name: true } } },
      take: 200,
    }),
  ]);

  const units = [...new Set(questions.map((x) => x.unit).filter((u): u is string => !!u))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Bank"
        description={`${questions.length} questions`}
        actions={canCreate && courses.length > 0 ? <QuestionForm courses={courses} questionTypes={questionTypes} /> : undefined}
      />

      <form className="flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search questions…" className="max-w-xs" />
        <select name="course" defaultValue={course} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <select name="unit" defaultValue={unit} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All units</option>
          {units.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <Button type="submit" size="sm">Filter</Button>
      </form>

      {questions.length === 0 ? (
        <EmptyState title="No questions found" description="Add questions to the bank, organised by course, unit and CO." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Marks</TableHead>
                  <TableHead>CO</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Bloom</TableHead>
                  <TableHead>Approval</TableHead>
                  {(canApprove || canEdit) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2">{x.questionText}</p>
                      <p className="text-xs text-muted-foreground">{x.questionType.name} · {x.difficulty}</p>
                    </TableCell>
                    <TableCell>{x.course.code}</TableCell>
                    <TableCell className="text-center">{x.marks}</TableCell>
                    <TableCell>{x.co ?? "—"}</TableCell>
                    <TableCell>{x.unit ?? "—"}</TableCell>
                    <TableCell>{x.bloomLevel ?? "—"}</TableCell>
                    <TableCell><Badge variant={x.isApproved ? "success" : "warning"}>{x.isApproved ? "Approved" : "Pending"}</Badge></TableCell>
                    {(canApprove || canEdit) && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && <QuestionForm courses={courses} questionTypes={questionTypes} existing={x} />}
                          {canApprove && !x.isApproved && (
                            <form action={async () => { "use server"; await approveQuestion(x.id, true); }}>
                              <Button type="submit" size="sm" variant="success">Approve</Button>
                            </form>
                          )}
                          {canEdit && (
                            <form action={async () => { "use server"; await toggleQuestion(x.id, false); }}>
                              <Button type="submit" size="sm" variant="ghost" className="text-destructive">Remove</Button>
                            </form>
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