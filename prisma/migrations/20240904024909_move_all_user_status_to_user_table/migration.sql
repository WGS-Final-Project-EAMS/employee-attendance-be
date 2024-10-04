/*
  Warnings:

  - The values [manager] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `is_active` on the `AdminManagement` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `AdminManagement` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('super_admin', 'admin', 'employee');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "AdminManagement" DROP COLUMN "is_active",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "AdminRole";
