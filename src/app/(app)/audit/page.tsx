import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Card, CardContent, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ module?: string; action?: string; userId?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "audit.view");
  const { module, action, userId } = await searchParams;

  const [modules, logs, total] = await Promise.all([
    prisma.auditLog.groupBy({ by: ["module"], _count: true }),
    prisma.auditLog.findMany({
      where: {
        module: module || undefined,
        action: action || undefined,
        userId: userId || undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { name: true } } },
    }),
    prisma.auditLog.count({
      where: {
        module: module || undefined,
        action: action || undefined,
        userId: userId || undefined,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" description={`${total.toLocaleString()} logged events`} />

      <form className="flex flex-wrap gap-2" method="get">
        <select name="module" className="h-9 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All modules</option>
          {modules.map((m) => <option key={m.module} value={m.module ?? ""}>{m.module ?? "(none)"} ({m._count})</option>)}
        </select>
        <input
          name="action"
          defaultValue={action}
          placeholder="Action (e.g. user.create)"
          className="h-9 rounded-md border border-border bg-card px-3 text-sm"
        />
        <input
          name="userId"
          defaultValue={userId}
          placeholder="User ID"
          className="h-9 rounded-md border border-border bg-card px-3 text-sm"
        />
        <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Filter</button>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{formatDate(l.createdAt)}</TableCell>
                  <TableCell>{l.user?.name ?? l.userId ?? "System"}</TableCell>
                  <TableCell><span className="font-mono text-xs">{l.module}</span></TableCell>
                  <TableCell><span className="font-mono text-xs">{l.action}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.entityType}{l.entityId ? `:${l.entityId.slice(0, 8)}` : ""}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.ipAddress ?? "—"}</TableCell>
                  <TableCell className="text-right text-xs">
                    {l.newValues ? JSON.stringify(l.newValues).slice(0, 80) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No audit events</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}