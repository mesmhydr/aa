import * as React from "react";
import Link from "next/link";
import {
  Users,
  UserCog,
  Building2,
  CalendarCheck,
  Wallet,
  Landmark,
  MessageSquare,
  ClipboardList,
  FileText,
  GraduationCap,
  Clock,
  AlarmClock,
  BookOpen,
  ArrowRight,
  TriangleAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Access } from "@/lib/access";
import { getScope, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, PageHeader } from "@/components/ui";
import { formatDate, formatNumber, formatPercent, titleCase } from "@/lib/utils";
import { getActiveSeason, getActiveSemesterIds, seasonOfSemester } from "@/lib/season";

function dec(n: unknown): number {
  return typeof n === "number" ? n : Number(n ?? 0);
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

async function overallAttendancePercent(departmentId?: string) {
  const total = await prisma.attendanceRecord.count({ where: departmentId ? { courseOffering: { departmentId } } : undefined });
  if (total === 0) return null;
  const present = await prisma.attendanceRecord.count({
    where: {
      ...(departmentId ? { courseOffering: { departmentId } } : {}),
      status: "PRESENT",
    },
  });
  return (present / total) * 100;
}

export async function AdminDashboard({ access }: { access: Access }) {
  const [students, faculty, departments, exams, pendingFeeStudents, grievances, attendance] = await Promise.all([
    prisma.student.count({ where: { isActive: true } }),
    prisma.faculty.count({ where: { isActive: true } }),
    prisma.department.count({ where: { isActive: true } }),
    prisma.exam.count({ where: { isActive: true } }),
    prisma.studentFee.groupBy({ by: ["studentId"], where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } } }).then((r) => r.length),
    prisma.grievance.count({ where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } } }),
    overallAttendancePercent(),
  ]);

  const recentStudents = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      program: { include: { department: { select: { name: true } } } },
      batch: { select: { name: true, admissionYear: true } },
      user: { select: { name: true } },
    },
  });
  const recentAnnouncements = await prisma.announcement.findMany({
    orderBy: { publishedAt: "desc" },
    take: 5,
    include: { department: { select: { shortName: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Overview"
        description="Key performance indicators across the institution"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Students" value={students} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Faculty" value={faculty} icon={<UserCog className="h-5 w-5" />} />
        <StatCard label="Departments" value={departments} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Average Attendance" value={attendance === null ? "—" : formatPercent(attendance)} icon={<CalendarCheck className="h-5 w-5" />} tone={attendance !== null && attendance < 75 ? "destructive" : "success"} />
        <StatCard label="Fees Pending" value={`${pendingFeeStudents} students`} icon={<Wallet className="h-5 w-5" />} tone={pendingFeeStudents > 0 ? "warning" : "success"} />
        <StatCard label="Upcoming Exams" value={exams} icon={<Landmark className="h-5 w-5" />} />
        <StatCard label="Open Grievances" value={grievances} icon={<MessageSquare className="h-5 w-5" />} tone={grievances > 0 ? "warning" : "default"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recently Added Students</CardTitle>
            <Link href="/students" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentStudents.length === 0 ? (
              <EmptyState title="No students yet" description="Add students to get started" />
            ) : (
              <div className="space-y-2">
                {recentStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{s.user?.name ?? s.usn}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.usn} · {s.program.department.name} · Sem {s.batch.admissionYear}
                      </p>
                    </div>
                    <Badge variant="secondary">{s.batch.name ?? String(s.batch.admissionYear)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Announcements</CardTitle>
            <Link href="/announcements" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length === 0 ? (
              <EmptyState title="No announcements yet" />
            ) : (
              <div className="space-y-2">
                {recentAnnouncements.map((a) => (
                  <div key={a.id} className="rounded-md px-2 py-1.5 hover:bg-muted">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      {a.department && <Badge variant="secondary">{a.department.shortName}</Badge>}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function PrincipalDashboard({ access }: { access: Access }) {
  return <AdminDashboard access={access} />;
}

export async function HODDashboard({ access }: { access: Access }) {
  const deptIds = getScope(access).kind === "DEPARTMENT" ? (getScope(access) as { kind: "DEPARTMENT"; ids: string[] }).ids : [];
  const departmentIds = deptIds.length ? deptIds : [];

  const [students, faculty, courses, pendingLeaves, pendingQp, attendance, attendanceShortage, deptName] = await Promise.all([
    prisma.student.count({ where: { program: { departmentId: { in: departmentIds } }, isActive: true } }),
    prisma.faculty.count({ where: { departmentId: { in: departmentIds }, isActive: true } }),
    prisma.course.count({ where: { departmentId: { in: departmentIds }, isActive: true } }),
    prisma.leaveRequest.count({ where: { departmentId: { in: departmentIds }, status: "PENDING" } }),
    prisma.questionPaper.count({ where: { course: { departmentId: { in: departmentIds } }, status: "SUBMITTED" } }),
    overallAttendancePercent(departmentIds[0]),
    prisma.student.count({ where: { program: { departmentId: { in: departmentIds } } } }),
    prisma.department.findFirst({ where: { id: { in: departmentIds } }, select: { name: true } }),
  ]);

  const pendingQps = await prisma.questionPaper.findMany({
    where: { course: { departmentId: { in: departmentIds } }, status: "SUBMITTED" },
    include: { course: { select: { code: true, name: true } }, createdBy: { select: { name: true } } },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  const recentLeaves = await prisma.leaveRequest.findMany({
    where: { departmentId: { in: departmentIds }, status: "PENDING" },
    include: { user: { select: { name: true } }, leaveType: { select: { name: true } } },
    orderBy: { appliedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={deptName?.name ?? "Department"} description="Department performance overview" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={students} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Faculty" value={faculty} icon={<UserCog className="h-5 w-5" />} />
        <StatCard label="Courses" value={courses} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Attendance" value={attendance === null ? "—" : formatPercent(attendance)} icon={<CalendarCheck className="h-5 w-5" />} tone={attendance !== null && attendance < 75 ? "destructive" : "success"} />
        <StatCard label="Pending Leave" value={pendingLeaves} icon={<Clock className="h-5 w-5" />} tone={pendingLeaves > 0 ? "warning" : "default"} />
        <StatCard label="Papers Awaiting Approval" value={pendingQp} icon={<FileText className="h-5 w-5" />} tone={pendingQp > 0 ? "warning" : "default"} />
        <StatCard label="Students Tracked" value={attendanceShortage} icon={<GraduationCap className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Question Papers Awaiting Approval</CardTitle>
            <Link href="/question-papers" className="text-sm text-primary hover:underline">Review</Link>
          </CardHeader>
          <CardContent>
            {pendingQps.length === 0 ? (
              <EmptyState title="Nothing pending" description="All submitted papers have been reviewed" />
            ) : (
              <div className="space-y-2">
                {pendingQps.map((q) => (
                  <div key={q.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{q.course.code} · {q.title}</p>
                      <p className="text-xs text-muted-foreground">by {q.createdBy?.name ?? "Unknown"} · {formatDate(q.submittedAt)}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Pending Leave Requests</CardTitle>
            <Link href="/leave" className="text-sm text-primary hover:underline">Review</Link>
          </CardHeader>
          <CardContent>
            {recentLeaves.length === 0 ? (
              <EmptyState title="No pending leave" />
            ) : (
              <div className="space-y-2">
                {recentLeaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{l.user.name}</p>
                      <p className="text-xs text-muted-foreground">{l.leaveType.name} · {formatDate(l.startDate)} – {formatDate(l.endDate)}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function FacultyDashboard({ access }: { access: Access }) {
  const faculty = await prisma.faculty.findUnique({
    where: { userId: access.userId },
    include: {
      department: { select: { id: true, name: true } },
      assignments: {
        where: { isActive: true },
        include: {
          courseOffering: {
            include: {
              course: { select: { code: true, name: true } },
              department: { select: { name: true } },
            },
          },
          academicSemester: { select: { semesterNumber: true, isActive: true } },
        },
      },
    },
  });

  if (!faculty) {
    return <EmptyState title="Faculty profile not linked" description="Contact the department coordinator to link your account to a faculty profile." />;
  }

  const facultyId = faculty.id;
  const today = new Date();
  const todayDay = DAYS[today.getDay()];
  const activeSeason = await getActiveSeason();
  const activeSemesterIds = new Set(await getActiveSemesterIds());
  const activeAssignments = faculty.assignments.filter((a) => activeSemesterIds.has(a.academicSemesterId));

  const [todayClasses, assessments, pendingAttendance, leaveReqs, myQps] = await Promise.all([
    prisma.timetableEntry.findMany({
      where: { facultyId, dayOfWeek: todayDay as never, isActive: true, academicSemesterId: { in: [...activeSemesterIds] } },
      include: {
        courseOffering: { include: { course: { select: { code: true, name: true } }, department: { select: { name: true } } } },
        room: { select: { code: true } },
      },
      orderBy: { periodNumber: "asc" },
    }),
    prisma.assessment.findMany({
      where: { courseOffering: { facultyAssignments: { some: { facultyId, isActive: true } } } },
      include: { courseOffering: { include: { course: { select: { code: true } }, department: { select: { name: true } } } }, component: { select: { name: true } } },
      orderBy: { assessmentDate: "desc" },
      take: 5,
    }),
    prisma.attendanceRecord.findMany({ where: { markedByUserId: access.userId }, orderBy: { markedAt: "desc" }, take: 3, select: { markedAt: true } }),
    prisma.leaveRequest.findMany({ where: { userId: access.userId }, orderBy: { appliedAt: "desc" }, take: 3 }),
    prisma.questionPaper.findMany({ where: { createdByUserId: access.userId }, orderBy: { updatedAt: "desc" }, take: 3, include: { course: { select: { code: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${access.user.name.split(" ")[0]}`}
        description={`${faculty.department.name} · ${faculty.designation} · ${activeSeason} season active`}
        actions={
          <>
            <Link href="/attendance"><Button size="sm"><CalendarCheck className="mr-1 h-4 w-4" /> Mark Attendance</Button></Link>
            <Link href="/question-papers"><Button size="sm" variant="outline"><FileText className="mr-1 h-4 w-4" /> Question Papers</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Course Assignments" value={activeAssignments.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Today's Classes" value={todayClasses.length} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Assessments" value={assessments.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="My Leave Requests" value={leaveReqs.length} icon={<AlarmClock className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>My Courses · {activeSeason} Season</CardTitle>
            <Link href="/attendance" className="text-sm text-primary hover:underline">Mark attendance</Link>
          </CardHeader>
          <CardContent>
            {activeAssignments.length === 0 ? (
              <EmptyState title="No active course assignments" description="Super admin assigns you courses each semester. Check Courses → Offerings." />
            ) : (
              <div className="space-y-2">
                {activeAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{a.courseOffering.course.code} · {a.courseOffering.course.name}</p>
                      <p className="text-xs text-muted-foreground">Sem {a.academicSemester.semesterNumber} · {a.courseOffering.department?.name}</p>
                    </div>
                    <Link href={`/attendance?offering=${a.courseOfferingId}`}>
                      <Button size="sm" variant="outline">Attendance</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Today&apos;s Classes</CardTitle>
            <Badge variant="secondary">{titleCase(todayDay)}</Badge>
          </CardHeader>
          <CardContent>
            {todayClasses.length === 0 ? (
              <EmptyState title="No classes today" />
            ) : (
              <div className="space-y-2">
                {todayClasses.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                        P{t.periodNumber}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{t.courseOffering.course.code} · {t.courseOffering.course.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.courseOffering.department?.name ? `${t.courseOffering.department.name} dept` : ""} · {t.room?.code ?? "No room"} · {t.startTime ?? ""}{t.endTime ? `–${t.endTime}` : ""}
                        </p>
                      </div>
                    </div>
                    <Link href={`/attendance?offering=${t.courseOfferingId}`}>
                      <Button size="sm" variant="outline">Mark</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Assessments</CardTitle>
          <Link href="/assessments" className="text-sm text-primary hover:underline">Manage</Link>
        </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <EmptyState title="No assessments yet" description="Create an internal assessment for your courses" />
            ) : (
              <div className="space-y-2">
                {assessments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.courseOffering.course.code} · {a.component.name} · {formatDate(a.assessmentDate)}</p>
                    </div>
                    <Badge variant={a.status === "PUBLISHED" ? "success" : a.status === "APPROVED" ? "success" : "secondary"}>
                      {titleCase(a.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}

export async function StudentDashboard({ access }: { access: Access }) {
  const student = await prisma.student.findUnique({
    where: { userId: access.userId },
    include: {
      program: { include: { department: { select: { shortName: true } } } },
      batch: { select: { name: true, admissionYear: true } },
      enrollments: {
        where: { isActive: true },
        include: { academicSemester: { select: { id: true, semesterNumber: true, isActive: true } }, department: { select: { shortName: true } } },
        orderBy: { academicSemester: { semesterNumber: "desc" } },
        take: 1,
      },
    },
  });

  if (!student) {
    return <EmptyState title="Student profile not linked" description="Contact the department coordinator to link your account to a student profile." />;
  }

  const today = new Date();
  const todayDay = DAYS[today.getDay()];
  const currentEnrollment = student.enrollments[0];
  const currentSemesterId = currentEnrollment?.academicSemester.id;
  const currentSemesterNumber = currentEnrollment?.academicSemester.semesterNumber;
  const currentDepartmentId = currentEnrollment?.department?.shortName;

  const [attRecords, presentCount, todayTimetable, myCourses, cieMarks, fees, exams, announcements] = await Promise.all([
    prisma.attendanceRecord.count({ where: { studentId: student.id } }),
    prisma.attendanceRecord.count({ where: { studentId: student.id, status: "PRESENT" } }),
    prisma.timetableEntry.findMany({
      where: { dayOfWeek: todayDay as never, isActive: true, academicSemesterId: currentSemesterId ?? undefined },
      include: { courseOffering: { include: { course: { select: { code: true, name: true } } } }, room: { select: { code: true } } },
      orderBy: { periodNumber: "asc" },
    }),
    prisma.courseRegistration.findMany({
      where: { studentId: student.id, status: "REGISTERED", courseOffering: { academicSemesterId: currentSemesterId ?? undefined, isActive: true } },
      include: { courseOffering: { include: { course: { select: { code: true, name: true, credits: true } }, facultyAssignments: { where: { isPrimary: true, isActive: true }, include: { faculty: { include: { user: { select: { name: true } } } } } } } } },
      orderBy: { courseOffering: { course: { code: "asc" } } },
    }),
    prisma.cieMark.findMany({
      where: { studentId: student.id },
      include: { assessment: { include: { courseOffering: { include: { course: { select: { code: true, name: true } } } }, component: { select: { name: true } } } } },
      orderBy: { assessment: { assessmentDate: "desc" } },
      take: 5,
    }),
    prisma.studentFee.findMany({
      where: { studentId: student.id, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
      include: { feeType: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.exam.findMany({
      where: { examSession: { academicSemester: { semesterNumber: currentSemesterNumber ?? undefined } }, examDate: { gte: new Date() } },
      include: { course: { select: { code: true, name: true } } },
      orderBy: { examDate: "asc" },
      take: 5,
    }),
    prisma.announcement.findMany({ where: { isActive: true, audience: { in: ["INSTITUTION", "DEPARTMENT"] } }, orderBy: { publishedAt: "desc" }, take: 4 }),
  ]);

  const attendancePct = attRecords > 0 ? (presentCount / attRecords) * 100 : null;
  const dueTotal = fees.reduce((acc, f) => acc + dec(f.amount) - dec(f.paidAmount) - dec(f.discountAmount) - dec(f.waivedAmount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${access.user.name.split(" ")[0]}`}
        description={`${student.program.department.shortName ?? ""} · Sem ${currentSemesterNumber ?? ""}${currentDepartmentId ? ` · ${currentDepartmentId}` : ""}${student.usn ? ` · ${student.usn}` : ""}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance" value={attendancePct === null ? "—" : formatPercent(attendancePct)} hint={`${presentCount} / ${attRecords} sessions`} icon={<CalendarCheck className="h-5 w-5" />} tone={attendancePct !== null && attendancePct < 75 ? "destructive" : "success"} />
        <StatCard label="Today's Classes" value={todayTimetable.length} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Fee Dues" value={`₹${dueTotal.toLocaleString("en-IN")}`} icon={<Wallet className="h-5 w-5" />} tone={dueTotal > 0 ? "warning" : "success"} />
        <StatCard label="Upcoming Exams" value={exams.length} icon={<Landmark className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>My Courses · Sem {currentSemesterNumber ?? "—"}</CardTitle>
          <Badge variant="secondary">Registered</Badge>
        </CardHeader>
        <CardContent>
          {myCourses.length === 0 ? (
            <EmptyState title="No courses assigned yet" description="Your registered courses for this semester will appear here once the super admin sets them up." />
          ) : (
            <div className="space-y-2">
              {myCourses.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                  <div>
                    <p className="text-sm font-medium">{r.courseOffering.course.code} · {r.courseOffering.course.name}</p>
                    <p className="text-xs text-muted-foreground">{r.courseOffering.course.credits} credits · {r.courseOffering.facultyAssignments[0]?.faculty.user?.name ?? "Unassigned"}</p>
                  </div>
                  <Badge variant="secondary">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Today&apos;s Timetable</CardTitle>
            <Badge variant="secondary">{titleCase(todayDay)}</Badge>
          </CardHeader>
          <CardContent>
            {todayTimetable.length === 0 ? (
              <EmptyState title="No classes today" />
            ) : (
              <div className="space-y-2">
                {todayTimetable.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">P{t.periodNumber}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.courseOffering.course.name}</p>
                      <p className="text-xs text-muted-foreground">{t.courseOffering.course.code} · {t.room?.code ?? "—"} · {t.startTime ?? ""}{t.endTime ? `–${t.endTime}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent CIE Marks</CardTitle>
            <Link href="/results" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {cieMarks.length === 0 ? (
              <EmptyState title="No marks published yet" />
            ) : (
              <div className="space-y-2">
                {cieMarks.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{m.assessment.courseOffering.course.code}</p>
                      <p className="text-xs text-muted-foreground">{m.assessment.component.name} · {formatDate(m.assessment.assessmentDate)}</p>
                    </div>
                    <Badge variant={m.status === "APPROVED" || m.status === "LOCKED" ? "success" : "secondary"}>
                      {m.marksObtained !== null ? `${m.marksObtained} / ${m.maxMarks}` : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Fee Dues</CardTitle>
            <Link href="/fees" className="text-sm text-primary hover:underline">View fees</Link>
          </CardHeader>
          <CardContent>
            {fees.length === 0 ? (
              <EmptyState title="No pending fees" />
            ) : (
              <div className="space-y-2">
                {fees.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{f.feeType.name}</p>
                      <p className="text-xs text-muted-foreground">Due {formatDate(f.dueDate)}</p>
                    </div>
                    <Badge variant="warning">₹{dec(f.amount).toLocaleString("en-IN")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <EmptyState title="No upcoming exams" />
            ) : (
              <div className="space-y-2">
                {exams.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">{e.course.code}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.examDate)}{e.startTime ? ` · ${e.startTime}` : ""}</p>
                    </div>
                    <Badge>{formatDate(e.examDate)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <EmptyState title="No announcements" />
          ) : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-md px-2 py-1.5 hover:bg-muted">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export async function DashboardRouter({ access }: { access: Access }) {
  if (access.roleCodes.includes("SUPER_ADMIN") || access.roleCodes.includes("ADMIN")) {
    return <AdminDashboard access={access} />;
  }
  if (access.roleCodes.includes("PRINCIPAL") || access.roleCodes.includes("MANAGEMENT") || access.roleCodes.includes("IQAC")) {
    return <PrincipalDashboard access={access} />;
  }
  if (access.roleCodes.includes("EXAM_CONTROLLER")) {
    return <PrincipalDashboard access={access} />;
  }
  if (access.roleCodes.includes("ACCOUNTS")) {
    return <PrincipalDashboard access={access} />;
  }
  if (access.roleCodes.includes("HOD") || access.roleCodes.includes("DEPT_COORDINATOR")) {
    return <HODDashboard access={access} />;
  }
  if (access.roleCodes.includes("FACULTY")) {
    return <FacultyDashboard access={access} />;
  }
  if (access.roleCodes.includes("STUDENT")) {
    return <StudentDashboard access={access} />;
  }
  return <AdminDashboard access={access} />;
}
