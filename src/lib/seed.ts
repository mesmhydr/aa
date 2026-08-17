import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PERMISSIONS, ROLES } from "@/lib/permissions";

async function main() {
  const institution = await prisma.institution.upsert({
    where: { code: "AA" },
    update: {},
    create: {
      code: "AA",
      name: "Academic Atelier College of Engineering",
      tagline: "Excellence in Engineering Education",
      affiliation: "Visvesvaraya Technological University (VTU), Belagavi",
      city: "Bengaluru",
      state: "Karnataka",
    },
  });
  console.log("Institution:", institution.name);

  const deptDefs = [
    { code: "CSE", name: "Computer Science & Engineering", shortName: "CSE" },
    { code: "ISE", name: "Information Science & Engineering", shortName: "ISE" },
    { code: "DATA_SCIENCE", name: "Data Science", shortName: "DS" },
    { code: "AIML", name: "Artificial Intelligence & Machine Learning", shortName: "AIML" },
    { code: "CIVIL", name: "Civil Engineering", shortName: "CV" },
    { code: "MECH", name: "Mechanical Engineering", shortName: "ME" },
    { code: "CYBERSEC", name: "Cybersecurity", shortName: "CYS" },
    { code: "BASIC_SCIENCES", name: "Basic Sciences", shortName: "BS" },
  ];

  const departments: Record<string, string> = {};
  for (const d of deptDefs) {
    const row = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: { institutionId: institution.id, code: d.code, name: d.name, shortName: d.shortName },
    });
    departments[d.code] = row.id;
  }
  console.log("Departments:", Object.keys(departments).length);

  const programDefs = [
    { code: "BE-CSE", name: "Computer Science & Engineering", dept: "CSE" },
    { code: "BE-ISE", name: "Information Science & Engineering", dept: "ISE" },
    { code: "BE-DS", name: "Data Science", dept: "DATA_SCIENCE" },
    { code: "BE-AIML", name: "Artificial Intelligence & Machine Learning", dept: "AIML" },
    { code: "BE-CV", name: "Civil Engineering", dept: "CIVIL" },
    { code: "BE-ME", name: "Mechanical Engineering", dept: "MECH" },
    { code: "BE-CYS", name: "Cybersecurity", dept: "CYBERSEC" },
  ];
  const programs: Record<string, string> = {};
  for (const p of programDefs) {
    const row = await prisma.program.upsert({
      where: { code: p.code },
      update: {},
      create: { institutionId: institution.id, code: p.code, name: p.name, departmentId: departments[p.dept] },
    });
    programs[p.code] = row.id;
  }
  console.log("Programs:", Object.keys(programs).length);

  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2026-27" },
    update: {},
    create: {
      name: "2026-27",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2027-07-31"),
      institutionId: institution.id,
    },
  });
  console.log("Academic year:", academicYear.name);

  const scheme = await prisma.scheme.upsert({
    where: { code: "VTU-2022" },
    update: {},
    create: {
      code: "VTU-2022",
      name: "VTU 2022 Scheme",
      regulation: "2022",
      institutionId: institution.id,
    },
  });
  console.log("Scheme:", scheme.name);

  const academicSemesters = [];
  for (const sem of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const isOdd = sem % 2 === 1;
    const startMonth = isOdd ? 7 : 1;
    const startYear = 2026 + Math.floor((sem - 1) / 2);
    const row = await prisma.academicSemester.upsert({
      where: { academicYearId_semesterNumber: { academicYearId: academicYear.id, semesterNumber: sem } },
      update: { isActive: true, status: isOdd ? "ACTIVE" : "PLANNED" },
      create: {
        academicYearId: academicYear.id,
        semesterNumber: sem,
        startDate: new Date(Date.UTC(startYear, startMonth - 1, 1)),
        endDate: new Date(Date.UTC(startYear, startMonth - 1 + 5, 20)),
        status: isOdd ? "ACTIVE" : "PLANNED",
        isActive: true,
      },
    });
    academicSemesters.push(row);
  }
  console.log("Academic semesters:", academicSemesters.length);

  await prisma.institution.update({
    where: { id: institution.id },
    data: { activeSeason: "ODD" },
  });
  console.log("Active season: ODD (sem 1,3,5,7 active)");

  const batches: Record<string, string> = {};
  for (const p of programDefs) {
    for (const admissionYear of [2024, 2025, 2026]) {
      const row = await prisma.batch.upsert({
        where: { programId_admissionYear: { programId: programs[p.code], admissionYear } },
        update: {},
        create: {
          institutionId: institution.id,
          programId: programs[p.code],
          schemeId: scheme.id,
          admissionYear,
          isActive: true,
        },
      });
      batches[`${p.code}-${admissionYear}`] = row.id;
    }
  }
  console.log("Batches created:", Object.keys(batches).length);

  const courseTypes = [
    { code: "THEORY", name: "Theory", isCredit: true },
    { code: "PRACTICAL", name: "Practical / Laboratory", isCredit: true },
    { code: "LAB", name: "Laboratory", isCredit: true },
    { code: "PROJECT", name: "Project", isCredit: true },
    { code: "INTERNSHIP", name: "Internship", isCredit: true },
    { code: "SEMINAR", name: "Seminar", isCredit: true },
    { code: "AUDIT", name: "Audit / Non-credit", isCredit: false },
    { code: "AICTE_MANDATORY", name: "AICTE Mandatory Course", isCredit: true },
    { code: "ABILITY_ENHANCEMENT", name: "Ability Enhancement Course", isCredit: true },
    { code: "SKILL_BASED", name: "Skill-based Course", isCredit: true },
    { code: "ELECTIVE", name: "Elective", isCredit: true },
    { code: "OPEN_ELECTIVE", name: "Open Elective", isCredit: true },
  ];
  for (const ct of courseTypes) {
    await prisma.courseType.upsert({ where: { code: ct.code }, update: {}, create: ct });
  }
  console.log("Course types:", courseTypes.length);

  const questionTypes = [
    { code: "SHORT_ANSWER", name: "Short Answer" },
    { code: "DESCRIPTIVE", name: "Descriptive" },
    { code: "NUMERICAL", name: "Numerical" },
    { code: "MCQ", name: "Multiple Choice" },
    { code: "TRUE_FALSE", name: "True/False" },
    { code: "FILL_BLANK", name: "Fill in the Blank" },
    { code: "PROGRAMMING", name: "Programming" },
    { code: "PRACTICAL", name: "Practical" },
  ];
  for (const qt of questionTypes) {
    await prisma.questionType.upsert({ where: { code: qt.code }, update: {}, create: qt });
  }
  console.log("Question types:", questionTypes.length);

  const feeTypes = [
    { code: "TUITION", name: "Tuition Fee", isRequired: true },
    { code: "EXAMINATION", name: "Examination Fee", isRequired: true },
    { code: "STATIONERY", name: "Stationery Fee", isRequired: false },
    { code: "MISCELLANEOUS", name: "Miscellaneous Fee", isRequired: false },
  ];
  for (const ft of feeTypes) {
    await prisma.feeType.upsert({ where: { code: ft.code }, update: {}, create: ft });
  }
  console.log("Fee types:", feeTypes.length);

  const leaveTypes = [
    { code: "CASUAL", name: "Casual Leave", daysPerYear: 12, isPaid: true },
    { code: "SICK", name: "Sick Leave", daysPerYear: 10, isPaid: true },
    { code: "EARNED", name: "Earned Leave", daysPerYear: 30, isPaid: true },
    { code: "DUTY", name: "Official Duty / Deputation", daysPerYear: 0, isPaid: true },
    { code: "MATERNITY", name: "Maternity Leave", daysPerYear: 180, isPaid: true },
    { code: "PATERNITY", name: "Paternity Leave", daysPerYear: 15, isPaid: true },
    { code: "OTHER", name: "Other", daysPerYear: 0, isPaid: false },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({ where: { code: lt.code }, update: {}, create: lt });
  }
  console.log("Leave types:", leaveTypes.length);

  const examTypes = [
    { code: "SEE", name: "Semester End Examination" },
    { code: "CIE", name: "Continuous Internal Evaluation" },
    { code: "INTERNAL_PRACTICAL", name: "Internal Practical" },
    { code: "EXTERNAL_PRACTICAL", name: "External Practical" },
    { code: "VIVA", name: "Viva Voce" },
    { code: "PROJECT", name: "Project Viva" },
  ];
  for (const et of examTypes) {
    await prisma.examType.upsert({ where: { code: et.code }, update: {}, create: et });
  }
  console.log("Exam types:", examTypes.length);

  const assessmentComponents = [
    { code: "CIE1", name: "CIE Test 1", maxMarks: 30, contributionPercent: 15, sortOrder: 1 },
    { code: "CIE2", name: "CIE Test 2", maxMarks: 30, contributionPercent: 15, sortOrder: 2 },
    { code: "CIE3", name: "CIE Test 3", maxMarks: 30, contributionPercent: 15, sortOrder: 3 },
    { code: "ASSIGNMENT", name: "Assignment", maxMarks: 10, contributionPercent: 10, sortOrder: 4 },
    { code: "QUIZ", name: "Quiz", maxMarks: 10, contributionPercent: 10, sortOrder: 5 },
    { code: "LAB", name: "Laboratory / Practical", maxMarks: 25, contributionPercent: 25, sortOrder: 6 },
    { code: "PROJECT", name: "Project / Mini-project", maxMarks: 50, contributionPercent: 10, sortOrder: 7 },
    { code: "SEMINAR", name: "Seminar / Presentation", maxMarks: 10, contributionPercent: 5, sortOrder: 8 },
  ];
  for (const ac of assessmentComponents) {
    await prisma.assessmentComponent.upsert({
      where: { code: ac.code },
      update: {},
      create: { ...ac, departmentId: null },
    });
  }
  console.log("Assessment components:", assessmentComponents.length);

  const rooms = [
    { code: "R101", name: "Room 101", type: "CLASS", capacity: 60 },
    { code: "R102", name: "Room 102", type: "CLASS", capacity: 60 },
    { code: "R201", name: "Room 201", type: "CLASS", capacity: 60 },
    { code: "LAB1", name: "Computer Lab 1", type: "LAB", capacity: 40 },
    { code: "LAB2", name: "Computer Lab 2", type: "LAB", capacity: 40 },
    { code: "HALL1", name: "Examination Hall 1", type: "EXAM", capacity: 120 },
    { code: "HALL2", name: "Examination Hall 2", type: "EXAM", capacity: 120 },
  ];
  for (const r of rooms) {
    await prisma.room.upsert({ where: { code: r.code }, update: {}, create: r });
  }
  console.log("Rooms:", rooms.length);

  await prisma.attendanceRule.upsert({
    where: { id: "default" },
    update: { thresholdPercent: 75, appliesTo: "OVERALL", isActive: true },
    create: { id: "default", thresholdPercent: 75, appliesTo: "OVERALL", isActive: true },
  });

  const permissionRows = await prisma.permission.createMany({
    data: PERMISSIONS,
    skipDuplicates: true,
  });
  console.log("Permissions seeded:", permissionRows.count, "(duplicates skipped)");

  const allPermissions = await prisma.permission.findMany();
  const permByCode: Record<string, string> = {};
  for (const p of allPermissions) {
    permByCode[p.code] = p.id;
  }

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, scope: role.scope, description: role.description, isSystem: true },
      create: {
        code: role.code,
        name: role.name,
        scope: role.scope,
        description: role.description,
        isSystem: true,
      },
    });
    const dbRole = await prisma.role.findUniqueOrThrow({ where: { code: role.code } });
    await prisma.rolePermission.deleteMany({ where: { roleId: dbRole.id } });
    await prisma.rolePermission.createMany({
      data: role.permissions.map((code) => ({
        roleId: dbRole.id,
        permissionId: permByCode[code],
      })),
    });
  }
  console.log("Roles + permissions:", ROLES.length);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@academicatelier.edu";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    const created = await auth.api.signUpEmail({
      body: { name: "System Administrator", email: adminEmail, password: adminPassword },
    });
    adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) throw new Error("Admin user creation failed");
    console.log("Admin user created:", adminEmail);
  } else {
    console.log("Admin user exists:", adminEmail);
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "SUPER_ADMIN" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id, departmentId: null },
  });
  await prisma.user.update({ where: { id: adminUser.id }, data: { role: "SUPER_ADMIN", status: "ACTIVE" } });

  // Wipe the course catalog & offerings so the seed defines the exact set.
  await prisma.timetableEntry.deleteMany({});
  await prisma.courseOffering.deleteMany({});
  await prisma.course.deleteMany({});
  console.log("Removed existing courses and offerings");

  const theoryType = await prisma.courseType.findUniqueOrThrow({ where: { code: "THEORY" } });
  const projectType = await prisma.courseType.findUniqueOrThrow({ where: { code: "PROJECT" } });

  // Every course has a subject code, title and shorthand (used on the timetable grid).
  const cseCourses = [
    { code: "BCS701", name: "Internet of Things", shorthand: "IoT", sem: 7, credits: 4, ltp: "3-0-2", type: theoryType.id },
    { code: "BCS702", name: "Parallel Computing", shorthand: "PC", sem: 7, credits: 4, ltp: "3-0-2", type: theoryType.id },
    { code: "BCS703", name: "Cryptography and Network Security", shorthand: "CNS", sem: 7, credits: 4, ltp: "3-0-2", type: theoryType.id },
    { code: "BCS714B", name: "Natural Language Processing", shorthand: "NLP", sem: 7, credits: 3, ltp: "3-0-0", type: theoryType.id, isElective: true },
    { code: "BEC755A", name: "E-Waste Management", shorthand: "EW", sem: 7, credits: 3, ltp: "3-0-0", type: theoryType.id, isOpenElective: true },
    { code: "BCS786", name: "Major Project Phase-II", shorthand: "", sem: 7, credits: 8, ltp: "0-0-8", type: projectType.id },
  ];
  const deptCourses: Array<{ code: string; name: string; shorthand: string; sem: number; credits: number; ltp: string; type: string; isElective?: boolean; isOpenElective?: boolean }> = [...cseCourses];
  for (const c of deptCourses) {
    await prisma.course.upsert({
      where: { code_schemeId: { code: c.code, schemeId: scheme.id } },
      update: {
        name: c.name,
        shortName: c.shorthand || null,
        semesterNumber: c.sem,
        credits: c.credits,
        l_t_p: c.ltp,
        courseTypeId: c.type,
        isElective: c.isElective ?? false,
        isOpenElective: c.isOpenElective ?? false,
        isMandatory: !(c.isElective ?? false),
      },
      create: {
        code: c.code,
        name: c.name,
        shortName: c.shorthand || null,
        departmentId: departments.CSE,
        schemeId: scheme.id,
        courseTypeId: c.type,
        semesterNumber: c.sem,
        credits: c.credits,
        l_t_p: c.ltp,
        isElective: c.isElective ?? false,
        isOpenElective: c.isOpenElective ?? false,
        isMandatory: !(c.isElective ?? false),
      },
    });
  }
  console.log("Courses seeded for CSE:", deptCourses.map((c) => c.code).join(", "));

  const offerings = [];
  for (const c of deptCourses) {
    const course = await prisma.course.findUniqueOrThrow({ where: { code_schemeId: { code: c.code, schemeId: scheme.id } } });
    const semRow = academicSemesters.find((s) => s.semesterNumber === c.sem);
    if (!semRow) continue;
    await prisma.courseOffering.upsert({
      where: { departmentId_courseId_academicSemesterId: { departmentId: departments.CSE, courseId: course.id, academicSemesterId: semRow.id } },
      update: {},
      create: { departmentId: departments.CSE, courseId: course.id, academicSemesterId: semRow.id, isActive: true },
    });
    offerings.push(course.id);
  }
  console.log("Course offerings seeded:", offerings.length);

  console.log("\nSeeding complete.");
  console.log("Login: " + adminEmail + " / " + adminPassword);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
