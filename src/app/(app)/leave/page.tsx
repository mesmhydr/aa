import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { LeaveForm, LeaveTypeForm } from "@/components/leave/leave-form";
import { cancelLeave, reviewLeave } from "@/app/(app)/leave/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const access = await requireAccess();
  requirePermission(access, "leave.view");
  const canApprove = access.permissions.has("leave.approve");
  const canConfigure = access.permissions.has("leave.configure");

  const [leaveTypes, myRequests, allRequests, deptIds] = await Promise.all([
    prisma.leaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.leaveRequest.findMany({
      where: { userId: access.userId },
      orderBy: { appliedAt: "desc" },
      include: { leaveType: true },
    }),
    canApprove
      ? prisma.leaveRequest.findMany({
          where: { status: "PENDING", departmentId: access.departmentIds.length ? { in: access.departmentIds } : undefined },
          orderBy: { appliedAt: "asc" },
          include: { leaveType: true, user: { select: { name: true } } },
        })
      : Promise.resolve([]),
    access.departmentIds,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description="Apply for and manage leave requests"
        actions={
          <div className="flex gap-2">
            {leaveTypes.length > 0 && <LeaveForm leaveTypes={leaveTypes} />}
            {canConfigure && <LeaveTypeForm />}
          </div>
        }
      />

      {canApprove && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-center">Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.user.name}</TableCell>
                    <TableCell>{r.leaveType.name}</TableCell>
                    <TableCell>{formatDate(r.startDate)} → {formatDate(r.endDate)}</TableCell>
                    <TableCell className="text-center">{r.days}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{r.reason}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <form action={async () => { "use server"; await reviewLeave(r.id, "APPROVED", ""); }}>
                          <Button type="submit" size="sm">Approve</Button>
                        </form>
                        <form action={async () => { "use server"; await reviewLeave(r.id, "REJECTED", ""); }}>
                          <Button type="submit" size="sm" variant="destructive">Reject</Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {allRequests.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No pending requests</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRequests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.leaveType.name}</TableCell>
                  <TableCell>{formatDate(r.startDate)} → {formatDate(r.endDate)}</TableCell>
                  <TableCell className="text-center">{r.days}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{r.reason}</TableCell>
                  <TableCell>{formatDate(r.appliedAt)}</TableCell>
                  <TableCell><Badge variant={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "destructive" : r.status === "CANCELLED" ? "secondary" : "warning"}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {r.status === "PENDING" && (
                      <form action={async () => { "use server"; await cancelLeave(r.id); }}>
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">Cancel</Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {myRequests.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No leave requests yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}