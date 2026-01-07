-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('LEARNING_MATERIALS', 'ASSIGNMENT', 'ANNOUNCEMENT', 'RESOURCE_LINKS', 'DISCUSSION', 'VIDEO_LESSON', 'QUIZ');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'GRADED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateTable
CREATE TABLE "course_components" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "component_type" "ComponentType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "configuration" JSONB DEFAULT '{}',
    "sequence_order" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_files" (
    "id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "description" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "grade" DECIMAL(5,2),
    "feedback" TEXT,
    "graded_by" TEXT,
    "graded_at" TIMESTAMP(3),
    "student_comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_files" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_components_course_id_idx" ON "course_components"("course_id");

-- CreateIndex
CREATE INDEX "course_components_component_type_idx" ON "course_components"("component_type");

-- CreateIndex
CREATE INDEX "course_components_created_by_idx" ON "course_components"("created_by");

-- CreateIndex
CREATE INDEX "course_components_sequence_order_idx" ON "course_components"("sequence_order");

-- CreateIndex
CREATE INDEX "component_files_component_id_idx" ON "component_files"("component_id");

-- CreateIndex
CREATE INDEX "component_files_uploaded_by_idx" ON "component_files"("uploaded_by");

-- CreateIndex
CREATE INDEX "assignment_submissions_component_id_idx" ON "assignment_submissions"("component_id");

-- CreateIndex
CREATE INDEX "assignment_submissions_student_id_idx" ON "assignment_submissions"("student_id");

-- CreateIndex
CREATE INDEX "assignment_submissions_status_idx" ON "assignment_submissions"("status");

-- CreateIndex
CREATE INDEX "assignment_submissions_submitted_at_idx" ON "assignment_submissions"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_component_id_student_id_attempt_numb_key" ON "assignment_submissions"("component_id", "student_id", "attempt_number");

-- CreateIndex
CREATE INDEX "submission_files_submission_id_idx" ON "submission_files"("submission_id");

-- AddForeignKey
ALTER TABLE "course_components" ADD CONSTRAINT "course_components_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_components" ADD CONSTRAINT "course_components_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_files" ADD CONSTRAINT "component_files_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "course_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_files" ADD CONSTRAINT "component_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "course_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
