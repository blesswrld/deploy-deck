/*
  Warnings:

  - A unique constraint covering the columns `[vercelProjectId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "vercelProjectId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_vercelProjectId_key" ON "public"."Project"("vercelProjectId");
