import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Card, CardContent, EmptyState, PageHeader } from "@/components/ui";
import { SectionManager } from "@/components/sections/section-manager";
import { getActiveSemesterIds } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function SectionsPage({ searchParams }: { searchParams: Promise<{ department?: string; semester?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "academic.view");
  const canManage = access.permissions.has("academic.configure");
  const { department, semester } = await searchParams;

  const activeIds = new Set(await getActiveSemesterIds());
  const semesters = await prisma.academicSemester.findMany({ include: { academicYear: true }, orderBy: [{ academicYear: { startDate: "asc" } }, { semesterNumber: "asc" }] });
  const activeSem = semesters.find((s) => activeIds.has(s.id));
  const selectedSem = semesters.find((s) => s.id === semester) ?? activeSem;

  let departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
  if (access.departmentIds.length) {
    departments = departments.filter((d) => access.departmentIds.includes(d.id));
  }
  const selectedDepartment = departments.find((d) => d.id === department) ?? departments[0];

  const sections = selectedSem && selectedDepartment
    ? await prisma.section.findMany({
        where: { departmentId: selectedDepartment.id, academicSemesterId: selectedSem.id, isActive: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Create class sections (A, B, C, …) for each department & semester."
      />

      <form className="flex flex-wrap items-center gap-2">
        <select name="semester" defaultValue={selectedSem?.id} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          {semesters.map((s) => <option key={s.id} value={s.id}>{s.academicYear.name} Sem {s.semesterNumber}{activeIds.has(s.id) ? " · Active" : ""}</option>)}
        </select>
        <select name="department" defaultValue={selectedDepartment?.id} className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          {departments.map((d) => <option key={d.id} value={d.id}>{d.shortName ?? d.code} · {d.name}</option>)}
        </select>
        <button type="submit" className="h-9 rounded-md border border-border bg-card px-3 text-sm font-medium shadow-sm hover:bg-muted">View</button>
      </form>

      {!selectedSem || !selectedDepartment ? (
        <EmptyState title="No departments or semesters" description="Configure departments and semesters first." />
      ) : (
        <Card>
          <CardContent className="p-5">
            <SectionManager
              departmentId={selectedDepartment.id}
              semesterId={selectedSem.id}
              departmentLabel={selectedDepartment.shortName ?? selectedDepartment.code}
              semesterLabel={`Sem ${selectedSem.semesterNumber}`}
              sections={sections.map((s) => ({ id: s.id, name: s.name }))}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
