/*
  Warnings:

  - A unique constraint covering the columns `[githubId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "githubAccessToken" TEXT,
ADD COLUMN     "githubId" INTEGER,
ADD COLUMN     "githubUsername" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "public"."User"("githubId");
