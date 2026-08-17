import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, Input, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { FacultyForm } from "@/components/faculty/faculty-form";
import { DeleteButton } from "@/components/delete-button";
import { deleteFaculty } from "@/app/(app)/faculty/actions";

export const dynamic = "force-dynamic";

export default async function FacultyPage({ searchParams }: { searchParams: Promise<{ q?: string; dept?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "faculty.view");
  const canCreate = access.permissions.has("faculty.create");
  const canDelete = access.permissions.has("faculty.edit");
  const { q, dept } = await searchParams;

  const departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const visibleDepts = access.departmentIds.length ? departments.filter((d) => access.departmentIds.includes(d.id)) : departments;
  const deptIds = access.departmentIds.length ? access.departmentIds : undefined;

  const faculty = await prisma.faculty.findMany({
    where: {
      departmentId: dept || (deptIds ? { in: deptIds } : undefined),
      OR: q ? [
        { employeeId: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ] : undefined,
    },
    orderBy: [{ department: { name: "asc" } }, { employeeId: "asc" }],
    include: {
      user: { select: { name: true } },
      department: true,
      courses: { include: { course: true } },
      _count: { select: { assignments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty"
        description={`${faculty.length} faculty members`}
        actions={canCreate ? <FacultyForm departments={visibleDepts} /> : undefined}
      />

      <form className="flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search employee ID or name…" className="max-w-xs" />
        <select name="dept" defaultValue={dept} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All departments</option>
          {visibleDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <Button type="submit" size="sm">Filter</Button>
      </form>

      {faculty.length === 0 ? (
        <EmptyState title="No faculty found" description="Add faculty members to assign courses and duties." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead className="text-center">Courses</TableHead>
                  <TableHead>Status</TableHead>
                  {canDelete && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {faculty.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link href={`/faculty/${f.id}`} className="font-medium hover:text-primary hover:underline">{f.user?.name ?? f.employeeId}</Link>
                      <p className="text-xs text-muted-foreground">{f.employeeId}</p>
                    </TableCell>
                    <TableCell>{f.department.name}</TableCell>
                    <TableCell>{f.designation}</TableCell>
                    <TableCell>{f.experienceYears != null ? `${f.experienceYears}y` : "—"}</TableCell>
                    <TableCell className="text-center">{f.courses.length}</TableCell>
                    <TableCell><Badge variant={f.isActive ? "success" : "secondary"}>{f.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    {canDelete && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <FacultyForm
                            departments={visibleDepts}
                            existing={{
                              id: f.id,
                              name: f.user?.name ?? f.employeeId,
                              employeeId: f.employeeId,
                              email: f.email,
                              departmentId: f.departmentId,
                              designation: f.designation,
                              qualification: f.qualification,
                              specialization: f.specialization,
                              experienceYears: f.experienceYears,
                              joiningDate: f.joiningDate,
                              employmentType: f.employmentType,
                              phone: f.phone,
                            }}
                          />
                          <DeleteButton
                            action={deleteFaculty}
                            id={f.id}
                            confirmText={`Delete ${f.user?.name ?? f.employeeId} (${f.employeeId})? This removes the faculty record, their course & exam assignments, and unlinks their calendar events.`}
                          />
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