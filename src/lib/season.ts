import { prisma } from "@/lib/prisma";
import type { AcademicSeason } from "@/generated/prisma/client";

export type Season = AcademicSeason;

export function seasonOfSemester(semesterNumber: number): Season {
  return semesterNumber % 2 === 1 ? "ODD" : "EVEN";
}

export async function getActiveSeason(): Promise<Season> {
  const inst = await prisma.institution.findFirst({ select: { activeSeason: true } });
  return inst?.activeSeason ?? "ODD";
}

export async function getActiveSemesterIds(): Promise<string[]> {
  const season = await getActiveSeason();
  const sems = await prisma.academicSemester.findMany({ select: { id: true, semesterNumber: true } });
  return sems.filter((s) => seasonOfSemester(s.semesterNumber) === season).map((s) => s.id);
}

export async function getActiveSemesters() {
  const season = await getActiveSeason();
  const sems = await prisma.academicSemester.findMany({ include: { academicYear: true }, orderBy: { semesterNumber: "asc" } });
  return sems.filter((s) => seasonOfSemester(s.semesterNumber) === season);
}

export async function getCurrentAcademicYear() {
  const active = await getActiveSemesters();
  if (active.length > 0) return active[0].academicYear;
  return prisma.academicYear.findFirst({ orderBy: { startDate: "desc" } });
}
