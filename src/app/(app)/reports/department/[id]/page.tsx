import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { BarChartView, PieChartView } from "@/components/reports/charts";

export const dynamic = "force-dynamic";

export default async function DepartmentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "reports.view");
  const { id } = await params;

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) notFound();

  const [programs, students, faculties, courses, feeSummary, resultSummary] = await Promise.all([
    prisma.program.findMany({
      where: { departmentId: id },
      orderBy: { code: "asc" },
      include: { _count: { select: { students: true } } },
    }),
    prisma.student.count({ where: { program: { departmentId: id }, isActive: true } }),
    prisma.faculty.count({ where: { departmentId: id, isActive: true } }),
    prisma.course.count({ where: { departmentId: id, isActive: true } }),
    prisma.studentFee.findMany({
      where: { student: { program: { departmentId: id } } },
      select: { amount: true, paidAmount: true, status: true },
    }),
    prisma.result.findMany({
      where: { student: { program: { departmentId: id } } },
      select: { status: true },
    }),
  ]);

  const programData = programs
    .map((p) => ({ name: p.code, students: p._count.students }))
    .sort((a, b) => b.students - a.students);

  const feeData = [
    { name: "PAID", value: feeSummary.filter((f) => f.status === "PAID").length },
    { name: "PARTIAL", value: feeSummary.filter((f) => f.status === "PARTIAL").length },
    { name: "PENDING", value: feeSummary.filter((f) => f.status === "PENDING").length },
  ].filter((d) => d.value > 0);

  const resultData = resultSummary
    .reduce((acc, r) => {
      const x = acc.find((a) => a.name === r.status);
      if (x) x.value += 1; else acc.push({ name: r.status, value: 1 });
      return acc;
    }, [] as Array<{ name: string; value: number }>);

  const totalBilled = feeSummary.reduce((a, f) => a + Number(f.amount), 0);
  const totalPaid = feeSummary.reduce((a, f) => a + Number(f.paidAmount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title={department.name} description={`${department.code} · ${department.shortName ?? ""}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Programs</p><p className="text-2xl font-semibold">{programs.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Students</p><p className="text-2xl font-semibold">{students}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Faculty</p><p className="text-2xl font-semibold">{faculties}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Courses</p><p className="text-2xl font-semibold">{courses}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
<CardHeader><CardTitle>Programs</CardTitle></CardHeader>
          <CardContent><BarChartView data={programData} dataKey="students" nameKey="name" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Fees</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <p className="rounded-lg border border-border p-3"><span className="block text-xs text-muted-foreground">Billed</span><span className="text-lg font-semibold">{totalBilled.toLocaleString()}</span></p>
              <p className="rounded-lg border border-border p-3"><span className="block text-xs text-muted-foreground">Collected</span><span className="text-lg font-semibold text-success">{totalPaid.toLocaleString()}</span></p>
            </div>
            {feeData.length > 0 ? <PieChartView data={feeData} /> : <p className="text-sm text-muted-foreground">No fee data</p>}
          </CardContent>
        </Card>
      </div>

      {resultData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Results</CardTitle></CardHeader>
          <CardContent><PieChartView data={resultData} /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Students by program</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.code}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">{p._count.students}</TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No programs</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}