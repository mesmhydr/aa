import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { YearForm, ProgramForm, SchemeForm, SemesterForm, BatchForm } from "@/components/academics/academic-forms";
import { toggleProgram, setSemesterStatus, setActiveSeason } from "@/app/(app)/academics/actions";
import { getActiveSeason, getActiveSemesters, seasonOfSemester } from "@/lib/season";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const semesterStatus = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

export default async function AcademicsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "academic.view");
  const canEdit = access.permissions.has("academic.configure");
  const { tab } = await searchParams;

  const institution = await prisma.institution.findFirst();
  const [activeSeason, activeSemesters, years, departments, programs, schemes, semesters, batches] = await Promise.all([
    getActiveSeason(),
    getActiveSemesters(),
    prisma.academicYear.findMany({ orderBy: { startDate: "desc" } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.program.findMany({ orderBy: { name: "asc" }, include: { department: true } }),
    prisma.scheme.findMany({ orderBy: { createdAt: "desc" }, include: { programs: { include: { program: true } } } }),
    prisma.academicSemester.findMany({ orderBy: { semesterNumber: "asc" }, include: { academicYear: true } }),
    prisma.batch.findMany({ orderBy: [{ admissionYear: "desc" }, { name: "asc" }], include: { program: { include: { department: true } }, scheme: true } }),
  ]);

  const nextSeason: "ODD" | "EVEN" = activeSeason === "ODD" ? "EVEN" : "ODD";

  const current = (v: string) => (tab ?? "years") === v;
  const tabs = [
    { value: "years", label: `Academic Years (${years.length})` },
    { value: "programs", label: `Programs (${programs.length})` },
    { value: "schemes", label: `Schemes (${schemes.length})` },
    { value: "semesters", label: `Semesters (${semesters.length})` },
    { value: "batches", label: `Batches (${batches.length})` },
  ];

  const headerAction = (() => {
    if (!canEdit || !institution) return undefined;
    if (current("years")) return <YearForm institutionId={institution.id} />;
    if (current("programs")) return <ProgramForm institutionId={institution.id} departments={departments} />;
    if (current("schemes")) return <SchemeForm institutionId={institution.id} programs={programs} />;
    if (current("batches")) return <BatchForm institutionId={institution.id} programs={programs} schemes={schemes} />;
    return undefined;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        description="Academic years, programs, schemes, semesters and batches"
        actions={headerAction}
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Badge variant={activeSeason === "ODD" ? "success" : "warning"}>{activeSeason}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Active season: {activeSeason} semester{activeSemesters.length === 1 ? "" : "s"} {activeSemesters.map((s) => s.semesterNumber).join(", ")}</p>
              <p className="text-xs text-muted-foreground">
                All {seasonOfSemester(activeSemesters[0]?.semesterNumber ?? 1)}-numbered semesters are operational. Students and faculty see courses for their own semester.
              </p>
            </div>
          </div>
          {canEdit && institution && (
            <form action={async () => { "use server"; await setActiveSeason(nextSeason); }}>
              <Button type="submit" variant="outline">Switch to {nextSeason} season</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <a
            key={t.value}
            href={`/academics?tab=${t.value}`}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${current(t.value) ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {current("years") && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-center">Semesters</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((y) => (
                  <TableRow key={y.id}>
                    <TableCell className="font-medium">{y.name}</TableCell>
                    <TableCell>{formatDate(y.startDate)} — {formatDate(y.endDate)}</TableCell>
                    <TableCell className="text-center">{semesters.filter((s) => s.academicYearId === y.id).length}</TableCell>
                    <TableCell>
                      <Badge variant={y.isActive ? "success" : "secondary"}>{y.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <YearForm institutionId={y.institutionId} existing={y} />
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

      {current("programs") && (
        programs.length === 0 ? (
          <EmptyState title="No programs yet" description="Add programs to map departments to degrees." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Semesters</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.code} · {p.degreeType}</p>
                      </TableCell>
                      <TableCell>{p.department.name}</TableCell>
                      <TableCell className="text-center">{p.durationSemesters}</TableCell>
                      <TableCell><Badge variant={p.isActive ? "success" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ProgramForm institutionId={p.institutionId} departments={departments} existing={p} />
                            <form action={async () => { "use server"; await toggleProgram(p.id, !p.isActive); }}>
                              <Button type="submit" size="sm" variant="outline">{p.isActive ? "Deactivate" : "Activate"}</Button>
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
        )
      )}

      {current("schemes") && (
        schemes.length === 0 ? (
          <EmptyState title="No schemes yet" description="Add curriculum schemes (e.g. VTU-2022) and link programs." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scheme</TableHead>
                    <TableHead className="text-center">Programs</TableHead>
                    <TableHead>Regulation</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schemes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.code}</p>
                      </TableCell>
                      <TableCell className="text-center">{s.programs.length}</TableCell>
                      <TableCell>{s.regulation ?? "—"}</TableCell>
                      <TableCell><Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <SchemeForm institutionId={s.institutionId} programs={programs} existing={{ id: s.id, code: s.code, name: s.name, regulation: s.regulation, programIds: s.programs.map((sp) => sp.programId) }} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      )}

      {current("semesters") && (
        <div className="space-y-6">
          {years.map((y) => {
            const sem = semesters.filter((s) => s.academicYearId === y.id);
            return (
              <Card key={y.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{y.name}</p>
                      {sem.length === 0 && <p className="text-xs text-muted-foreground">No semesters defined</p>}
                    </div>
                    {canEdit && <SemesterForm academicYearId={y.id} />}
                  </div>
                  {sem.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Sem</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Status</TableHead>
                          {canEdit && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sem.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.semesterNumber}</TableCell>
                            <TableCell>{formatDate(s.startDate)} — {formatDate(s.endDate)}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <Badge variant={seasonOfSemester(s.semesterNumber) === activeSeason ? "success" : "secondary"}>{seasonOfSemester(s.semesterNumber)}</Badge>
                                <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"}>{s.status}</Badge>
                              </span>
                            </TableCell>
                            {canEdit && (
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <SemesterForm academicYearId={y.id} existing={s} />
                                  {semesterStatus.map((st) => (
                                    st !== s.status && (
                                      <form key={st} action={async () => { "use server"; await setSemesterStatus(s.id, st); }}>
                                        <Button type="submit" size="sm" variant="ghost" className="text-xs">{st}</Button>
                                      </form>
                                    )
                                  ))}
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {current("batches") && (
        batches.length === 0 ? (
          <EmptyState title="No batches yet" description="Add batches (e.g. 2026 intake) for each program." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name ?? b.admissionYear}</TableCell>
                      <TableCell>{b.program.name} ({b.program.code})</TableCell>
                      <TableCell>{b.program.department.name}</TableCell>
                      <TableCell>{b.scheme?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant={b.isActive ? "success" : "secondary"}>{b.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <BatchForm institutionId={b.institutionId} programs={programs} schemes={schemes} existing={{ id: b.id, programId: b.programId, schemeId: b.schemeId, admissionYear: b.admissionYear, name: b.name }} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
