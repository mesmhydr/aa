import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, Input, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { CourseForm } from "@/components/courses/course-form";
import { OfferingForm } from "@/components/courses/offering-form";
import { toggleCourse, toggleOffering } from "@/app/(app)/courses/actions";
import { getActiveSemesterIds, seasonOfSemester } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ q?: string; dept?: string; tab?: string; sem?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "course.view");
  const canEdit = access.permissions.has("course.edit") || access.permissions.has("course.create");
  const canAssign = access.permissions.has("course.assign");
  const canRegister = access.permissions.has("course.register");
  const { q, dept, tab, sem } = await searchParams;
  const current = tab ?? "catalog";

  const departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const visibleDepts = access.departmentIds.length ? departments.filter((d) => access.departmentIds.includes(d.id)) : departments;
  const deptIds = access.departmentIds.length ? access.departmentIds : undefined;

  const [schemes, courseTypes, courses, faculty, allSemesters, offerings] = await Promise.all([
    prisma.scheme.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.courseType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.course.findMany({
      where: {
        isActive: true,
        departmentId: dept || undefined,
        OR: q ? [{ code: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] : undefined,
      },
      orderBy: [{ semesterNumber: "asc" }, { code: "asc" }],
      include: {
        department: true,
        scheme: true,
        courseType: true,
        facultyCourses: { include: { faculty: { include: { user: true } } } },
      },
    }),
    prisma.faculty.findMany({ where: { isActive: true }, select: { id: true, employeeId: true, departmentId: true, user: { select: { name: true } } }, orderBy: { employeeId: "asc" } }),
    prisma.academicSemester.findMany({ include: { academicYear: true }, orderBy: [{ academicYear: { startDate: "asc" } }, { semesterNumber: "asc" }] }),
    prisma.courseOffering.findMany({
      where: {
        isActive: true,
        departmentId: dept || (deptIds ? { in: deptIds } : undefined),
        ...(sem ? { academicSemesterId: sem } : {}),
      },
      orderBy: [{ academicSemester: { semesterNumber: "asc" } }, { course: { code: "asc" } }],
      include: {
        course: { include: { department: true } },
        department: true,
        academicSemester: { include: { academicYear: true } },
        facultyAssignments: { where: { isPrimary: true, isActive: true }, include: { faculty: { include: { user: true } } } },
        _count: { select: { registrations: true } },
      },
    }),
  ]);

  const activeSemesterIds = new Set(await getActiveSemesterIds());
  const activeSemesters = allSemesters.filter((s) => activeSemesterIds.has(s.id));

  const filteredCourses = access.departmentIds.length ? courses.filter((c) => access.departmentIds.includes(c.departmentId)) : courses;
  const facultyOptions = faculty.map((f) => ({ id: f.id, name: f.user?.name ?? f.employeeId, departmentId: f.departmentId }));
  const semesterOptions = allSemesters.map((s) => ({ id: s.id, label: `${s.academicYear.name} · Sem ${s.semesterNumber}${activeSemesterIds.has(s.id) ? " · Active" : ""}` }));

  const tabs = [
    { value: "catalog", label: `Course Catalog (${filteredCourses.length})` },
    { value: "offerings", label: `Offerings (${offerings.length})` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Course catalog, offerings and faculty assignments"
        actions={
          canRegister && current === "offerings" && filteredCourses.length > 0 && activeSemesters.length > 0 ? (
            <OfferingForm courses={filteredCourses} departments={visibleDepts} semesters={semesterOptions} faculty={facultyOptions} canAssign={canAssign} />
          ) : canEdit && current === "catalog" && schemes.length > 0 && courseTypes.length > 0 ? (
            <CourseForm departments={visibleDepts} schemes={schemes} courseTypes={courseTypes} faculty={facultyOptions} />
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <a key={t.value} href={`/courses?tab=${t.value}`} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${current === t.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </a>
        ))}
      </div>

      {current === "catalog" ? (
        <>
          <form className="flex flex-wrap items-center gap-2">
            <Input name="q" defaultValue={q} placeholder="Search by code or name…" className="max-w-xs" />
            <select name="dept" defaultValue={dept} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
              <option value="">All departments</option>
              {visibleDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input type="hidden" name="tab" value="catalog" />
            <Button type="submit" size="sm">Filter</Button>
          </form>

          {filteredCourses.length === 0 ? (
            <EmptyState title="No courses found" description="Add courses to the catalog to get started." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Shorthand</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Sem</TableHead>
                      <TableHead className="text-center">Credits</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Faculty</TableHead>
                      {(canEdit || canAssign) && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium">{c.code}</p>
                          <p className="text-xs text-muted-foreground">{c.name}</p>
                        </TableCell>
                        <TableCell>{c.shortName ? <Badge variant="secondary">{c.shortName}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{c.department.name}</TableCell>
                        <TableCell className="text-center">{c.semesterNumber}</TableCell>
                        <TableCell className="text-center">{c.credits}</TableCell>
                        <TableCell>{c.isElective ? <Badge variant="warning">Elective</Badge> : <Badge>{c.courseType.name}</Badge>}</TableCell>
                        <TableCell>
                          {c.facultyCourses.length === 0 ? <span className="text-xs text-muted-foreground">Unassigned</span> : <span className="text-xs">{c.facultyCourses.map((fc) => fc.faculty.user?.name ?? fc.faculty.employeeId).join(", ")}</span>}
                        </TableCell>
                        {(canEdit || canAssign) && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canEdit && <CourseForm departments={visibleDepts} schemes={schemes} courseTypes={courseTypes} faculty={facultyOptions} existing={c} />}
                              {canEdit && (
                                <form action={async () => { "use server"; await toggleCourse(c.id, !c.isActive); }}>
                                  <Button type="submit" size="sm" variant="outline">Deactivate</Button>
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
        </>
      ) : (
        offerings.length === 0 ? (
          <EmptyState title="No offerings yet" description="Create course offerings for the active season (odd semesters 1,3,5,7) to enable attendance, timetables and CIE." />
        ) : (
          <>
            <form className="flex flex-wrap items-center gap-2">
              <select name="sem" defaultValue={sem} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
                <option value="">All semesters</option>
                {allSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.academicYear.name} Sem {s.semesterNumber}{activeSemesterIds.has(s.id) ? " · Active" : ""}
                  </option>
                ))}
              </select>
              <input type="hidden" name="tab" value="offerings" />
              <Button type="submit" size="sm">Filter</Button>
            </form>
            <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    {canRegister && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offerings.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <p className="font-medium">{o.course.code}</p>
                        <p className="text-xs text-muted-foreground">{o.course.name}</p>
                      </TableCell>
                      <TableCell>{o.department.name}</TableCell>
                      <TableCell>
                        {o.academicSemester.academicYear.name} Sem {o.academicSemester.semesterNumber}
                        {activeSemesterIds.has(o.academicSemesterId) ? <Badge variant="success" className="ml-2">{seasonOfSemester(o.academicSemester.semesterNumber)}</Badge> : null}
                      </TableCell>
                      <TableCell>{o.facultyAssignments[0]?.faculty.user?.name ?? "Unassigned"}</TableCell>
                      <TableCell className="text-center">{o._count.registrations}</TableCell>
                      {canRegister && (
                        <TableCell className="text-right">
                          <form action={async () => { "use server"; await toggleOffering(o.id, !o.isActive); }}>
                            <Button type="submit" size="sm" variant="outline">{o.isActive ? "Deactivate" : "Activate"}</Button>
                          </form>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </>
        )
      )}
    </div>
  );
}