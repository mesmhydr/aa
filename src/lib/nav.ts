export type NavItem = {
  href: string;
  label: string;
  icon: string;
  permission?: string;
  upcoming?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const home: NavSection = {
  title: "Home",
  items: [{ href: "/", label: "Dashboard", icon: "LayoutDashboard" }],
};

const institutional: NavSection = {
  title: "Institution",
  items: [
    { href: "/departments", label: "Departments", icon: "Building2", permission: "department.view" },
    { href: "/academics", label: "Academics", icon: "GraduationCap", permission: "academic.view" },
    { href: "/sections", label: "Sections", icon: "Rows3", permission: "academic.view" },
    { href: "/courses", label: "Courses", icon: "BookOpen", permission: "course.view" },
  ],
};

const people: NavSection = {
  title: "People",
  items: [
    { href: "/students", label: "Students", icon: "Users", permission: "student.view" },
    { href: "/faculty", label: "Faculty", icon: "UserCog", permission: "faculty.view" },
  ],
};

const academics: NavSection = {
  title: "Academics",
  items: [
    { href: "/attendance", label: "Attendance", icon: "CalendarCheck", permission: "attendance.view" },
    { href: "/timetable", label: "Timetable", icon: "CalendarDays", permission: "timetable.view" },
    { href: "/assessments", label: "CIE Assessments", icon: "ClipboardList", permission: "assessment.view" },
    { href: "/question-bank", label: "Question Bank", icon: "Database", permission: "questionbank.view" },
    { href: "/question-papers", label: "Question Papers", icon: "FileText", permission: "questionpaper.create" },
    { href: "/examinations", label: "Examinations", icon: "Landmark", permission: "exam.view" },
    { href: "/results", label: "Results", icon: "BarChart3", permission: "results.view" },
  ],
};

const finance: NavSection = {
  title: "Finance",
  items: [{ href: "/fees", label: "Fees & Payments", icon: "Wallet", permission: "fees.view" }],
};

const communication: NavSection = {
  title: "Communication",
  items: [
    { href: "/notifications", label: "Notifications", icon: "Bell" },
    { href: "/announcements", label: "Announcements", icon: "Megaphone", permission: "announcement.view" },
  ],
};

const reporting: NavSection = {
  title: "Reports & Oversight",
  items: [
    { href: "/reports", label: "Reports", icon: "BarChart3", permission: "reports.view" },
    { href: "/audit", label: "Audit Logs", icon: "ScrollText", permission: "audit.view" },
    { href: "/settings", label: "Settings & Roles", icon: "Settings", permission: "role.manage" },
  ],
};

const mySpace: NavSection = {
  title: "My Space",
  items: [
    { href: "/attendance", label: "My Attendance", icon: "CalendarCheck", permission: "attendance.view" },
    { href: "/timetable", label: "My Timetable", icon: "CalendarDays", permission: "timetable.view" },
    { href: "/results", label: "My Marks & Results", icon: "BarChart3", permission: "result.view" },
    { href: "/fees", label: "My Fees", icon: "Wallet", permission: "fees.view" },
    { href: "/notifications", label: "Notifications", icon: "Bell" },
    { href: "/profile", label: "My Profile", icon: "UserCog" },
  ],
};

const facultySpace: NavSection = {
  title: "My Work",
  items: [
    { href: "/attendance", label: "Mark Attendance", icon: "CalendarCheck", permission: "attendance.create" },
    { href: "/timetable", label: "My Timetable", icon: "CalendarDays", permission: "timetable.view" },
    { href: "/assessments", label: "My Assessments", icon: "ClipboardList", permission: "assessment.create" },
    { href: "/question-bank", label: "Question Bank", icon: "Database", permission: "questionbank.create" },
    { href: "/question-papers", label: "Question Papers", icon: "FileText", permission: "questionpaper.create" },
    { href: "/leave", label: "Leave", icon: "Plane", permission: "leave.view" },
  ],
};

const studentLife: NavSection = {
  title: "Student Life",
  items: [
    { href: "/placements", label: "Placements & Training", icon: "StickyNote", upcoming: true },
    { href: "/scholarships", label: "Scholarships", icon: "Trophy", upcoming: true },
    { href: "/events", label: "Events & Campus Feed", icon: "Coffee", upcoming: true },
    { href: "/clubs", label: "Clubs & Activities", icon: "Users", upcoming: true },
    { href: "/certificates", label: "Certificates", icon: "FolderCheck", upcoming: true },
    { href: "/grievances", label: "Grievances", icon: "MessageSquare", upcoming: true },
    { href: "/sports", label: "Sports & NCC", icon: "Shield", upcoming: true },
  ],
};

export function getNavForAccess(access: {
  roleCodes: string[];
  permissions: Set<string>;
}): NavSection[] {
  const has = (p?: string) => (p ? access.permissions.has(p) : true);
  const sections: NavSection[] = [];

  const push = (s: NavSection) => {
    const items = s.items.filter((i) => has(i.permission));
    if (items.length) sections.push({ ...s, items });
  };

  const isStudent = access.roleCodes.includes("STUDENT");
  const isParent = access.roleCodes.includes("PARENT");
  const isFaculty = access.roleCodes.includes("FACULTY");
  const isHod = access.roleCodes.includes("HOD") || access.roleCodes.includes("DEPT_COORDINATOR");
  const isInstitutional = access.roleCodes.some((c) =>
    ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "EXAM_CONTROLLER", "ACCOUNTS", "MANAGEMENT", "IQAC"].includes(c),
  );

  if (isInstitutional || isHod) {
    push(home);
    push(institutional);
    push(people);
    push(academics);
    push(finance);
    push(communication);
    push(reporting);
    push(studentLife);
  } else if (isFaculty) {
    push(home);
    push(facultySpace);
    push(academics);
    push(communication);
    push(studentLife);
  } else if (isStudent) {
    push(home);
    push(mySpace);
    push(studentLife);
  } else if (isParent) {
    push(home);
    push(mySpace);
  } else {
    push(home);
    push(mySpace);
  }

  return sections;
}
