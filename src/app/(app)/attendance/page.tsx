import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import type { Access } from "@/lib/access";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { AttendanceMarkForm } from "@/components/attendance/attendance-form";
import { getActiveSeason, getActiveSemesterIds, seasonOfSemester } from "@/lib/season";
import { formatPercent } from "@/lib/utils";
import { BookOpen, CalendarCheck, Trophy, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ offering?: string; date?: string; sem?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "attendance.view");

  if (access.roleCodes.includes("STUDENT")) {
    return <StudentAttendanceView access={access} />;
  }

  const canMark = access.permissions.has("attendance.create");
  const { offering, date, sem } = await searchParams;

  const season = await getActiveSeason();
  const activeIds = new Set(await getActiveSemesterIds());
  const allSemesters = await prisma.academicSemester.findMany({ include: { academicYear: true }, orderBy: [{ academicYear: { startDate: "asc" } }, { semesterNumber: "asc" }] });
  const activeSemesters = allSemesters.filter((s) => activeIds.has(s.id));
  const scopeIds = sem ? (sem === "__ACTIVE__" ? [...activeIds] : [sem]) : [...activeIds];

  let offerings = await prisma.courseOffering.findMany({
    where: { isActive: true, academicSemesterId: { in: scopeIds } },
    orderBy: [{ academicSemester: { semesterNumber: "asc" } }, { course: { code: "asc" } }],
    include: {
      course: { include: { department: true } },
      department: true,
      academicSemester: { include: { academicYear: true } },
      facultyAssignments: { where: { isPrimary: true, isActive: true }, include: { faculty: { include: { user: true } } } },
      _count: { select: { attendanceRecords: true } },
    },
  });

  if (access.departmentIds.length) {
    offerings = offerings.filter((o) => access.departmentIds.includes(o.departmentId));
  }
  if (access.roleCodes.includes("FACULTY")) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: access.userId } });
    if (faculty) {
      offerings = offerings.filter((o) => o.facultyAssignments.some((fa) => fa.facultyId === faculty.id));
    }
  }

  const offeringOptions = offerings.map((o) => ({
    id: o.id,
    label: `${o.course.code} · ${o.department?.name ?? "—"} (Sem ${o.academicSemester.semesterNumber})`,
  }));

  const selectedOffering = offerings.find((o) => o.id === offering);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={`Mark and review class attendance across the active season (${season} semesters: ${activeSemesters.map((s) => s.semesterNumber).join(", ")})`}
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

      {offerings.length === 0 ? (
        <EmptyState title="No assigned offerings" description="Create course offerings and assign yourself in Courses → Offerings for the active season to start marking attendance." />
      ) : (
        <Card>
          <CardContent className="p-5">
            <AttendanceMarkForm offerings={offeringOptions} selectedOffering={selectedOffering?.id} selectedDate={date} />
          </CardContent>
        </Card>
      )}

      {offerings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead className="text-center">Records</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offerings.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <p className="font-medium">{o.course.code}</p>
                        <p className="text-xs text-muted-foreground">{o.course.name}</p>
                      </TableCell>
                      <TableCell>{o.department?.name ?? "—"}</TableCell>
                      <TableCell>
                        {o.academicSemester.academicYear.name} Sem {o.academicSemester.semesterNumber}
                        {activeIds.has(o.academicSemesterId) ? <Badge variant="success" className="ml-2">{seasonOfSemester(o.academicSemester.semesterNumber)}</Badge> : null}
                      </TableCell>
                      <TableCell>{o.facultyAssignments[0]?.faculty.user?.name ?? "Unassigned"}</TableCell>
                      <TableCell className="text-center">{o._count.attendanceRecords}</TableCell>
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

type RankResult = { rank: number | null; tracked: number };

function rankStudent(records: Array<{ studentId: string; _count: { _all: number } }>, present: Array<{ studentId: string; _count: { _all: number } }>, studentId: string): RankResult {
  const presentMap = new Map(present.map((p) => [p.studentId, p._count._all]));
  const rows = records
    .map((r) => ({ studentId: r.studentId, total: r._count._all, present: presentMap.get(r.studentId) ?? 0 }))
    .filter((r) => r.total > 0)
    .map((r) => ({ ...r, pct: (r.present / r.total) * 100 }))
    .sort((a, b) => b.pct - a.pct || b.total - a.total);
  const idx = rows.findIndex((r) => r.studentId === studentId);
  return { rank: idx === -1 ? null : idx + 1, tracked: rows.length };
}

async function StudentAttendanceView({ access }: { access: Access }) {
  const student = await prisma.student.findUnique({
    where: { userId: access.userId },
    include: {
      enrollments: {
        where: { isActive: true },
        include: { academicSemester: { include: { academicYear: true } }, department: { select: { name: true, shortName: true } } },
        orderBy: { academicSemester: { semesterNumber: "desc" } },
        take: 1,
      },
    },
  });

  if (!student) {
    return <EmptyState title="Student profile not linked" description="Contact the department coordinator to link your account to a student profile." />;
  }

  const enrollment = student.enrollments[0];
  const currentSemesterId = enrollment?.academicSemester.id;
  const deptId = enrollment?.departmentId;

  if (!currentSemesterId || !deptId) {
    return <EmptyState title="Not enrolled yet" description="You are not enrolled in any active semester. Contact your department once enrolment opens." />;
  }

  const activeIds = new Set(await getActiveSemesterIds());

  const registrations = await prisma.courseRegistration.findMany({
    where: { studentId: student.id, status: "REGISTERED", courseOffering: { isActive: true, academicSemesterId: currentSemesterId } },
    include: {
      courseOffering: {
        include: {
          course: { select: { code: true, name: true } },
          facultyAssignments: { where: { isPrimary: true, isActive: true }, include: { faculty: { include: { user: { select: { name: true } } } } } },
        },
      },
    },
    orderBy: { courseOffering: { course: { code: "asc" } } },
  });

  const courseStats = await Promise.all(
    registrations.map(async (r) => {
      const [total, present] = await Promise.all([
        prisma.attendanceRecord.count({ where: { studentId: student.id, courseOfferingId: r.courseOfferingId } }),
        prisma.attendanceRecord.count({ where: { studentId: student.id, courseOfferingId: r.courseOfferingId, status: "PRESENT" } }),
      ]);
      return { offering: r.courseOffering, total, present };
    })
  );

  const overallTotal = courseStats.reduce((a, c) => a + c.total, 0);
  const overallPresent = courseStats.reduce((a, c) => a + c.present, 0);
  const overallPct = overallTotal > 0 ? (overallPresent / overallTotal) * 100 : null;

  const classEnrollments = await prisma.studentSemesterEnrollment.findMany({
    where: { academicSemesterId: currentSemesterId, isActive: true, departmentId: deptId },
    select: { studentId: true },
  });
  const classStudentIds = classEnrollments.map((e) => e.studentId);

  const deptEnrollments = await prisma.studentSemesterEnrollment.findMany({
    where: { academicSemesterId: { in: [...activeIds] }, isActive: true, departmentId: deptId },
    select: { studentId: true },
  });
  const deptStudentIds = deptEnrollments.map((e) => e.studentId);

  const [classRecords, classPresent, deptRecords, deptPresent] = await Promise.all([
    prisma.attendanceRecord.groupBy({
      by: ["studentId"],
      where: { studentId: { in: classStudentIds }, courseOffering: { academicSemesterId: currentSemesterId } },
      _count: { _all: true },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["studentId"],
      where: { studentId: { in: classStudentIds }, courseOffering: { academicSemesterId: currentSemesterId }, status: "PRESENT" },
      _count: { _all: true },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["studentId"],
      where: { studentId: { in: deptStudentIds }, courseOffering: { academicSemesterId: { in: [...activeIds] } } },
      _count: { _all: true },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["studentId"],
      where: { studentId: { in: deptStudentIds }, courseOffering: { academicSemesterId: { in: [...activeIds] } }, status: "PRESENT" },
      _count: { _all: true },
    }),
  ]);

  const classRank = rankStudent(classRecords, classPresent, student.id);
  const deptRank = rankStudent(deptRecords, deptPresent, student.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description={`Your class attendance · Sem ${enrollment.academicSemester.semesterNumber} · ${enrollment.academicSemester.academicYear.name}${enrollment.department?.shortName ? ` · ${enrollment.department.shortName}` : ""}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall Attendance"
          value={overallPct === null ? "—" : formatPercent(overallPct)}
          hint={overallTotal > 0 ? `${overallPresent} / ${overallTotal} classes` : "No classes recorded yet"}
          icon={<CalendarCheck className="h-5 w-5" />}
          tone={overallPct !== null && overallPct < 75 ? "destructive" : overallPct !== null && overallPct >= 75 ? "success" : "default"}
        />
        <StatCard label="Courses Tracked" value={courseStats.length} hint={`Sem ${enrollment.academicSemester.semesterNumber}`} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard
          label="Rank in Class"
          value={classRank.rank ? `#${classRank.rank}` : "—"}
          hint={classRank.tracked > 0 ? `of ${classRank.tracked} students tracked` : "No attendance data yet"}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Rank in Department"
          value={deptRank.rank ? `#${deptRank.rank}` : "—"}
          hint={deptRank.tracked > 0 ? `of ${deptRank.tracked} students tracked` : "No attendance data yet"}
          icon={<Trophy className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>My Courses</CardTitle>
          <Badge variant="secondary">{courseStats.length} subjects</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {courseStats.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No registered courses" description="Your registered courses for this semester will appear here once they are set up." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead className="w-48">Attendance</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseStats.map(({ offering, total, present }) => {
                  const pct = total > 0 ? (present / total) * 100 : null;
                  return (
                    <TableRow key={offering.id}>
                      <TableCell>
                        <p className="font-medium">{offering.course.code}</p>
                        <p className="text-xs text-muted-foreground">{offering.course.name}</p>
                      </TableCell>
                      <TableCell>{offering.facultyAssignments[0]?.faculty.user?.name ?? "Unassigned"}</TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{present} / {total} classes</span>
                          </div>
                          <div className="h-1.5 w-full rounded-sm bg-muted">
                            <div className="h-1.5 rounded-sm bg-primary" style={{ width: `${pct ?? 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {pct === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={pct < 75 ? "destructive" : "success"}>{formatPercent(pct)}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
