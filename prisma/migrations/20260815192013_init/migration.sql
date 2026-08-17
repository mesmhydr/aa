-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudentLifecycleStatus" AS ENUM ('ENQUIRY', 'APPLIED', 'ADMITTED', 'ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'WITHDRAWN', 'GRADUATED', 'ALUMNI');

-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'DROPPED', 'TRANSFERRED', 'SUSPENDED', 'ALUMNI');

-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('REGULAR', 'LATERAL', 'READMISSION', 'CARRY_OVER', 'PART_TIME');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'OD', 'LEAVE', 'MEDICAL');

-- CreateEnum
CREATE TYPE "StaffAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'ON_LEAVE', 'HALF_DAY', 'OFFICIAL_DUTY');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AcademicSemesterStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'LOCKED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CieMarkStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuestionPaperStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ExamRegistrationStatus" AS ENUM ('REGISTERED', 'ELIGIBLE', 'NOT_ELIGIBLE', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "ExamAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');

-- CreateEnum
CREATE TYPE "ResultItemStatus" AS ENUM ('PASS', 'FAIL', 'ABSENT', 'WITHELD', 'MALPRACTICE', 'PASS_WITH_GRACE');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('PASS', 'FAIL', 'PASS_WITH_BACKLOGS', 'ABSENT', 'WITHELD', 'MALPRACTICE');

-- CreateEnum
CREATE TYPE "ResultPublicationStatus" AS ENUM ('DRAFT', 'MODERATION', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FeeAdjustmentType" AS ENUM ('DISCOUNT', 'WAIVER', 'CONCESSION', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHECK');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GrievancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ATTENDANCE_SHORTAGE', 'CIE_PUBLISHED', 'MARKS_PUBLISHED', 'RESULT_PUBLISHED', 'EXAM_SCHEDULE', 'FEE_DUE', 'FEE_PAYMENT', 'PLACEMENT_DRIVE', 'SCHOLARSHIP_DEADLINE', 'EVENT', 'GRIEVANCE_UPDATE', 'LEAVE_APPROVAL', 'ANNOUNCEMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('INSTITUTION', 'DEPARTMENT', 'SECTION', 'COURSE', 'PROGRAM');

-- CreateEnum
CREATE TYPE "PlacementDriveStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PlacementApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WAITLIST');

-- CreateEnum
CREATE TYPE "ScholarshipApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FacultyAssignmentRole" AS ENUM ('COURSE_INSTRUCTOR', 'LAB_INSTRUCTOR', 'COORDINATOR', 'TUTOR');

-- CreateEnum
CREATE TYPE "CourseRegistrationStatus" AS ENUM ('REGISTERED', 'DROPPED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FacultyEmploymentType" AS ENUM ('PERMANENT', 'CONTRACT', 'ADJUNCT', 'VISITING', 'GUEST');

-- CreateEnum
CREATE TYPE "MarkEntryStatus" AS ENUM ('DRAFT', 'ENTERED', 'APPROVED', 'LOCKED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'PUBLISHED', 'LOCKED', 'UNLOCKED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentScope" AS ENUM ('INSTITUTION', 'DEPARTMENT', 'PRIVATE');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "affiliation" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionSetting" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "establishedYear" INTEGER,
    "description" TEXT,
    "hodUserId" TEXT,
    "deptCoordinatorUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "degreeType" TEXT NOT NULL DEFAULT 'B.E.',
    "departmentId" TEXT NOT NULL,
    "durationSemesters" INTEGER NOT NULL DEFAULT 8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regulation" TEXT,
    "institutionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeProgram" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SchemeProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSemester" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AcademicSemesterStatus" NOT NULL DEFAULT 'PLANNED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSemester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCredit" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "courseTypeId" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "ltp" TEXT,
    "contactHours" INTEGER,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "isOpenElective" BOOLEAN NOT NULL DEFAULT false,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cos" JSONB,
    "poMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CLASS',
    "capacity" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT,
    "academicSemesterId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyAssignment" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "role" "FacultyAssignmentRole" NOT NULL DEFAULT 'COURSE_INSTRUCTOR',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "academicSemesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "status" "CourseRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'INSTITUTION',
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "departmentId" TEXT,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "usn" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "batch" TEXT NOT NULL,
    "admissionType" TEXT NOT NULL DEFAULT 'REGULAR',
    "currentSemester" INTEGER NOT NULL DEFAULT 1,
    "lifecycleStatus" "StudentLifecycleStatus" NOT NULL DEFAULT 'ENQUIRY',
    "academicStatus" "AcademicStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" "Gender",
    "bloodGroup" TEXT,
    "phone" TEXT,
    "altPhone" TEXT,
    "personalEmail" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "photoUrl" TEXT,
    "category" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "about" TEXT,
    "skills" JSONB,
    "achievements" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT NOT NULL,
    "fatherName" TEXT,
    "motherName" TEXT,
    "guardianName" TEXT,
    "fatherPhone" TEXT,
    "motherPhone" TEXT,
    "guardianPhone" TEXT,
    "fatherEmail" TEXT,
    "motherEmail" TEXT,
    "guardianEmail" TEXT,
    "fatherOccupation" TEXT,
    "motherOccupation" TEXT,
    "guardianOccupation" TEXT,
    "address" TEXT,
    "isEmergencyContact" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "qualification" TEXT,
    "specialization" TEXT,
    "experienceYears" DOUBLE PRECISION,
    "joiningDate" TIMESTAMP(3),
    "employmentType" "FacultyEmploymentType" NOT NULL DEFAULT 'PERMANENT',
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyCourse" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FacultyCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT,
    "designation" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSemesterEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicSemesterId" TEXT NOT NULL,
    "sectionId" TEXT,
    "schemeId" TEXT,
    "enrollmentType" "EnrollmentType" NOT NULL DEFAULT 'REGULAR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSemesterEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRule" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT,
    "departmentId" TEXT,
    "thresholdPercent" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "appliesTo" TEXT NOT NULL DEFAULT 'OVERALL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "periodNumber" INTEGER,
    "status" "AttendanceStatus" NOT NULL,
    "remark" TEXT,
    "markedByUserId" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedByUserId" TEXT,
    "editedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "academicSemesterId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "facultyId" TEXT,
    "roomId" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "isLab" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentComponent" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT,
    "maxMarks" INTEGER NOT NULL DEFAULT 50,
    "contributionPercent" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "academicSemesterId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "maxMarks" INTEGER NOT NULL,
    "instructions" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBankItem" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "questionTypeId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 5,
    "co" TEXT,
    "bloomLevel" TEXT,
    "unit" TEXT,
    "topic" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "options" JSONB,
    "answer" JSONB,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "co" TEXT,
    "bloomLevel" TEXT,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionPaper" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "QuestionPaperStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "durationMinutes" INTEGER,
    "blueprint" JSONB,
    "academicSemesterId" TEXT,
    "createdByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionPaperQuestion" (
    "id" TEXT NOT NULL,
    "questionPaperId" TEXT NOT NULL,
    "questionId" TEXT,
    "questionText" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "co" TEXT,
    "bloomLevel" TEXT,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestionPaperQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionPaperApproval" (
    "id" TEXT NOT NULL,
    "questionPaperId" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "comment" TEXT,
    "reviewedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionPaperApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CieMark" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marksObtained" DOUBLE PRECISION,
    "maxMarks" INTEGER NOT NULL,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "isExempt" BOOLEAN NOT NULL DEFAULT false,
    "status" "CieMarkStatus" NOT NULL DEFAULT 'PENDING',
    "enteredByUserId" TEXT,
    "enteredAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CieMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CieConsolidation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "academicSemesterId" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION,
    "components" JSONB,
    "percentage" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CieConsolidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resultsStatus" "ResultPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMinutes" INTEGER,
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "isPractical" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRegistration" (
    "id" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ExamRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "reasons" JSONB,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamEligibility" (
    "id" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL,
    "reasons" JSONB,
    "computedByUserId" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamHallAllocation" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "seatNumber" TEXT,
    "allocationType" TEXT NOT NULL DEFAULT 'SEAT',

    CONSTRAINT "ExamHallAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamInvigilator" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "roomId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'INVIGILATOR',

    CONSTRAINT "ExamInvigilator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttendance" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ExamAttendanceStatus" NOT NULL,
    "markedByUserId" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mark" (
    "id" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "examId" TEXT,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "seeMarks" DOUBLE PRECISION,
    "practicalMarks" DOUBLE PRECISION,
    "internalMarks" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION,
    "status" "MarkEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "enteredByUserId" TEXT,
    "enteredAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,
    "minPercent" DOUBLE PRECISION NOT NULL,
    "maxPercent" DOUBLE PRECISION NOT NULL,
    "isPass" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicSemesterId" TEXT NOT NULL,
    "sgpa" DOUBLE PRECISION,
    "cgpa" DOUBLE PRECISION,
    "creditsEarned" INTEGER NOT NULL DEFAULT 0,
    "creditsRegistered" INTEGER NOT NULL DEFAULT 0,
    "status" "ResultStatus" NOT NULL,
    "publicationStatus" "ResultPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "computedById" TEXT,
    "computedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultItem" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "cieMarks" DOUBLE PRECISION,
    "seeMarks" DOUBLE PRECISION,
    "practicalMarks" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION,
    "grade" TEXT,
    "gradePoint" DOUBLE PRECISION,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "creditsEarned" INTEGER NOT NULL DEFAULT 0,
    "status" "ResultItemStatus" NOT NULL,
    "remark" TEXT,

    CONSTRAINT "ResultItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultHistory" (
    "id" TEXT NOT NULL,
    "resultItemId" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldValues" JSONB,
    "newValues" JSONB,
    "reason" TEXT,

    CONSTRAINT "ResultHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backlog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "firstAttemptSemester" INTEGER,
    "totalAttempts" INTEGER NOT NULL DEFAULT 1,
    "currentAttempt" INTEGER NOT NULL DEFAULT 1,
    "isCleared" BOOLEAN NOT NULL DEFAULT false,
    "clearedSemesterId" TEXT,
    "clearedAt" TIMESTAMP(3),
    "lastMarks" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Backlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "departmentId" TEXT,
    "programId" TEXT,
    "semesterNumber" INTEGER,
    "studentCategory" TEXT,
    "feeTypeId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFee" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT,
    "academicYearId" TEXT NOT NULL,
    "academicSemesterId" TEXT,
    "feeTypeId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "waivedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "status" "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "scholarshipId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAdjustment" (
    "id" TEXT NOT NULL,
    "studentFeeId" TEXT NOT NULL,
    "type" "FeeAdjustmentType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentFeeId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "referenceNumber" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "receivedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "studentFeeId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "daysPerYear" INTEGER NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "documentUrl" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewerComment" TEXT,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "status" "StaffAttendanceStatus" NOT NULL,
    "remark" TEXT,
    "markedByUserId" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "departmentId" TEXT,
    "academicYearId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audience" "Audience" NOT NULL DEFAULT 'INSTITUTION',
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "departmentId" TEXT,
    "facultyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'EVENT',
    "audience" "Audience" NOT NULL DEFAULT 'INSTITUTION',
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "entityType" TEXT,
    "entityId" TEXT,
    "scope" "DocumentScope" NOT NULL DEFAULT 'PRIVATE',
    "uploadedById" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedOn" TIMESTAMP(3),
    "description" TEXT,
    "fileUrl" TEXT,
    "verificationStatus" "CertificateStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "uniqueKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "GrievancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "GrievanceStatus" NOT NULL DEFAULT 'OPEN',
    "isConfidential" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrl" TEXT,
    "assignedToUserId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "description" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementDrive" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "packageLpa" DOUBLE PRECISION,
    "location" TEXT,
    "eligibility" JSONB,
    "requiredSkills" JSONB,
    "selectionProcess" JSONB,
    "documentsRequired" JSONB,
    "applicationDeadline" TIMESTAMP(3),
    "driveDate" TIMESTAMP(3),
    "status" "PlacementDriveStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementApplication" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "status" "PlacementApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "roundResults" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "description" TEXT,
    "eligibility" JSONB,
    "amount" TEXT,
    "deadline" TIMESTAMP(3),
    "applicationLink" TEXT,
    "documentsRequired" JSONB,
    "departmentId" TEXT,
    "category" TEXT,
    "academicYearId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "postedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipApplication" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ScholarshipApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScholarshipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "venue" TEXT,
    "organizerUserId" TEXT,
    "registrationLink" TEXT,
    "registrationDeadline" TIMESTAMP(3),
    "tags" JSONB,
    "audience" "Audience" NOT NULL DEFAULT 'INSTITUTION',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "coordinatorUserId" TEXT,
    "departmentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMembership" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClubMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubActivity" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activityDate" TIMESTAMP(3),
    "documentUrls" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportsRecord" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT,
    "achievements" JSONB,
    "participationDate" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SportsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NccRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentNo" TEXT,
    "unit" TEXT,
    "batch" TEXT,
    "joinDate" TIMESTAMP(3),
    "activities" JSONB,
    "achievements" JSONB,
    "attendancePercent" DOUBLE PRECISION,
    "certificates" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NccRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOutcome" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "CourseOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramOutcome" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ProgramOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSpecificOutcome" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ProgramSpecificOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoPoMapping" (
    "id" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "programOutcomeId" TEXT NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CoPoMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoPsoMapping" (
    "id" TEXT NOT NULL,
    "courseOutcomeId" TEXT NOT NULL,
    "psoId" TEXT NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CoPsoMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttainmentRecord" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "academicSemesterId" TEXT,
    "attainmentType" TEXT NOT NULL,
    "targetId" TEXT,
    "method" TEXT,
    "value" DOUBLE PRECISION,
    "details" JSONB,
    "computedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttainmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionSetting_institutionId_key_key" ON "InstitutionSetting"("institutionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Program_code_key" ON "Program"("code");

-- CreateIndex
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Scheme_code_key" ON "Scheme"("code");

-- CreateIndex
CREATE INDEX "SchemeProgram_programId_idx" ON "SchemeProgram"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeProgram_schemeId_programId_key" ON "SchemeProgram"("schemeId", "programId");

-- CreateIndex
CREATE INDEX "AcademicSemester_semesterNumber_idx" ON "AcademicSemester"("semesterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSemester_academicYearId_semesterNumber_key" ON "AcademicSemester"("academicYearId", "semesterNumber");

-- CreateIndex
CREATE INDEX "Section_programId_idx" ON "Section"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_departmentId_programId_name_key" ON "Section"("departmentId", "programId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CourseType_code_key" ON "CourseType"("code");

-- CreateIndex
CREATE INDEX "Course_departmentId_idx" ON "Course"("departmentId");

-- CreateIndex
CREATE INDEX "Course_schemeId_idx" ON "Course"("schemeId");

-- CreateIndex
CREATE INDEX "Course_courseTypeId_idx" ON "Course"("courseTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_schemeId_key" ON "Course"("code", "schemeId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "CourseOffering_academicSemesterId_idx" ON "CourseOffering"("academicSemesterId");

-- CreateIndex
CREATE INDEX "CourseOffering_sectionId_idx" ON "CourseOffering"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_courseId_sectionId_academicSemesterId_key" ON "CourseOffering"("courseId", "sectionId", "academicSemesterId");

-- CreateIndex
CREATE INDEX "FacultyAssignment_facultyId_idx" ON "FacultyAssignment"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyAssignment_courseOfferingId_facultyId_role_key" ON "FacultyAssignment"("courseOfferingId", "facultyId", "role");

-- CreateIndex
CREATE INDEX "CourseRegistration_courseOfferingId_idx" ON "CourseRegistration"("courseOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRegistration_studentId_courseOfferingId_key" ON "CourseRegistration"("studentId", "courseOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "UserRole_departmentId_idx" ON "UserRole"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_departmentId_key" ON "UserRole"("userId", "roleId", "departmentId");

-- CreateIndex
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_usn_key" ON "Student"("usn");

-- CreateIndex
CREATE INDEX "Student_departmentId_idx" ON "Student"("departmentId");

-- CreateIndex
CREATE INDEX "Student_programId_idx" ON "Student"("programId");

-- CreateIndex
CREATE INDEX "Student_schemeId_idx" ON "Student"("schemeId");

-- CreateIndex
CREATE INDEX "Student_batch_idx" ON "Student"("batch");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_studentId_key" ON "StudentProfile"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_studentId_key" ON "Parent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_userId_key" ON "Faculty"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_employeeId_key" ON "Faculty"("employeeId");

-- CreateIndex
CREATE INDEX "Faculty_departmentId_idx" ON "Faculty"("departmentId");

-- CreateIndex
CREATE INDEX "FacultyCourse_courseId_idx" ON "FacultyCourse"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyCourse_facultyId_courseId_key" ON "FacultyCourse"("facultyId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_employeeId_key" ON "Staff"("employeeId");

-- CreateIndex
CREATE INDEX "StudentSemesterEnrollment_academicSemesterId_idx" ON "StudentSemesterEnrollment"("academicSemesterId");

-- CreateIndex
CREATE INDEX "StudentSemesterEnrollment_sectionId_idx" ON "StudentSemesterEnrollment"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSemesterEnrollment_studentId_academicSemesterId_key" ON "StudentSemesterEnrollment"("studentId", "academicSemesterId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_attendanceDate_idx" ON "AttendanceRecord"("studentId", "attendanceDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_courseOfferingId_attendanceDate_idx" ON "AttendanceRecord"("courseOfferingId", "attendanceDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_attendanceDate_idx" ON "AttendanceRecord"("attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_courseOfferingId_studentId_attendanceDate__key" ON "AttendanceRecord"("courseOfferingId", "studentId", "attendanceDate", "periodNumber");

-- CreateIndex
CREATE INDEX "TimetableEntry_academicSemesterId_sectionId_dayOfWeek_idx" ON "TimetableEntry"("academicSemesterId", "sectionId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TimetableEntry_facultyId_idx" ON "TimetableEntry"("facultyId");

-- CreateIndex
CREATE INDEX "TimetableEntry_roomId_idx" ON "TimetableEntry"("roomId");

-- CreateIndex
CREATE INDEX "TimetableEntry_courseOfferingId_idx" ON "TimetableEntry"("courseOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentComponent_code_departmentId_key" ON "AssessmentComponent"("code", "departmentId");

-- CreateIndex
CREATE INDEX "Assessment_courseOfferingId_idx" ON "Assessment"("courseOfferingId");

-- CreateIndex
CREATE INDEX "Assessment_componentId_idx" ON "Assessment"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionType_code_key" ON "QuestionType"("code");

-- CreateIndex
CREATE INDEX "QuestionBankItem_courseId_idx" ON "QuestionBankItem"("courseId");

-- CreateIndex
CREATE INDEX "QuestionBankItem_questionTypeId_idx" ON "QuestionBankItem"("questionTypeId");

-- CreateIndex
CREATE INDEX "QuestionBankItem_co_idx" ON "QuestionBankItem"("co");

-- CreateIndex
CREATE INDEX "QuestionBankItem_bloomLevel_idx" ON "QuestionBankItem"("bloomLevel");

-- CreateIndex
CREATE INDEX "QuestionBankItem_unit_idx" ON "QuestionBankItem"("unit");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_questionId_idx" ON "AssessmentQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestion_assessmentId_questionId_key" ON "AssessmentQuestion"("assessmentId", "questionId");

-- CreateIndex
CREATE INDEX "QuestionPaper_courseId_idx" ON "QuestionPaper"("courseId");

-- CreateIndex
CREATE INDEX "QuestionPaper_status_idx" ON "QuestionPaper"("status");

-- CreateIndex
CREATE INDEX "QuestionPaperQuestion_questionPaperId_idx" ON "QuestionPaperQuestion"("questionPaperId");

-- CreateIndex
CREATE INDEX "QuestionPaperApproval_questionPaperId_idx" ON "QuestionPaperApproval"("questionPaperId");

-- CreateIndex
CREATE INDEX "CieMark_studentId_idx" ON "CieMark"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CieMark_assessmentId_studentId_key" ON "CieMark"("assessmentId", "studentId");

-- CreateIndex
CREATE INDEX "CieConsolidation_courseOfferingId_idx" ON "CieConsolidation"("courseOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "CieConsolidation_studentId_courseOfferingId_academicSemeste_key" ON "CieConsolidation"("studentId", "courseOfferingId", "academicSemesterId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamType_code_key" ON "ExamType"("code");

-- CreateIndex
CREATE INDEX "ExamSession_examTypeId_idx" ON "ExamSession"("examTypeId");

-- CreateIndex
CREATE INDEX "ExamSession_academicYearId_idx" ON "ExamSession"("academicYearId");

-- CreateIndex
CREATE INDEX "Exam_courseId_idx" ON "Exam"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_examSessionId_courseId_key" ON "Exam"("examSessionId", "courseId");

-- CreateIndex
CREATE INDEX "ExamRegistration_studentId_idx" ON "ExamRegistration"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRegistration_examSessionId_studentId_key" ON "ExamRegistration"("examSessionId", "studentId");

-- CreateIndex
CREATE INDEX "ExamEligibility_studentId_idx" ON "ExamEligibility"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamEligibility_examSessionId_studentId_courseId_key" ON "ExamEligibility"("examSessionId", "studentId", "courseId");

-- CreateIndex
CREATE INDEX "ExamHallAllocation_roomId_idx" ON "ExamHallAllocation"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamHallAllocation_examId_studentId_key" ON "ExamHallAllocation"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamHallAllocation_examId_roomId_seatNumber_key" ON "ExamHallAllocation"("examId", "roomId", "seatNumber");

-- CreateIndex
CREATE INDEX "ExamInvigilator_facultyId_idx" ON "ExamInvigilator"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamInvigilator_examId_facultyId_roomId_key" ON "ExamInvigilator"("examId", "facultyId", "roomId");

-- CreateIndex
CREATE INDEX "ExamAttendance_studentId_idx" ON "ExamAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttendance_examId_studentId_key" ON "ExamAttendance"("examId", "studentId");

-- CreateIndex
CREATE INDEX "Mark_studentId_idx" ON "Mark"("studentId");

-- CreateIndex
CREATE INDEX "Mark_courseId_idx" ON "Mark"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Mark_examSessionId_studentId_courseId_key" ON "Mark"("examSessionId", "studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_schemeId_grade_key" ON "Grade"("schemeId", "grade");

-- CreateIndex
CREATE INDEX "Result_academicSemesterId_idx" ON "Result"("academicSemesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_academicSemesterId_key" ON "Result"("studentId", "academicSemesterId");

-- CreateIndex
CREATE INDEX "ResultItem_courseId_idx" ON "ResultItem"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultItem_resultId_courseId_key" ON "ResultItem"("resultId", "courseId");

-- CreateIndex
CREATE INDEX "ResultHistory_resultItemId_idx" ON "ResultHistory"("resultItemId");

-- CreateIndex
CREATE INDEX "Backlog_courseId_idx" ON "Backlog"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Backlog_studentId_courseId_key" ON "Backlog"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeType_code_key" ON "FeeType"("code");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearId_idx" ON "FeeStructure"("academicYearId");

-- CreateIndex
CREATE INDEX "FeeStructure_departmentId_idx" ON "FeeStructure"("departmentId");

-- CreateIndex
CREATE INDEX "FeeStructure_feeTypeId_idx" ON "FeeStructure"("feeTypeId");

-- CreateIndex
CREATE INDEX "StudentFee_studentId_idx" ON "StudentFee"("studentId");

-- CreateIndex
CREATE INDEX "StudentFee_academicYearId_idx" ON "StudentFee"("academicYearId");

-- CreateIndex
CREATE INDEX "StudentFee_feeTypeId_idx" ON "StudentFee"("feeTypeId");

-- CreateIndex
CREATE INDEX "StudentFee_status_idx" ON "StudentFee"("status");

-- CreateIndex
CREATE INDEX "FeeAdjustment_studentFeeId_idx" ON "FeeAdjustment"("studentFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "PaymentAllocation_studentFeeId_idx" ON "PaymentAllocation"("studentFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_paymentId_key" ON "Receipt"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_generatedAt_idx" ON "Receipt"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_code_key" ON "LeaveType"("code");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");

-- CreateIndex
CREATE INDEX "LeaveRequest_departmentId_idx" ON "LeaveRequest"("departmentId");

-- CreateIndex
CREATE INDEX "StaffAttendance_attendanceDate_idx" ON "StaffAttendance"("attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendance_userId_attendanceDate_key" ON "StaffAttendance"("userId", "attendanceDate");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_channel_key" ON "NotificationPreference"("userId", "type", "channel");

-- CreateIndex
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");

-- CreateIndex
CREATE INDEX "Announcement_departmentId_idx" ON "Announcement"("departmentId");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventDate_idx" ON "CalendarEvent"("eventDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_departmentId_idx" ON "CalendarEvent"("departmentId");

-- CreateIndex
CREATE INDEX "Document_entityType_entityId_idx" ON "Document"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_uniqueKey_key" ON "Certificate"("uniqueKey");

-- CreateIndex
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

-- CreateIndex
CREATE INDEX "Certificate_category_idx" ON "Certificate"("category");

-- CreateIndex
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

-- CreateIndex
CREATE INDEX "Grievance_studentId_idx" ON "Grievance"("studentId");

-- CreateIndex
CREATE INDEX "Grievance_category_idx" ON "Grievance"("category");

-- CreateIndex
CREATE INDEX "PlacementDrive_status_idx" ON "PlacementDrive"("status");

-- CreateIndex
CREATE INDEX "PlacementDrive_companyId_idx" ON "PlacementDrive"("companyId");

-- CreateIndex
CREATE INDEX "PlacementApplication_studentId_idx" ON "PlacementApplication"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementApplication_driveId_studentId_key" ON "PlacementApplication"("driveId", "studentId");

-- CreateIndex
CREATE INDEX "Scholarship_deadline_idx" ON "Scholarship"("deadline");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_studentId_idx" ON "ScholarshipApplication"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipApplication_scholarshipId_studentId_key" ON "ScholarshipApplication"("scholarshipId", "studentId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "EventRegistration_studentId_idx" ON "EventRegistration"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_studentId_key" ON "EventRegistration"("eventId", "studentId");

-- CreateIndex
CREATE INDEX "ClubMembership_studentId_idx" ON "ClubMembership"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMembership_clubId_studentId_key" ON "ClubMembership"("clubId", "studentId");

-- CreateIndex
CREATE INDEX "ClubActivity_clubId_idx" ON "ClubActivity"("clubId");

-- CreateIndex
CREATE INDEX "SportsRecord_studentId_idx" ON "SportsRecord"("studentId");

-- CreateIndex
CREATE INDEX "SportsRecord_sportId_idx" ON "SportsRecord"("sportId");

-- CreateIndex
CREATE UNIQUE INDEX "NccRecord_studentId_key" ON "NccRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOutcome_courseId_code_key" ON "CourseOutcome"("courseId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramOutcome_programId_code_key" ON "ProgramOutcome"("programId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSpecificOutcome_programId_code_key" ON "ProgramSpecificOutcome"("programId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CoPoMapping_courseOutcomeId_programOutcomeId_key" ON "CoPoMapping"("courseOutcomeId", "programOutcomeId");

-- CreateIndex
CREATE UNIQUE INDEX "CoPsoMapping_courseOutcomeId_psoId_key" ON "CoPsoMapping"("courseOutcomeId", "psoId");

-- CreateIndex
CREATE INDEX "AttainmentRecord_courseOfferingId_idx" ON "AttainmentRecord"("courseOfferingId");

-- CreateIndex
CREATE INDEX "AttainmentRecord_attainmentType_idx" ON "AttainmentRecord"("attainmentType");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "InstitutionSetting" ADD CONSTRAINT "InstitutionSetting_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheme" ADD CONSTRAINT "Scheme_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeProgram" ADD CONSTRAINT "SchemeProgram_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeProgram" ADD CONSTRAINT "SchemeProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicSemester" ADD CONSTRAINT "AcademicSemester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_courseTypeId_fkey" FOREIGN KEY ("courseTypeId") REFERENCES "CourseType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyAssignment" ADD CONSTRAINT "FacultyAssignment_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyAssignment" ADD CONSTRAINT "FacultyAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyAssignment" ADD CONSTRAINT "FacultyAssignment_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyCourse" ADD CONSTRAINT "FacultyCourse_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyCourse" ADD CONSTRAINT "FacultyCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSemesterEnrollment" ADD CONSTRAINT "StudentSemesterEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSemesterEnrollment" ADD CONSTRAINT "StudentSemesterEnrollment_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSemesterEnrollment" ADD CONSTRAINT "StudentSemesterEnrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "AssessmentComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_questionTypeId_fkey" FOREIGN KEY ("questionTypeId") REFERENCES "QuestionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionBankItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperQuestion" ADD CONSTRAINT "QuestionPaperQuestion_questionPaperId_fkey" FOREIGN KEY ("questionPaperId") REFERENCES "QuestionPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperQuestion" ADD CONSTRAINT "QuestionPaperQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionBankItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperApproval" ADD CONSTRAINT "QuestionPaperApproval_questionPaperId_fkey" FOREIGN KEY ("questionPaperId") REFERENCES "QuestionPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CieMark" ADD CONSTRAINT "CieMark_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CieMark" ADD CONSTRAINT "CieMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CieConsolidation" ADD CONSTRAINT "CieConsolidation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CieConsolidation" ADD CONSTRAINT "CieConsolidation_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CieConsolidation" ADD CONSTRAINT "CieConsolidation_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRegistration" ADD CONSTRAINT "ExamRegistration_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRegistration" ADD CONSTRAINT "ExamRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEligibility" ADD CONSTRAINT "ExamEligibility_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEligibility" ADD CONSTRAINT "ExamEligibility_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEligibility" ADD CONSTRAINT "ExamEligibility_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamHallAllocation" ADD CONSTRAINT "ExamHallAllocation_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamHallAllocation" ADD CONSTRAINT "ExamHallAllocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamHallAllocation" ADD CONSTRAINT "ExamHallAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamInvigilator" ADD CONSTRAINT "ExamInvigilator_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamInvigilator" ADD CONSTRAINT "ExamInvigilator_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamInvigilator" ADD CONSTRAINT "ExamInvigilator_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultItem" ADD CONSTRAINT "ResultItem_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultItem" ADD CONSTRAINT "ResultItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultHistory" ADD CONSTRAINT "ResultHistory_resultItemId_fkey" FOREIGN KEY ("resultItemId") REFERENCES "ResultItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backlog" ADD CONSTRAINT "Backlog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backlog" ADD CONSTRAINT "Backlog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAdjustment" ADD CONSTRAINT "FeeAdjustment_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementDrive" ADD CONSTRAINT "PlacementDrive_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "PlacementDrive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubActivity" ADD CONSTRAINT "ClubActivity_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsRecord" ADD CONSTRAINT "SportsRecord_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsRecord" ADD CONSTRAINT "SportsRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NccRecord" ADD CONSTRAINT "NccRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOutcome" ADD CONSTRAINT "CourseOutcome_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramOutcome" ADD CONSTRAINT "ProgramOutcome_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramSpecificOutcome" ADD CONSTRAINT "ProgramSpecificOutcome_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoPoMapping" ADD CONSTRAINT "CoPoMapping_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoPoMapping" ADD CONSTRAINT "CoPoMapping_programOutcomeId_fkey" FOREIGN KEY ("programOutcomeId") REFERENCES "ProgramOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoPsoMapping" ADD CONSTRAINT "CoPsoMapping_courseOutcomeId_fkey" FOREIGN KEY ("courseOutcomeId") REFERENCES "CourseOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoPsoMapping" ADD CONSTRAINT "CoPsoMapping_psoId_fkey" FOREIGN KEY ("psoId") REFERENCES "ProgramSpecificOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttainmentRecord" ADD CONSTRAINT "AttainmentRecord_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
