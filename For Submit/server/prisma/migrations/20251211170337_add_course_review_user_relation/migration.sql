/*
  Warnings:

  - You are about to drop the column `review` on the `course_reviews` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "course_reviews" DROP COLUMN "review",
ADD COLUMN     "comment" TEXT;

-- CreateIndex
CREATE INDEX "course_reviews_user_id_idx" ON "course_reviews"("user_id");

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
