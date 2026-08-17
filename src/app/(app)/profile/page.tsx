import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/access";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const access = await requireAccess();

  const [user, student, faculty] = await Promise.all([
    prisma.user.findUnique({
      where: { id: access.userId },
      include: {
        roles: { include: { role: true, department: true } },
        notifications: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.student.findUnique({
      where: { userId: access.userId },
      include: {
        user: true,
        program: { include: { department: true } },
        batch: true,
        scheme: true,
        profile: true,
        parent: true,
        enrollments: {
          orderBy: { academicSemester: { semesterNumber: "desc" } },
          take: 5,
          include: { academicSemester: { include: { academicYear: true } }, department: true },
        },
      },
    }),
    prisma.faculty.findUnique({ where: { userId: access.userId }, include: { department: true } }),
  ]);

  if (!user) return <p className="text-sm text-muted-foreground">Profile unavailable</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description={`${user.email} · ${access.roleCodes.join(", ")}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{user.name}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user.email}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{formatDate(user.createdAt)}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>{user.status}</Badge></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {user.roles.map((r) => (
              <div key={r.roleId} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                <span className="font-medium">{r.role.name}</span>
                <span className="text-xs text-muted-foreground">
                  {r.role.scope}{r.department ? ` · ${r.department.name}` : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent notifications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {user.notifications.map((n) => (
              <div key={n.id} className="text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
              </div>
            ))}
            {user.notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications</p>}
          </CardContent>
        </Card>
      </div>

      {student && (
        <Card>
          <CardHeader><CardTitle>Student record</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <p className="flex justify-between"><span className="text-muted-foreground">USN</span><span className="font-mono">{student.usn ?? "—"}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{student.program.department.name}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">Program</span><span>{student.program.code}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">Semester</span><span>{student.enrollments[0]?.academicSemester.semesterNumber ?? "—"}</span></p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Enrollments</p>
              {student.enrollments.map((e) => (
                <p key={e.id} className="text-xs">
                  Sem {e.academicSemester.semesterNumber} · {e.academicSemester.academicYear.name} · {e.department?.name ?? "—"}
                </p>
              ))}
            </div>
            <Link href={`/students/${student.id}`} className="text-primary hover:underline">View full student record →</Link>
          </CardContent>
        </Card>
      )}

      {faculty && (
        <Card>
          <CardHeader><CardTitle>Faculty record</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-muted-foreground">Designation</span><span>{faculty.designation} · {faculty.employeeId}</span></p>
            <p className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{faculty.department?.name ?? "—"}</span></p>
            <Link href={`/faculty/${faculty.id}`} className="inline-block text-primary hover:underline">View full faculty record →</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}