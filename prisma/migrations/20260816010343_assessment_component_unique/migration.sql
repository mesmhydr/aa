ALTER TABLE "AssessmentComponent" DROP CONSTRAINT IF EXISTS "AssessmentComponent_code_departmentId_key";
CREATE UNIQUE INDEX "AssessmentComponent_code_key" ON "AssessmentComponent"("code");