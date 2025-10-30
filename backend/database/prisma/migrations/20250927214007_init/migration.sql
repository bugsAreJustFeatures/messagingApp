-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
