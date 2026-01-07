/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'TEXT', 'MIXED');

-- CreateEnum
CREATE TYPE "CognitiveLevel" AS ENUM ('RECALL', 'APPLICATION', 'ANALYSIS');

-- CreateEnum
CREATE TYPE "SnippetType" AS ENUM ('DEFINITION', 'FORMULA', 'TIP', 'WARNING', 'EXAMPLE', 'SUMMARY');

-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'NUMERIC';

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "change_log" JSONB DEFAULT '[]',
ADD COLUMN     "intro_video_url" TEXT,
ADD COLUMN     "learning_outcomes" JSONB DEFAULT '[]',
ADD COLUMN     "meta_description" VARCHAR(160),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "subtitle" VARCHAR(120),
ADD COLUMN     "tags" JSONB DEFAULT '[]',
ADD COLUMN     "target_audience" TEXT,
ADD COLUMN     "thumbnail_alt_text" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "alt_text_provided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "auto_complete_threshold" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "captions_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "content_type" "ContentType" DEFAULT 'MIXED',
ADD COLUMN     "example_problem" TEXT,
ADD COLUMN     "key_terms" JSONB DEFAULT '[]',
ADD COLUMN     "practice_task" TEXT,
ADD COLUMN     "transcript_url" TEXT,
ADD COLUMN     "word_count" INTEGER;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "acceptable_alternatives" JSONB DEFAULT '[]',
ADD COLUMN     "acceptable_range" DOUBLE PRECISION,
ADD COLUMN     "case_sensitive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cognitive_level" "CognitiveLevel" DEFAULT 'RECALL',
ADD COLUMN     "is_in_question_bank" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" JSONB DEFAULT '[]',
ADD COLUMN     "usage_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "badge_eligible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "points_on_pass" INTEGER NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "course_versions" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "changes_summary" TEXT NOT NULL,
    "snapshot_data" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_snippets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SnippetType" NOT NULL,
    "template" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_snippets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_versions_course_id_idx" ON "course_versions"("course_id");

-- CreateIndex
CREATE INDEX "course_versions_published_at_idx" ON "course_versions"("published_at");

-- CreateIndex
CREATE INDEX "lesson_templates_created_by_idx" ON "lesson_templates"("created_by");

-- CreateIndex
CREATE INDEX "lesson_templates_is_public_idx" ON "lesson_templates"("is_public");

-- CreateIndex
CREATE INDEX "content_snippets_created_by_idx" ON "content_snippets"("created_by");

-- CreateIndex
CREATE INDEX "content_snippets_type_idx" ON "content_snippets"("type");

-- CreateIndex
CREATE INDEX "content_snippets_is_public_idx" ON "content_snippets"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_slug_idx" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "questions_is_in_question_bank_idx" ON "questions"("is_in_question_bank");

-- AddForeignKey
ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_templates" ADD CONSTRAINT "lesson_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_snippets" ADD CONSTRAINT "content_snippets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
