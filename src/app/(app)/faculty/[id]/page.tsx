import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission, AccessError } from "@/lib/access";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { setFacultyActive } from "@/app/(app)/faculty/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FacultyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "faculty.view");
  const { id } = await params;

  const faculty = await prisma.faculty.findUnique({
    where: { id },
    include: {
      user: true,
      department: true,
      courses: { include: { course: true } },
      assignments: { orderBy: { createdAt: "desc" }, include: { courseOffering: { include: { course: true, academicSemester: true } } } },
      invigilatorDuties: { include: { exam: { include: { course: true } }, room: true } },
    },
  });

  if (!faculty) notFound();
  if (access.departmentIds.length && !access.departmentIds.includes(faculty.departmentId)) {
    throw new AccessError("Not authorized for this department", 403);
  }

  const canEdit = access.permissions.has("faculty.edit");

  return (
    <div className="space-y-6">
      <PageHeader
        title={faculty.user?.name ?? faculty.employeeId}
        description={faculty.employeeId}
        actions={canEdit ? (
          <form action={async () => { "use server"; await setFacultyActive(faculty.id, !faculty.isActive); }}>
            <Button type="submit" variant={faculty.isActive ? "outline" : "success"}>
              {faculty.isActive ? "Deactivate" : "Activate"}
            </Button>
          </form>
        ) : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Department" value={faculty.department.name} />
            <Row label="Designation" value={faculty.designation} />
            <Row label="Qualification" value={faculty.qualification ?? "—"} />
            <Row label="Specialization" value={faculty.specialization ?? "—"} />
            <Row label="Experience" value={faculty.experienceYears != null ? `${faculty.experienceYears} years` : "—"} />
            <Row label="Joining date" value={faculty.joiningDate ? formatDate(faculty.joiningDate) : "—"} />
            <Row label="Employment" value={<Badge>{faculty.employmentType}</Badge>} />
            <Row label="Email" value={faculty.email ?? "—"} />
            <Row label="Phone" value={faculty.phone ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assigned Courses</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Sem</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculty.courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.course.code}</p>
                      <p className="text-xs text-muted-foreground">{c.course.name}</p>
                    </TableCell>
                    <TableCell className="text-center">{c.course.semesterNumber}</TableCell>
                    <TableCell>{c.course.isElective ? "Elective" : "Regular"}</TableCell>
                  </TableRow>
                ))}
                {faculty.courses.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No courses assigned</TableCell></TableRow>
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