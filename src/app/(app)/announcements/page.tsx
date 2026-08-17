import { prisma } from "@/lib/prisma";
import { requireAccess, requirePermission } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { toggleAnnouncement, deleteAnnouncement } from "@/app/(app)/announcements/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const access = await requireAccess();
  requirePermission(access, "announcement.view");
  const canCreate = access.permissions.has("announcement.create");
  const canEdit = access.permissions.has("announcement.edit");

  const [departments, announcements] = await Promise.all([
    prisma.department.findMany({ orderBy: { code: "asc" } }),
    prisma.announcement.findMany({
      orderBy: { publishedAt: "desc" },
      include: { department: true, publishedBy: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Institution-wide and targeted notices"
        actions={canCreate ? <AnnouncementForm departments={departments} /> : undefined}
      />

      {announcements.length === 0 ? (
        <EmptyState title="No announcements" description="Publish your first announcement." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge>{a.audience}</Badge>
                  {a.department && <Badge variant="outline">{a.department.name}</Badge>}
                  <Badge variant={a.isActive ? "success" : "secondary"}>{a.isActive ? "Active" : "Archived"}</Badge>
                </div>
                <h3 className="font-semibold">{a.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{a.message}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>By {a.publishedBy?.name ?? "System"} · {formatDate(a.publishedAt)}</span>
                  {canEdit && (
                    <div className="flex gap-2">
                      <form action={async () => { "use server"; await toggleAnnouncement(a.id, !a.isActive); }}>
                        <Button type="submit" size="sm" variant="outline">{a.isActive ? "Archive" : "Activate"}</Button>
                      </form>
                      <form action={async () => { "use server"; await deleteAnnouncement(a.id); }}>
                        <Button type="submit" size="sm" variant="ghost" className="text-destructive">Delete</Button>
                      </form>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}