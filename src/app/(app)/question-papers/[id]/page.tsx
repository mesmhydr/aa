import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { PaperQuestionForm } from "@/components/question-papers/paper-question-form";
import { removePaperQuestion, submitPaper, reviewPaper, lockPaper } from "@/app/(app)/question-papers/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  const { id } = await params;

  const paper = await prisma.questionPaper.findUnique({
    where: { id },
    include: {
      course: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      academicSemester: { include: { academicYear: true } },
      questions: { orderBy: { sortOrder: "asc" } },
      approvals: { orderBy: { createdAt: "desc" }, include: { reviewedBy: { select: { name: true } } } },
    },
  });
  if (!paper) notFound();

  const canEdit = access.permissions.has("questionpaper.create");
  const canApprove = access.permissions.has("questionpaper.approve");
  const locked = paper.status === "LOCKED" || paper.status === "APPROVED";
  const total = paper.questions.reduce((a, q) => a + q.marks, 0);

  const bankQuestions = await prisma.questionBankItem.findMany({
    where: { courseId: paper.courseId, isApproved: true, isActive: true },
    select: { id: true, questionText: true, marks: true, co: true, bloomLevel: true, unit: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={paper.title}
        description={`${paper.course.code} · ${paper.course.name} · v${paper.version} · ${paper.academicSemester ? `${paper.academicSemester.academicYear.name} Sem ${paper.academicSemester.semesterNumber}` : ""} · Total ${total}/${paper.totalMarks}`}
        actions={
          <div className="flex gap-2">
            {canEdit && paper.status === "DRAFT" && (
              <form action={async () => { "use server"; await submitPaper(paper.id); }}>
                <Button type="submit">Submit for Approval</Button>
              </form>
            )}
            {canApprove && paper.status === "SUBMITTED" && (
              <>
                <form action={async () => { "use server"; await reviewPaper(paper.id, "APPROVED"); }}>
                  <Button type="submit" variant="success">Approve</Button>
                </form>
                <form action={async () => { "use server"; await reviewPaper(paper.id, "CHANGES_REQUESTED", "Returned for changes"); }}>
                  <Button type="submit" variant="outline">Request Changes</Button>
                </form>
              </>
            )}
            {canApprove && paper.status === "APPROVED" && (
              <form action={async () => { "use server"; await lockPaper(paper.id); }}>
                <Button type="submit">Lock Paper</Button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Questions ({paper.questions.length})</CardTitle>
                {canEdit && !locked && <PaperQuestionForm paperId={paper.id} courseId={paper.courseId} bankQuestions={bankQuestions} />}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead>CO</TableHead>
                    <TableHead>Bloom</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paper.questions.map((q, i) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <p className="line-clamp-2">{q.questionText}</p>
                        <p className="text-xs text-muted-foreground">{q.unit ? `Unit ${q.unit}` : ""}{q.isOptional ? " · Optional" : ""}</p>
                      </TableCell>
                      <TableCell className="text-center">{q.marks}</TableCell>
                      <TableCell>{q.co ?? "—"}</TableCell>
                      <TableCell>{q.bloomLevel ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {canEdit && !locked && (
                          <form action={async () => { "use server"; await removePaperQuestion(q.id, paper.id); }}>
                            <Button type="submit" size="sm" variant="ghost" className="text-destructive">Remove</Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {paper.questions.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No questions yet — add questions from the bank or type custom ones.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><Badge variant={paper.status === "APPROVED" || paper.status === "LOCKED" ? "success" : paper.status === "SUBMITTED" ? "warning" : "secondary"}>{paper.status}</Badge></p>
              <p className="flex items-center justify-between"><span className="text-muted-foreground">Created by</span><span>{paper.createdBy?.name ?? "—"}</span></p>
              <p className="flex items-center justify-between"><span className="text-muted-foreground">Approved by</span><span>{paper.approvedBy?.name ?? "—"}</span></p>
              {paper.submittedAt && <p className="flex items-center justify-between"><span className="text-muted-foreground">Submitted</span><span>{formatDate(paper.submittedAt)}</span></p>}
              {paper.approvedAt && <p className="flex items-center justify-between"><span className="text-muted-foreground">Approved</span><span>{formatDate(paper.approvedAt)}</span></p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Approval Trail</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paper.approvals.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell><Badge variant={a.action === "APPROVED" ? "success" : a.action === "REJECTED" || a.action === "CHANGES_REQUESTED" ? "destructive" : "secondary"}>{a.action}</Badge></TableCell>
                      <TableCell className="text-xs">{a.reviewedBy?.name ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs">{formatDate(a.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {paper.approvals.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No activity yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}