import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { setAssessmentStatus, computeConsolidation } from "@/app/(app)/assessments/actions";
import { formatDate } from "@/lib/utils";
import { getActiveSeason, getActiveSemesterIds, seasonOfSemester } from "@/lib/season";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FLOW = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "APPROVED", "LOCKED", "PUBLISHED"];

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<{ offering?: string; sem?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "assessment.view");
  const canCreate = access.permissions.has("assessment.create");
  const canPublish = access.permissions.has("assessment.publish");
  const canEnter = access.permissions.has("ciemarks.enter");
  const canApprove = access.permissions.has("ciemarks.approve");
  const { offering, sem } = await searchParams;

  const season = await getActiveSeason();
  const activeIds = new Set(await getActiveSemesterIds());
  const allSemesters = await prisma.academicSemester.findMany({ include: { academicYear: true }, orderBy: [{ academicYear: { startDate: "asc" } }, { semesterNumber: "asc" }] });
  const activeSemesters = allSemesters.filter((s) => activeIds.has(s.id));
  const scopeIds = sem ? (sem === "__ACTIVE__" ? [...activeIds] : [sem]) : [...activeIds];

  let offerings = await prisma.courseOffering.findMany({
    where: { isActive: true, academicSemesterId: { in: scopeIds } },
    orderBy: { course: { code: "asc" } },
    include: {
      course: { include: { department: true } },
      department: true,
      academicSemester: { include: { academicYear: true } },
      facultyAssignments: { where: { isPrimary: true, isActive: true }, include: { faculty: { include: { user: true } } } },
    },
  });

  if (access.departmentIds.length) {
    offerings = offerings.filter((o) => access.departmentIds.includes(o.departmentId));
  }
  if (access.roleCodes.includes("FACULTY")) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: access.userId } });
    if (faculty) offerings = offerings.filter((o) => o.facultyAssignments.some((fa) => fa.facultyId === faculty.id));
  }

  const components = await prisma.assessmentComponent.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  const selected = offerings.find((o) => o.id === offering);

  const assessments = selected
    ? await prisma.assessment.findMany({
        where: { courseOfferingId: selected.id },
        orderBy: { assessmentDate: "desc" },
        include: {
          courseOffering: { include: { course: true, department: true, academicSemester: true } },
          component: true,
          academicSemester: true,
          _count: { select: { cieMarks: true } },
        },
      })
    : [];

  const canConsolidate = canApprove && selected;
  const offeringOptions = offerings.map((o) => ({ id: o.id, label: `${o.course.code} · ${o.department?.name ?? "—"} (Sem ${o.academicSemester.semesterNumber})` }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="CIE Assessments"
        description="Internal assessment schedules, marks and consolidation"
        actions={canCreate ? <AssessmentForm offerings={offeringOptions} components={components} semesters={allSemesters.map((s) => ({ id: s.id, label: `${s.academicYear.name} Sem ${s.semesterNumber}` }))} /> : undefined}
      />

      <form className="flex flex-wrap items-center gap-2">
        <select name="sem" defaultValue={sem ?? "__ACTIVE__"} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="__ACTIVE__">Active season (odd 1,3,5,7)</option>
          {allSemesters.map((s) => (
            <option key={s.id} value={s.id}>{s.academicYear.name} Sem {s.semesterNumber}{activeIds.has(s.id) ? " · Active" : ""}</option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium shadow-sm hover:bg-muted">Filter</button>
      </form>

      <form className="flex flex-wrap items-center gap-2">
        <select name="offering" defaultValue={selected?.id} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">Select an offering</option>
          {offerings.map((o) => (
            <option key={o.id} value={o.id}>{o.course.code} · {o.department?.name ?? "—"} (Sem {o.academicSemester.semesterNumber})</option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium shadow-sm hover:bg-muted">View</button>
      </form>

      {!selected ? (
        <EmptyState title="Select a course offering" description="Choose an offering above to view its assessments and enter marks." />
      ) : (
        <>
          {canConsolidate && (
            <form action={async () => { "use server"; await computeConsolidation(selected.id, selected.academicSemesterId); }}>
              <Button type="submit" variant="secondary">Recompute CIE Consolidation</Button>
            </form>
          )}

          {assessments.length === 0 ? (
            <EmptyState title="No assessments yet" description="Schedule the first internal assessment for this offering." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Max</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.component.name}</TableCell>
                        <TableCell>{formatDate(a.assessmentDate)}</TableCell>
                        <TableCell className="text-center">{a.maxMarks}</TableCell>
                        <TableCell className="text-center">{a._count.cieMarks}</TableCell>
                        <TableCell><Badge variant={a.status === "PUBLISHED" ? "success" : a.status === "LOCKED" ? "warning" : "secondary"}>{a.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEnter && a.status !== "LOCKED" && (
                              <Link href={`/assessments/${a.id}/marks`}>
                                <Button size="sm" variant="outline">Enter Marks</Button>
                              </Link>
                            )}
                            {canPublish && FLOW.filter((s) => s !== a.status).slice(0, 2).map((s) => (
                              <form key={s} action={async () => { "use server"; await setAssessmentStatus(a.id, s); }}>
                                <Button type="submit" size="sm" variant="ghost" className="text-xs">{s}</Button>
                              </form>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}