/*
  Warnings:

  - The values [PAYMENT] on the enum `SettingCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `pricing_model` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `amount_paid` on the `session_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `price_per_student` on the `tutoring_sessions` table. All the data in the column will be lost.
  - You are about to drop the `payment_webhook_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[request_id]` on the table `tutoring_sessions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slot_id]` on the table `tutoring_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('GENERAL', 'CLASS_UPDATE', 'ADMIN_TICKET');

-- CreateEnum
CREATE TYPE "TutoringRequestStatus" AS ENUM ('PENDING', 'MATCHED', 'BOOKED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "SettingCategory_new" AS ENUM ('FEATURE_FLAG', 'GAMIFICATION', 'EMAIL', 'GENERAL');
ALTER TABLE "system_settings" ALTER COLUMN "category" TYPE "SettingCategory_new" USING ("category"::text::"SettingCategory_new");
ALTER TYPE "SettingCategory" RENAME TO "SettingCategory_old";
ALTER TYPE "SettingCategory_new" RENAME TO "SettingCategory";
DROP TYPE "public"."SettingCategory_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_fkey";

-- AlterTable
ALTER TABLE "component_files" ADD COLUMN     "scheduled_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "price",
DROP COLUMN "pricing_model";

-- AlterTable
ALTER TABLE "session_bookings" DROP COLUMN "amount_paid";

-- AlterTable
ALTER TABLE "tutoring_sessions" DROP COLUMN "price_per_student",
ADD COLUMN     "request_id" TEXT,
ADD COLUMN     "slot_id" TEXT;

-- DropTable
DROP TABLE "payment_webhook_events";

-- DropTable
DROP TABLE "transactions";

-- DropEnum
DROP TYPE "PricingModel";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "WebhookProcessingStatus";

-- CreateTable
CREATE TABLE "component_messages" (
    "id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbox_messages" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "type" "MessageType" NOT NULL DEFAULT 'GENERAL',
    "course_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hourly_rate" DECIMAL(10,2) NOT NULL,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "levels_supported" "EducationLevel"[] DEFAULT ARRAY[]::"EducationLevel"[],

    CONSTRAINT "tutor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_subjects" (
    "id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "skill_level" "Difficulty" NOT NULL DEFAULT 'BEGINNER',

    CONSTRAINT "tutor_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_requests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "preferred_level" "EducationLevel" NOT NULL,
    "budget_max" DECIMAL(10,2),
    "preferred_language" TEXT,
    "preferred_start" TIMESTAMP(3),
    "preferred_end" TIMESTAMP(3),
    "status" "TutoringRequestStatus" NOT NULL DEFAULT 'PENDING',
    "matched_tutor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutoring_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_slots" (
    "id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "component_messages_component_id_idx" ON "component_messages"("component_id");

-- CreateIndex
CREATE INDEX "inbox_messages_sender_id_idx" ON "inbox_messages"("sender_id");

-- CreateIndex
CREATE INDEX "inbox_messages_receiver_id_idx" ON "inbox_messages"("receiver_id");

-- CreateIndex
CREATE INDEX "inbox_messages_is_read_idx" ON "inbox_messages"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_profiles_user_id_key" ON "tutor_profiles"("user_id");

-- CreateIndex
CREATE INDEX "tutor_profiles_user_id_idx" ON "tutor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE INDEX "tutor_subjects_tutor_id_idx" ON "tutor_subjects"("tutor_id");

-- CreateIndex
CREATE INDEX "tutor_subjects_subject_id_idx" ON "tutor_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_subjects_tutor_id_subject_id_key" ON "tutor_subjects"("tutor_id", "subject_id");

-- CreateIndex
CREATE INDEX "tutoring_requests_student_id_idx" ON "tutoring_requests"("student_id");

-- CreateIndex
CREATE INDEX "tutoring_requests_subject_id_idx" ON "tutoring_requests"("subject_id");

-- CreateIndex
CREATE INDEX "tutoring_requests_matched_tutor_id_idx" ON "tutoring_requests"("matched_tutor_id");

-- CreateIndex
CREATE INDEX "availability_slots_tutor_id_idx" ON "availability_slots"("tutor_id");

-- CreateIndex
CREATE INDEX "availability_slots_start_time_idx" ON "availability_slots"("start_time");

-- CreateIndex
CREATE UNIQUE INDEX "tutoring_sessions_request_id_key" ON "tutoring_sessions"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "tutoring_sessions_slot_id_key" ON "tutoring_sessions"("slot_id");

-- AddForeignKey
ALTER TABLE "tutoring_sessions" ADD CONSTRAINT "tutoring_sessions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "tutoring_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_sessions" ADD CONSTRAINT "tutoring_sessions_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "availability_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_messages" ADD CONSTRAINT "component_messages_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "course_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_messages" ADD CONSTRAINT "component_messages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_profiles" ADD CONSTRAINT "tutor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_subjects" ADD CONSTRAINT "tutor_subjects_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_subjects" ADD CONSTRAINT "tutor_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_requests" ADD CONSTRAINT "tutoring_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_requests" ADD CONSTRAINT "tutoring_requests_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_requests" ADD CONSTRAINT "tutoring_requests_matched_tutor_id_fkey" FOREIGN KEY ("matched_tutor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
