import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 20, 50);
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const unread = await prisma.notification.count({ where: { userId: session.user.id, isRead: false } });

  return NextResponse.json({ notifications, unread });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.id === "string") {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: session.user.id },
      data: { isRead: true, readAt: new Date() },
    });
  } else if (body.all === true) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
