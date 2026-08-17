import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { RolePermissionManager } from "@/components/settings/role-permission-manager";
import { CreateRoleForm, AssignRoleForm } from "@/components/settings/role-forms";
import { removeUserRole } from "@/app/(app)/settings/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; role?: string }> }) {
  const access = await requireAccess();
  requirePermission(access, "role.manage");
  const { tab = "roles", role: roleParam } = await searchParams;

  const [roles, permissions, users, departments] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.permission.findMany({ where: { isActive: true }, orderBy: [{ module: "asc" }, { code: "asc" }] }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        roles: { include: { role: true, department: true } },
      },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  const selectedRole = roles.find((r) => r.id === roleParam) ?? roles.find((r) => r.code === "SUPER_ADMIN") ?? roles[0];
  const selectedRoleId = selectedRole?.id;

  const rolePerms = selectedRoleId
    ? await prisma.rolePermission.findMany({ where: { roleId: selectedRoleId } })
    : [];
  const permIds = new Set(rolePerms.map((rp) => rp.permissionId));
  const granted = new Set(permissions.filter((p) => permIds.has(p.id)).map((p) => p.code));

  return (
    <div className="space-y-6">
      <PageHeader title="Settings & Roles" description="Roles, permissions and user assignments" />

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <a
          href="/settings?tab=roles"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "roles" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Roles & Permissions
        </a>
        <a
          href="/settings?tab=users"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "users" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Users
        </a>
      </div>

      {tab === "roles" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {roles.map((r) => (
              <a
                key={r.id}
                href={`/settings?tab=roles&role=${r.id}`}
                className={`rounded-sm border px-3 py-1 text-sm ${r.id === selectedRoleId ? "border-primary bg-primary/10 font-medium" : "border-border bg-card hover:bg-muted"}`}
              >
                {r.name} {!r.isActive && "(inactive)"}
              </a>
            ))}
            <div className="ml-auto"><CreateRoleForm /></div>
          </div>
          {selectedRole && (
            <RolePermissionManager
              role={{ id: selectedRole.id, code: selectedRole.code, name: selectedRole.name }}
              permissions={permissions.map((p) => ({ code: p.code, module: p.module, description: p.description ?? undefined }))}
              granted={granted}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end"><AssignRoleForm roles={roles.filter((r) => r.isActive)} departments={departments} /></div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((ur) => (
                            <Badge key={ur.roleId} variant="secondary">
                              {ur.role.name}
                              {ur.department ? ` (${ur.department.shortName})` : ""}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {u.roles.length > 1 && (
                          <form action={async () => { "use server"; await removeUserRole(u.id, u.roles[0].roleId); }}>
                            <Button type="submit" size="sm" variant="ghost" className="text-destructive">Remove 1st</Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}