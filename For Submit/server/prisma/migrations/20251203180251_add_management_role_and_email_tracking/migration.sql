-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('INVITATION', 'REMINDER', 'UPDATE', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "EmailResponseStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "SessionResponseType" AS ENUM ('CONFIRMED', 'DECLINED', 'RESCHEDULE_REQUEST');

-- CreateEnum
CREATE TYPE "EmailFrequency" AS ENUM ('IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST');

-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FeatureRequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SESSION_INVITATION';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_DECLINED';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MANAGEMENT';

-- CreateTable
CREATE TABLE "session_email_tracking" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "email_type" "EmailType" NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "response_status" "EmailResponseStatus" NOT NULL DEFAULT 'PENDING',
    "bounce_type" TEXT,
    "failure_reason" TEXT,
    "email_service_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_email_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_session_responses" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "response_type" "SessionResponseType" NOT NULL,
    "response_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reschedule_reason" TEXT,
    "preferred_times" JSONB,
    "decline_reason" TEXT,
    "notification_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_session_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_invitations" BOOLEAN NOT NULL DEFAULT true,
    "session_reminders" BOOLEAN NOT NULL DEFAULT true,
    "reminder_timing" JSONB NOT NULL DEFAULT '[24, 1]',
    "email_frequency" "EmailFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "include_calendar_file" BOOLEAN NOT NULL DEFAULT true,
    "notification_language" TEXT NOT NULL DEFAULT 'en',
    "unsubscribed_from_types" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "FeatureRequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimated_effort" TEXT,
    "target_release" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" DECIMAL(10,2) NOT NULL,
    "metric_unit" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_reports" (
    "id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "generated_by" TEXT NOT NULL,
    "report_period_start" TIMESTAMP(3) NOT NULL,
    "report_period_end" TIMESTAMP(3) NOT NULL,
    "file_url" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_email_tracking_session_id_idx" ON "session_email_tracking"("session_id");

-- CreateIndex
CREATE INDEX "session_email_tracking_student_id_idx" ON "session_email_tracking"("student_id");

-- CreateIndex
CREATE INDEX "session_email_tracking_sent_at_idx" ON "session_email_tracking"("sent_at");

-- CreateIndex
CREATE INDEX "student_session_responses_session_id_idx" ON "student_session_responses"("session_id");

-- CreateIndex
CREATE INDEX "student_session_responses_student_id_idx" ON "student_session_responses"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_notification_preferences_user_id_key" ON "email_notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "feature_requests_status_idx" ON "feature_requests"("status");

-- CreateIndex
CREATE INDEX "feature_requests_priority_idx" ON "feature_requests"("priority");

-- CreateIndex
CREATE INDEX "system_metrics_metric_name_idx" ON "system_metrics"("metric_name");

-- CreateIndex
CREATE INDEX "system_metrics_recorded_at_idx" ON "system_metrics"("recorded_at");

-- CreateIndex
CREATE INDEX "platform_reports_report_type_idx" ON "platform_reports"("report_type");

-- CreateIndex
CREATE INDEX "platform_reports_created_at_idx" ON "platform_reports"("created_at");

-- AddForeignKey
ALTER TABLE "session_email_tracking" ADD CONSTRAINT "session_email_tracking_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "tutoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_email_tracking" ADD CONSTRAINT "session_email_tracking_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_session_responses" ADD CONSTRAINT "student_session_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "tutoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_session_responses" ADD CONSTRAINT "student_session_responses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_notification_preferences" ADD CONSTRAINT "email_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_reports" ADD CONSTRAINT "platform_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
