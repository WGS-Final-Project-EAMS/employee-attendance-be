/*
  Warnings:

  - You are about to drop the column `full_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profile_picture_url` on the `User` table. All the data in the column will be lost.
  - Added the required column `full_name` to the `AdminManagement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdminManagement" ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "profile_picture_url" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "profile_picture_url" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "full_name",
DROP COLUMN "phone_number",
DROP COLUMN "profile_picture_url";
