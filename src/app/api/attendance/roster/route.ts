import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const offeringId = url.searchParams.get("offering");
  const dateStr = url.searchParams.get("date");
  const periodStr = url.searchParams.get("period");

  if (!offeringId || !dateStr) {
    return Response.json({ error: "offering and date required" }, { status: 400 });
  }

  const period = periodStr && periodStr !== "" ? Number(periodStr) : null;
  const date = new Date(dateStr);

  const registrations = await prisma.courseRegistration.findMany({
    where: { courseOfferingId: offeringId, status: "REGISTERED" },
    include: { student: { include: { user: true } } },
    orderBy: { student: { usn: "asc" } },
  });

  const records = await prisma.attendanceRecord.findMany({
    where: { courseOfferingId: offeringId, attendanceDate: date, periodNumber: period },
    select: { studentId: true, status: true },
  });
  const statusByStudent = new Map(records.map((r) => [r.studentId, r.status]));

  // Which periods are already marked for this offering + date, so the form can
  // tell the teacher "this class has been taken" instead of silently letting
  // them create another period bucket.
  const marked = await prisma.attendanceRecord.groupBy({
    by: ["periodNumber"],
    where: { courseOfferingId: offeringId, attendanceDate: date },
    _count: { _all: true },
  });

  const students = registrations.map((r) => ({
    id: r.studentId,
    name: r.student.user?.name ?? r.student.usn,
    usn: r.student.usn,
    status: statusByStudent.get(r.studentId) ?? "PRESENT",
  }));

  return Response.json({
    students,
    recordCount: records.length,
    markedPeriods: marked.map((m) => m.periodNumber).sort((a, b) => (a ?? 0) - (b ?? 0)),
  });
}