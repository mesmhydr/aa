import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { PaymentForm, AdjustmentForm } from "@/components/fees/payment-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentFeesPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "fees.view");
  const canReceive = access.permissions.has("fees.receive");
  const canAdjust = access.permissions.has("fees.adjust");
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      program: { include: { department: true } },
      batch: true,
    },
  });
  if (!student) notFound();

  const fees = await prisma.studentFee.findMany({
    where: { studentId: id },
    orderBy: [{ academicYearId: "desc" }, { updatedAt: "desc" }],
    include: {
      feeType: true,
      academicYear: true,
      academicSemester: true,
      payments: { include: { receipt: true } },
      adjustments: true,
    },
  });

  const totalBilled = fees.reduce((a, f) => a + Number(f.amount), 0);
  const totalPaid = fees.reduce((a, f) => a + Number(f.paidAmount), 0);
  const totalAdjust = fees.reduce((a, f) => a + Number(f.discountAmount) + Number(f.waivedAmount), 0);
  const outstanding = totalBilled - totalPaid - totalAdjust;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${student.user?.name ?? student.usn} — Fees`}
        description={`${student.usn} · ${student.program.department.name}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Billed</p><p className="text-lg font-semibold">{totalBilled.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Paid</p><p className="text-lg font-semibold text-success">{totalPaid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Adjustments</p><p className="text-lg font-semibold">{totalAdjust.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className={`text-lg font-semibold ${outstanding > 0 ? "text-destructive" : "text-success"}`}>{outstanding.toLocaleString()}</p></CardContent></Card>
      </div>

      {fees.map((f) => {
        const bal = Number(f.amount) - Number(f.paidAmount) - Number(f.discountAmount) - Number(f.waivedAmount);
        return (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{f.feeType.name} — {f.academicYear.name}{f.academicSemester ? ` · Sem ${f.academicSemester.semesterNumber}` : ""}</span>
                <Badge variant={f.status === "PAID" ? "success" : f.status === "PARTIAL" ? "warning" : "destructive"}>{f.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-4">
                <p className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>{Number(f.amount).toLocaleString()}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{Number(f.paidAmount).toLocaleString()}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Adjusted</span><span>{Number(f.discountAmount) + Number(f.waivedAmount) > 0 ? (Number(f.discountAmount) + Number(f.waivedAmount)).toLocaleString() : "0"}</span></p>
                <p className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className={bal > 0 ? "text-destructive" : "text-success"}>{bal.toLocaleString()}</span></p>
              </div>

              {f.payments.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Payments</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {f.payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.paymentDate)}</TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>{p.transactionId ?? p.referenceNumber ?? "—"}</TableCell>
                          <TableCell className="text-right">{Number(p.amount).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">{p.receipt?.receiptNumber ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {f.adjustments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Adjustments: {f.adjustments.map((a) => `${a.type} ${Number(a.amount)}`).join(", ")}
                </p>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                {canReceive && bal > 0 && (
                  <div className="rounded-lg border border-border p-4">
                    <p className="mb-2 text-sm font-medium">Record payment</p>
                    <PaymentForm studentId={student.id} fee={{ id: f.id, feeType: f.feeType.name, amount: Number(f.amount), paid: Number(f.paidAmount), discount: Number(f.discountAmount), waived: Number(f.waivedAmount) }} />
                  </div>
                )}
                {canAdjust && (
                  <div className="rounded-lg border border-border p-4">
                    <p className="mb-2 text-sm font-medium">Adjustment</p>
                    <AdjustmentForm studentId={student.id} feeId={f.id} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {fees.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">No fee records. Run "Generate Fees" for the current year.</p>
      )}
    </div>
  );
}