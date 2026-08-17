import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { BarChartView, PieChartView } from "@/components/reports/charts";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const access = await requireAccess();
  requirePermission(access, "reports.view");

  const [deptCount, programsByDept, studentsByGender, attendanceSummary, feeSummary, resultSummary, facultyByDept, programCount] = await Promise.all([
    prisma.department.count(),
    prisma.program.findMany({ include: { department: true, _count: { select: { students: true } } } }),
    prisma.studentProfile.groupBy({ by: ["gender"], _count: true }),
    prisma.attendanceRecord.groupBy({ by: ["status"], _count: true }),
    prisma.studentFee.groupBy({ by: ["status"], _count: true, _sum: { amount: true, paidAmount: true } }),
    prisma.result.groupBy({ by: ["status"], _count: true }),
    prisma.faculty.groupBy({ by: ["departmentId"], _count: true }),
    prisma.program.count(),
  ]);

  const departments = await prisma.department.findMany({ select: { id: true, name: true, shortName: true } });
  const deptMap = new Map(departments.map((d) => [d.id, d]));

  const deptStudentMap = new Map<string, { name: string; students: number }>();
  for (const p of programsByDept) {
    const entry = deptStudentMap.get(p.departmentId) ?? { name: p.department.shortName ?? p.department.name, students: 0 };
    entry.students += p._count.students;
    deptStudentMap.set(p.departmentId, entry);
  }

  const studentData = [...deptStudentMap.values()].sort((a, b) => b.students - a.students);

  const facultyData = facultyByDept
    .map((f) => ({ name: deptMap.get(f.departmentId)?.shortName ?? "?", faculty: f._count }))
    .sort((a, b) => b.faculty - a.faculty);

  const genderData = studentsByGender.map((g) => ({ name: g.gender ?? "Unknown", value: g._count }));

  const attendanceData = attendanceSummary.map((a) => ({ name: a.status, value: a._count }));
  const feeData = feeSummary.map((f) => ({ name: f.status, value: f._count }));
  const resultData = resultSummary.map((r) => ({ name: r.status, value: r._count }));

  const totalFeesBilled = feeSummary.reduce((a, f) => a + Number(f._sum.amount ?? 0), 0);
  const totalFeesCollected = feeSummary.reduce((a, f) => a + Number(f._sum.paidAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Institution-wide insights" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Departments</p><p className="text-2xl font-semibold">{deptCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Programs</p><p className="text-2xl font-semibold">{programCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Students</p><p className="text-2xl font-semibold">{programsByDept.reduce((a, p) => a + p._count.students, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Faculty</p><p className="text-2xl font-semibold">{facultyByDept.reduce((a, f) => a + f._count, 0)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Students by department</CardTitle></CardHeader>
          <CardContent><BarChartView data={studentData} dataKey="students" nameKey="name" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Faculty by department</CardTitle></CardHeader>
          <CardContent><BarChartView data={facultyData} dataKey="faculty" nameKey="name" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Student gender</CardTitle></CardHeader>
          <CardContent><PieChartView data={genderData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Attendance distribution</CardTitle></CardHeader>
          <CardContent><PieChartView data={attendanceData} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Fees</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <p className="rounded-lg border border-border p-3"><span className="block text-xs text-muted-foreground">Billed</span><span className="text-lg font-semibold">{totalFeesBilled.toLocaleString()}</span></p>
              <p className="rounded-lg border border-border p-3"><span className="block text-xs text-muted-foreground">Collected</span><span className="text-lg font-semibold text-success">{totalFeesCollected.toLocaleString()}</span></p>
            </div>
            <PieChartView data={feeData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Result distribution</CardTitle></CardHeader>
          <CardContent><PieChartView data={resultData} /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Department overview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Faculty</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-right">{deptStudentMap.get(d.id)?.students ?? 0}</TableCell>
                  <TableCell className="text-right">{facultyByDept.find((f) => f.departmentId === d.id)?._count ?? 0}</TableCell>
                  <TableCell className="text-right"><Link href={`/reports/department/${d.id}`} className="text-primary hover:underline">Details →</Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}