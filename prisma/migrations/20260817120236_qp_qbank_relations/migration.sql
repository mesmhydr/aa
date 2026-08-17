-- AddForeignKey
ALTER TABLE "QuestionBankItem" ADD CONSTRAINT "QuestionBankItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
