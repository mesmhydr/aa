import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import type { Access } from "@/lib/access";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { TimetableGrid, type GridCourse, type GridEntry } from "@/components/timetable/timetable-grid";
import { getActiveSemesterIds } from "@/lib/season";
import { dayOfWeekForDate, formatTime, PERIOD_TIMES } from "@/lib/timetable";
import { BookOpen, CalendarDays, Clock, Coffee, MapPin, User } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type EntryWithDetails = Awaited<ReturnType<typeof fetchEntries>>[number];

async function fetchEntries(where: Prisma.TimetableEntryWhereInput) {
  return prisma.timetableEntry.findMany({
    where,
    include: {
      courseOffering: {
        include: {
          course: true,
          department: true,
          facultyAssignments: {
            where: { isPrimary: true, isActive: true },
            include: { faculty: { include: { user: { select: { name: true } } } } },
          },
        },
      },
      room: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
  });
}

function toGridEntries(entries: EntryWithDetails[], facultyNameById: Map<string, string>): GridEntry[] {
  return entries.map((e) => ({
    id: e.id,
    dayOfWeek: e.dayOfWeek as GridEntry["dayOfWeek"],
    periodNumber: e.periodNumber,
    courseId: e.courseOffering.courseId,
    courseCode: e.courseOffering.course.code,
    courseName: e.courseOffering.course.name,
    courseShort: e.courseOffering.course.shortName,
    departmentShort: e.courseOffering.department.shortName ?? e.courseOffering.department.code,
    facultyName: e.facultyId ? facultyNameById.get(e.facultyId) ?? null : e.courseOffering.facultyAssignments[0]?.faculty.user?.name ?? null,
    roomCode: e.room?.code ?? null,
  }));
}

function TodayClasses({ entries, title, facultyNameById }: { entries: EntryWithDetails[]; title: string; facultyNameById: Map<string, string> }) {
  const today = dayOfWeekForDate(new Date());
  const todays = today ? entries.filter((e) => e.dayOfWeek === today) : [];
  const dayLabel = today?.toLowerCase() ?? "sunday";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <Badge variant="secondary" className="capitalize">{dayLabel}</Badge>
      </CardHeader>
      <CardContent className="p-5">
        {!today ? (
          <EmptyState title="It's Sunday" description="Enjoy the weekend — no classes scheduled today." />
        ) : todays.length === 0 ? (
          <EmptyState title="No classes today" description="You have no classes scheduled for today." />
        ) : (
          <ol className="space-y-3">
            {todays.map((e) => {
              const times = PERIOD_TIMES[e.periodNumber];
              const instructor = e.facultyId
                ? facultyNameById.get(e.facultyId) ?? null
                : e.courseOffering.facultyAssignments[0]?.faculty.user?.name ?? null;
              return (
                <li key={e.id} className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
                  <div className="flex h-10 w-16 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                    <span className="text-sm font-bold">{e.periodNumber}</span>
                    <span className="text-[10px] leading-none">{times ? formatTime(times.startTime) : ""}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{e.courseOffering.course.code} · {e.courseOffering.course.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {times ? `${formatTime(times.startTime)}–${formatTime(times.endTime)}` : ""}
                      </span>
                      {e.room?.code && (
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.room.code}</span>
                      )}
                      {instructor && (
                        <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{instructor}</span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {e.courseOffering.department.shortName ?? e.courseOffering.department.code}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ semester?: string; department?: string; section?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "timetable.view");

  if (access.roleCodes.includes("STUDENT")) return <StudentTimetableView access={access} />;
  if (access.roleCodes.includes("FACULTY")) return <FacultyTimetableView access={access} />;
  return <AdminTimetableView access={access} searchParams={searchParams} />;
}

async function AdminTimetableView({ access, searchParams }: { access: Access; searchParams: Promise<{ semester?: string; department?: string; section?: string }> }) {
  const { semester, department, section } = await searchParams;

  const activeIds = new Set(await getActiveSemesterIds());
  const semesters = await prisma.academicSemester.findMany({ include: { academicYear: true }, orderBy: [{ academicYear: { startDate: "asc" } }, { semesterNumber: "asc" }] });
  const activeSem = semesters.find((s) => activeIds.has(s.id));
  const selectedSem = semesters.find((s) => s.id === semester) ?? activeSem;

  let departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
  if (access.departmentIds.length) {
    departments = departments.filter((d) => access.departmentIds.includes(d.id));
  }
  const selectedDepartment = departments.find((d) => d.id === department) ?? departments[0];

  const canEdit = access.permissions.has("timetable.create") && access.permissions.has("timetable.edit");

  const [faculty, rooms] = await Promise.all([
    prisma.faculty.findMany({ where: { isActive: true }, select: { id: true, employeeId: true, user: { select: { name: true } } }, orderBy: { employeeId: "asc" } }),
    prisma.room.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);
  const facultyNameById = new Map(faculty.map((f) => [f.id, f.user?.name ?? f.employeeId]));
  const facultyOptions = faculty.map((f) => ({ id: f.id, name: f.user?.name ?? f.employeeId }));

  let courses: GridCourse[] = [];
  let entries: EntryWithDetails[] = [];
  let sections: Array<{ id: string; name: string }> = [];
  let selectedSection: { id: string; name: string } | null = null;
  if (selectedSem && selectedDepartment) {
    const [deptCourses, offerings, deptSections] = await Promise.all([
      prisma.course.findMany({
        where: { isActive: true, departmentId: selectedDepartment.id },
        orderBy: [{ semesterNumber: "asc" }, { code: "asc" }],
        select: { id: true, code: true, name: true, shortName: true, semesterNumber: true },
      }),
      prisma.courseOffering.findMany({
        where: { isActive: true, academicSemesterId: selectedSem.id, departmentId: selectedDepartment.id },
        include: { facultyAssignments: { where: { isPrimary: true, isActive: true }, select: { facultyId: true } } },
      }),
      prisma.section.findMany({
        where: { departmentId: selectedDepartment.id, academicSemesterId: selectedSem.id, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    const primaryByCourse = new Map(offerings.map((o) => [o.courseId, o.facultyAssignments[0]?.facultyId ?? null]));
    courses = deptCourses.map((c) => ({ ...c, primaryFacultyId: primaryByCourse.get(c.id) ?? null }));
    sections = deptSections;
    selectedSection = sections.find((s) => s.id === section) ?? sections[0] ?? null;
    if (selectedSection) {
      entries = await fetchEntries({
        isActive: true,
        academicSemesterId: selectedSem.id,
        courseOffering: { departmentId: selectedDepartment.id },
        sectionId: selectedSection.id,
      });
    }
  }

  const gridEntries = toGridEntries(entries, facultyNameById);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Design the weekly timetable for a department & semester. Assign courses to cells — the schedule is shown to all students of that department & semester and to the instructors."
      />

      <form className="flex flex-wrap items-center gap-2">
        <select name="semester" defaultValue={selectedSem?.id} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          {semesters.map((s) => <option key={s.id} value={s.id}>{s.academicYear.name} Sem {s.semesterNumber}{activeIds.has(s.id) ? " · Active" : ""}</option>)}
        </select>
        <select name="department" defaultValue={selectedDepartment?.id} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          {departments.map((d) => <option key={d.id} value={d.id}>{d.shortName ?? d.code} · {d.name}</option>)}
        </select>
        {sections.length > 0 && (
          <select name="section" defaultValue={selectedSection?.id ?? ""} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
            {sections.map((s) => <option key={s.id} value={s.id}>Section {s.name}</option>)}
          </select>
        )}
        <button type="submit" className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium shadow-sm hover:bg-muted">View</button>
      </form>

      {!selectedSem || !selectedDepartment ? (
        <EmptyState title="No departments or semesters" description="Configure departments and active semesters first." />
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>
              {selectedDepartment.shortName ?? selectedDepartment.name} · Sem {selectedSem.semesterNumber}
              {selectedSection ? <span className="ml-2 text-muted-foreground">· Section {selectedSection.name}</span> : null}
            </CardTitle>
            <Badge variant="secondary">Mon–Sat · 8 periods</Badge>
          </CardHeader>
          <CardContent className="p-4">
            {courses.length === 0 ? (
              <EmptyState title="No courses in this department" description="Add courses in Courses → Course Catalog first, then come back to build the timetable." />
            ) : (
              <>
                <TimetableGrid
                  semesterId={selectedSem.id}
                  sectionId={selectedSection?.id ?? null}
                  entries={gridEntries}
                  courses={courses}
                  faculty={facultyOptions}
                  rooms={rooms.map((r) => ({ id: r.id, code: r.code }))}
                  canEdit={canEdit}
                  today={dayOfWeekForDate(new Date())}
                />
                {canEdit && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Click any empty cell to assign a course (or click a filled cell to change it). Courses without an offering for this semester are created automatically.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function StudentTimetableView({ access }: { access: Access }) {
  const student = await prisma.student.findUnique({
    where: { userId: access.userId },
    include: {
      enrollments: {
        where: { isActive: true },
        include: {
          academicSemester: { include: { academicYear: true } },
          department: { select: { name: true, shortName: true } },
          section: { select: { name: true } },
        },
        orderBy: { academicSemester: { semesterNumber: "desc" } },
        take: 1,
      },
    },
  });

  if (!student) {
    return <EmptyState title="Student profile not linked" description="Contact the department coordinator to link your account to a student profile." />;
  }
  const enrollment = student.enrollments[0];
  if (!enrollment) {
    return <EmptyState title="Not enrolled yet" description="You are not enrolled in any semester yet. Contact your department once enrolment opens." />;
  }

  const entries = await fetchEntries({
    isActive: true,
    academicSemesterId: enrollment.academicSemesterId,
    courseOffering: { departmentId: enrollment.departmentId },
    ...(enrollment.sectionId ? { sectionId: enrollment.sectionId } : {}),
  });
  const facultyIds = [...new Set(entries.map((e) => e.facultyId).filter((x): x is string => Boolean(x)))];
  const facultyRows = facultyIds.length
    ? await prisma.faculty.findMany({ where: { id: { in: facultyIds } }, select: { id: true, employeeId: true, user: { select: { name: true } } } })
    : [];
  const facultyNameById = new Map(facultyRows.map((f) => [f.id, f.user?.name ?? f.employeeId]));
  const gridEntries = toGridEntries(entries, facultyNameById);
  const deptLabel = enrollment.department.shortName ?? enrollment.department.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Timetable"
        description={`${deptLabel} · Sem ${enrollment.academicSemester.semesterNumber}${enrollment.section ? ` · Section ${enrollment.section.name}` : ""} · ${enrollment.academicSemester.academicYear.name}`}
      />

      <TodayClasses entries={entries} title="Today's Classes" facultyNameById={facultyNameById} />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Weekly Timetable</CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1"><Coffee className="h-3 w-3" />Break & lunch included</Badge>
        </CardHeader>
        <CardContent className="p-4">
          {gridEntries.length === 0 ? (
            <EmptyState title="Timetable not published yet" description="Your department's timetable for this semester hasn't been set up. Check back soon." />
          ) : (
            <TimetableGrid semesterId={enrollment.academicSemesterId} entries={gridEntries} courses={[]} faculty={[]} rooms={[]} today={dayOfWeekForDate(new Date())} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function FacultyTimetableView({ access }: { access: Access }) {
  const faculty = await prisma.faculty.findUnique({
    where: { userId: access.userId },
    include: { department: { select: { name: true, shortName: true } } },
  });
  if (!faculty) {
    return <EmptyState title="Faculty profile not linked" description="Contact the administrator to link your account to a faculty profile." />;
  }

  const facultyNameById = new Map([[faculty.id, access.user.name]]);
  const entries = await fetchEntries({
    isActive: true,
    OR: [
      { facultyId: faculty.id },
      { courseOffering: { facultyAssignments: { some: { facultyId: faculty.id, isPrimary: true, isActive: true } } } },
    ],
  });
  const gridEntries = toGridEntries(entries, facultyNameById);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Timetable"
        description={`Classes assigned to you · ${faculty.department.shortName ?? faculty.department.name}`}
      />

      <TodayClasses entries={entries} title="Today's Classes" facultyNameById={facultyNameById} />

      <Card>
        <CardHeader>
          <CardTitle>Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {gridEntries.length === 0 ? (
            <EmptyState title="No classes assigned" description="Once your courses are scheduled in a department's timetable, they will appear here." />
          ) : (
            <TimetableGrid semesterId="" entries={gridEntries} courses={[]} faculty={[]} rooms={[]} today={dayOfWeekForDate(new Date())} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
