/*
  Warnings:

  - Added the required column `manager_id` to the `LeaveRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_approved_by_fkey";

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "manager_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "Employee"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;
