-- AlterTable
ALTER TABLE "TimetableEntry" ADD COLUMN "sectionId" TEXT;

-- AlterTable
ALTER TABLE "StudentSemesterEnrollment" ADD COLUMN "sectionId" TEXT;

-- CreateIndex
CREATE INDEX "TimetableEntry_sectionId_idx" ON "TimetableEntry"("sectionId");

-- CreateIndex
CREATE INDEX "StudentSemesterEnrollment_sectionId_idx" ON "StudentSemesterEnrollment"("sectionId");

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSemesterEnrollment" ADD CONSTRAINT "StudentSemesterEnrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
