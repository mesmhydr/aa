import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/access";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader } from "@/components/ui";
import { markNotificationRead, markAllNotificationsRead } from "@/app/(app)/announcements/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const access = await requireAccess();

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: access.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.count({ where: { userId: access.userId, isRead: false } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unread} unread`}
        actions={
          unread > 0 && (
            <form action={async () => { "use server"; await markAllNotificationsRead(); }}>
              <Button type="submit" size="sm" variant="outline">Mark all read</Button>
            </form>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="Notifications from the ERP will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.isRead ? "opacity-70" : ""}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={n.isRead ? "secondary" : "default"}>{n.type}</Badge>
                    {!n.isRead && <span className="h-2 w-2 rounded-sm bg-primary" />}
                  </div>
                  <h3 className="text-sm font-medium">{n.title}</h3>
                  {n.message && <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <form action={async () => { "use server"; await markNotificationRead(n.id); }}>
                    <Button type="submit" size="sm" variant="ghost">Mark read</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}