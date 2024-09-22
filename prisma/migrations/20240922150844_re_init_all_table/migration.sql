/*
  Warnings:

  - You are about to drop the column `full_name` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `profile_picture_url` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `assignedBy_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AdminManagement` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `assigned_by` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AdminManagement" DROP CONSTRAINT "AdminManagement_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "AdminManagement" DROP CONSTRAINT "AdminManagement_user_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_assignedBy_id_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "full_name",
DROP COLUMN "phone_number",
DROP COLUMN "profile_picture_url";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "assignedBy_id",
ADD COLUMN     "assigned_by" TEXT NOT NULL;

-- DropTable
DROP TABLE "AdminManagement";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
