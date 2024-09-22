/*
  Warnings:

  - Added the required column `assignedBy_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedBy_id" TEXT NOT NULL,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "profile_picture_url" TEXT,
ALTER COLUMN "role" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedBy_id_fkey" FOREIGN KEY ("assignedBy_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
