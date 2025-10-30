/*
  Warnings:

  - The required column `name` was added to the `chats` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."chats" ADD COLUMN     "name" TEXT NOT NULL;
