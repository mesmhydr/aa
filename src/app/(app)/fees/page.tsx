import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { FeeStructureForm } from "@/components/fees/fee-structure-form";
import { generateStudentFees, toggleFeeStructure } from "@/app/(app)/fees/actions";
import { getCurrentAcademicYear } from "@/lib/season";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
  const access = await requireAccess();
  requirePermission(access, "fees.view");
  const canManage = access.permissions.has("fees.structure");
  const canGenerate = access.permissions.has("fees.generate");

  const currentYear = await getCurrentAcademicYear();
  const [feeTypes, years, structures, summaries] = await Promise.all([
    prisma.feeType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.academicYear.findMany({ orderBy: { startDate: "desc" } }),
    prisma.feeStructure.findMany({
      orderBy: [{ academicYearId: "desc" }, { semesterNumber: "asc" }],
      include: { feeType: true, academicYear: true },
    }),
    prisma.studentFee.findMany({
      where: currentYear ? { academicYearId: currentYear.id } : undefined,
      select: { amount: true, paidAmount: true, status: true, discountAmount: true, waivedAmount: true },
    }),
  ]);

  const totalBilled = summaries.reduce((a, s) => a + Number(s.amount), 0);
  const totalPaid = summaries.reduce((a, s) => a + Number(s.paidAmount), 0);
  const totalAdjust = summaries.reduce((a, s) => a + Number(s.discountAmount) + Number(s.waivedAmount), 0);
  const pending = summaries.filter((s) => s.status === "PENDING").length;
  const partial = summaries.filter((s) => s.status === "PARTIAL").length;
  const paid = summaries.filter((s) => s.status === "PAID").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees"
        description="Fee structures, billing and payments"
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage && feeTypes.length > 0 && <FeeStructureForm feeTypes={feeTypes} years={years} />}
            {canGenerate && currentYear && (
              <form action={async () => { "use server"; await generateStudentFees(currentYear.id); }}>
                <Button type="submit" variant="outline">Generate Fees</Button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Billed ({currentYear?.name ?? "all"})</p><p className="text-lg font-semibold">{totalBilled.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Collected</p><p className="text-lg font-semibold text-success">{totalPaid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Adjustments</p><p className="text-lg font-semibold">{totalAdjust.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Records</p><p className="text-lg font-semibold">{paid} paid · {partial} partial · {pending} pending</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-center">Sem</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((s) => (
                <TableRow key={s.id}>
                  <TableCell><span className="font-medium">{s.feeType.name}</span></TableCell>
                  <TableCell>{s.academicYear.name}</TableCell>
                  <TableCell className="text-center">{s.semesterNumber ?? "All"}</TableCell>
                  <TableCell className="text-right">{Number(s.amount).toLocaleString()}</TableCell>
                  <TableCell>{s.isMandatory ? "Yes" : "No"}</TableCell>
                  <TableCell><Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <form action={async () => { "use server"; await toggleFeeStructure(s.id, !s.isActive); }}>
                        <Button type="submit" size="sm" variant="outline">{s.isActive ? "Deactivate" : "Activate"}</Button>
                      </form>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {structures.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No fee structures. Add one or check fee types in settings.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {currentYear && (
        <div className="text-center">
          <Link href={`/fees/payments`} className="text-primary hover:underline">View all fee records & collections →</Link>
        </div>
      )}
    </div>
  );
}