-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "academicSemesterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Section_departmentId_academicSemesterId_name_key" ON "Section"("departmentId", "academicSemesterId", "name");

-- CreateIndex
CREATE INDEX "Section_academicSemesterId_idx" ON "Section"("academicSemesterId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;
