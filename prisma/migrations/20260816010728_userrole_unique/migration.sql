DROP INDEX IF EXISTS "UserRole_userId_roleId_departmentId_key";
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");