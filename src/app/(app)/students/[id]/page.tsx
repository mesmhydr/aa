import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { AccessError } from "@/lib/access";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { setStudentActive } from "@/app/(app)/students/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "student.view");
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      profile: true,
      parent: true,
      program: { include: { department: true } },
      batch: true,
      scheme: true,
      enrollments: {
        orderBy: { academicSemester: { semesterNumber: "desc" } },
        include: { academicSemester: { include: { academicYear: true } }, department: true },
      },
      cieConsolidations: { orderBy: { updatedAt: "desc" }, take: 10, include: { courseOffering: { include: { course: true } }, academicSemester: true } },
      results: { orderBy: { updatedAt: "desc" }, take: 5, include: { academicSemester: true } },
      studentFees: { include: { feeType: true, academicYear: true, feeStructure: true } },
    },
  });

  if (!student) notFound();
  if (access.departmentIds.length && !access.departmentIds.includes(student.program.departmentId)) {
    throw new AccessError("Not authorized for this department", 403);
  }

  const latestEnrollment = student.enrollments[0];
  const currentSemester = latestEnrollment?.academicSemester.semesterNumber ?? null;

  const canEdit = access.permissions.has("student.edit");
  const totalFees = student.studentFees.reduce((a, f) => a + Number(f.amount), 0);
  const paidFees = student.studentFees.reduce((a, f) => a + Number(f.paidAmount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.user?.name ?? student.usn ?? ""}
        description={student.usn ?? undefined}
        actions={canEdit ? (
          <form action={async () => { "use server"; await setStudentActive(student.id, !student.isActive); }}>
            <Button type="submit" variant={student.isActive ? "outline" : "success"}>
              {student.isActive ? "Archive Student" : "Re-activate"}
            </Button>
          </form>
        ) : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Academic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Department" value={student.program.department.name} />
            <Row label="Program" value={student.program.name} />
            <Row label="Scheme" value={student.scheme?.name ?? "—"} />
            <Row label="Admission" value={`${student.batch.admissionYear} (${student.admissionType})`} />
            <Row label="Batch" value={student.batch.name ?? String(student.batch.admissionYear)} />
            <Row label="Current semester" value={currentSemester ?? "—"} />
            <Row label="Status" value={<Badge variant={student.isActive ? "success" : "destructive"}>{student.isActive ? student.status : "Inactive"}</Badge>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Email" value={student.user?.email ?? student.profile?.personalEmail ?? "—"} />
            <Row label="Phone" value={student.profile?.phone ?? "—"} />
            <Row label="Date of birth" value={student.profile?.dob ? formatDate(student.profile.dob) : "—"} />
            <Row label="Gender" value={student.profile?.gender ?? "—"} />
            <Row label="Address" value={student.profile?.address ?? "—"} />
            <Row label="Father" value={student.parent?.fatherName ?? "—"} />
            <Row label="Mother" value={student.parent?.motherName ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total billed" value={`₹${totalFees.toLocaleString("en-IN")}`} />
            <Row label="Paid" value={<span className="text-success">₹{paidFees.toLocaleString("en-IN")}</span>} />
            <Row label="Balance" value={`₹${(totalFees - paidFees).toLocaleString("en-IN")}`} />
            <div className="pt-1">
              <Link href="/fees" className="text-sm text-primary hover:underline">View fee statements →</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Enrollments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-center">Semester</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.academicSemester.academicYear.name}</TableCell>
                  <TableCell className="text-center">{e.academicSemester.semesterNumber}</TableCell>
                  <TableCell>{e.department.name}</TableCell>
                  <TableCell>{e.enrollmentType}</TableCell>
                  <TableCell><Badge variant={e.isActive ? "success" : "secondary"}>{e.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                </TableRow>
              ))}
              {student.enrollments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No enrollments yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent CIE Consolidations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Sem</TableHead>
                  <TableHead className="text-right">Total / %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.cieConsolidations.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.courseOffering.course.code}</TableCell>
                    <TableCell className="text-center">{c.academicSemester.semesterNumber}</TableCell>
                    <TableCell className="text-right">{c.totalMarks?.toFixed(1) ?? "—"} / {c.percentage != null ? `${c.percentage.toFixed(1)}%` : "—"}</TableCell>
                  </TableRow>
                ))}
                {student.cieConsolidations.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No CIE data yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Sem</TableHead>
                  <TableHead className="text-right">SGPA</TableHead>
                  <TableHead className="text-right">CGPA</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center">{r.academicSemester.semesterNumber}</TableCell>
                    <TableCell className="text-right">{r.sgpa?.toFixed(2) ?? "—"}</TableCell>
                    <TableCell className="text-right">{r.cgpa?.toFixed(2) ?? "—"}</TableCell>
                    <TableCell><Badge variant={r.status === "PASS" ? "success" : "warning"}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {student.results.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No results yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}