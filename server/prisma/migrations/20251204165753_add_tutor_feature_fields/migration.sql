-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "attachments" JSONB DEFAULT '[]',
ADD COLUMN     "content" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "video_file_url" TEXT;

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "show_correct_answers" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "lesson_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tutoring_sessions" ADD COLUMN     "actual_end" TIMESTAMP(3),
ADD COLUMN     "actual_start" TIMESTAMP(3),
ADD COLUMN     "chat_log" JSONB DEFAULT '[]',
ADD COLUMN     "session_notes" TEXT,
ADD COLUMN     "shared_files" JSONB DEFAULT '[]';

-- CreateIndex
CREATE INDEX "quizzes_course_id_idx" ON "quizzes"("course_id");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
