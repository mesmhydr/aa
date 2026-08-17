-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hodUserId_fkey" FOREIGN KEY ("hodUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_deptCoordinatorUserId_fkey" FOREIGN KEY ("deptCoordinatorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
