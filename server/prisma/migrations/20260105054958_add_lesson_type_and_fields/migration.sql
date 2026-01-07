-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('TEXT', 'FILE', 'VIDEO_LINK', 'LIVE_INFO');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_size" TEXT,
ADD COLUMN     "file_url" TEXT,
ADD COLUMN     "link_url" TEXT,
ADD COLUMN     "type" "LessonType" NOT NULL DEFAULT 'TEXT';
