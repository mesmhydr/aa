-- DropIndex
DROP INDEX "AssessmentComponent_code_departmentId_key";

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaperApproval" ADD CONSTRAINT "QuestionPaperApproval_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
