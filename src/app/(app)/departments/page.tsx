import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { DepartmentForm } from "@/components/departments/department-form";
import { toggleDepartment } from "@/app/(app)/departments/actions";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const access = await requireAccess();
  requirePermission(access, "department.view");

  const [departments, institution, faculty, programsWithCount] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        hod: { select: { name: true } },
        deptCoordinator: { select: { name: true } },
        _count: { select: { programs: true, faculty: true, courses: true } },
      },
    }),
    prisma.institution.findFirst(),
    prisma.faculty.findMany({
      where: { isActive: true, userId: { not: null } },
      select: { id: true, employeeId: true, userId: true, user: { select: { name: true } } },
      orderBy: { employeeId: "asc" },
    }),
    prisma.program.findMany({ select: { departmentId: true, _count: { select: { students: true } } } }),
  ]);

  const deptStudentCounts = new Map<string, number>();
  for (const p of programsWithCount) {
    deptStudentCounts.set(p.departmentId, (deptStudentCounts.get(p.departmentId) ?? 0) + p._count.students);
  }

  const facultyOptions = faculty
    .filter((f) => f.userId)
    .map((f) => ({ id: f.userId!, name: f.user?.name ?? f.employeeId, employeeId: f.employeeId }));

  const canEdit = access.permissions.has("department.edit") || access.permissions.has("department.create");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage departments, HODs and department coordinators"
        actions={
          canEdit && institution ? (
            <DepartmentForm institutionId={institution.id} faculty={facultyOptions} />
          ) : undefined
        }
      />

      {departments.length === 0 ? (
        <EmptyState title="No departments yet" description="Add your first department to start building the institution." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>HOD</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Faculty</TableHead>
                  <TableHead className="text-center">Courses</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.code}</p>
                    </TableCell>
                    <TableCell>{d.hod?.name ?? "â€”"}</TableCell>
                    <TableCell>{d.deptCoordinator?.name ?? "â€”"}</TableCell>
                    <TableCell className="text-center">{deptStudentCounts.get(d.id) ?? 0}</TableCell>
                    <TableCell className="text-center">{d._count.faculty}</TableCell>
                    <TableCell className="text-center">{d._count.courses}</TableCell>
                    <TableCell>
                      <Badge variant={d.isActive ? "success" : "secondary"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <DepartmentForm institutionId={d.institutionId} faculty={facultyOptions} existing={d} />
                          <form
                            action={async () => {
                              "use server";
                              await toggleDepartment(d.id, !d.isActive);
                            }}
                          >
                            <Button type="submit" size="sm" variant="outline">
                              {d.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
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
