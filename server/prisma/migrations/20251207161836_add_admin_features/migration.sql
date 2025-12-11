-- CreateEnum
CREATE TYPE "TutorVerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'DECLINED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "ReportedItemType" AS ENUM ('LESSON', 'QUIZ', 'QUESTION', 'MESSAGE', 'COURSE', 'USER');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('INAPPROPRIATE', 'INACCURATE', 'OFFENSIVE', 'COPYRIGHT', 'SPAM', 'HARASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('BOOLEAN', 'INTEGER', 'STRING', 'JSON', 'ARRAY');

-- CreateEnum
CREATE TYPE "SettingCategory" AS ENUM ('FEATURE_FLAG', 'GAMIFICATION', 'EMAIL', 'PAYMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "EmailTemplateCategory" AS ENUM ('WELCOME', 'APPROVAL', 'REMINDER', 'ANNOUNCEMENT', 'SYSTEM', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "BroadcastAudience" AS ENUM ('ALL_STUDENTS', 'ALL_TUTORS', 'ALL_USERS', 'SPECIFIC_ROLE', 'ACTIVE_USERS_ONLY');

-- CreateEnum
CREATE TYPE "BroadcastPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WarningSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'SEVERE');

-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRY');

-- CreateTable
CREATE TABLE "tutor_verification_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "subjects" JSONB NOT NULL DEFAULT '[]',
    "sample_lesson_url" TEXT,
    "qualifications" TEXT NOT NULL,
    "teaching_experience" TEXT,
    "status" "TutorVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewer_id" TEXT,
    "review_notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_verification_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_item_type" "ReportedItemType" NOT NULL,
    "reported_item_id" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ReportPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
    "resolver_id" TEXT,
    "resolution" TEXT,
    "evidenceUrls" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" JSONB NOT NULL,
    "value_type" "SettingValueType" NOT NULL,
    "category" "SettingCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "last_modified_by" TEXT,
    "last_modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_plain" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "category" "EmailTemplateCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_messages" (
    "id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "target_audience" "BroadcastAudience" NOT NULL,
    "target_role" "UserRole",
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "BroadcastPriority" NOT NULL DEFAULT 'NORMAL',
    "scheduled_for" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcast_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_resource_type" TEXT NOT NULL,
    "target_resource_id" TEXT,
    "previous_state" JSONB,
    "new_state" JSONB,
    "reason" TEXT,
    "ip_address" TEXT,
    "additional_context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_performance" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "correct_attempts" INTEGER NOT NULL DEFAULT 0,
    "correct_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "average_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "skip_count" INTEGER NOT NULL DEFAULT 0,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_warnings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" "WarningSeverity" NOT NULL DEFAULT 'LOW',
    "related_item_type" TEXT,
    "related_item_id" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processing_status" "WebhookProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "transaction_id" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_locks" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "locked_by" TEXT NOT NULL,
    "lock_reason" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "course_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_verification_applications_user_id_idx" ON "tutor_verification_applications"("user_id");

-- CreateIndex
CREATE INDEX "tutor_verification_applications_status_idx" ON "tutor_verification_applications"("status");

-- CreateIndex
CREATE INDEX "tutor_verification_applications_submitted_at_idx" ON "tutor_verification_applications"("submitted_at");

-- CreateIndex
CREATE INDEX "content_reports_reporter_id_idx" ON "content_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- CreateIndex
CREATE INDEX "content_reports_priority_idx" ON "content_reports"("priority");

-- CreateIndex
CREATE INDEX "content_reports_created_at_idx" ON "content_reports"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "system_settings_setting_key_idx" ON "system_settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_template_key_key" ON "email_templates"("template_key");

-- CreateIndex
CREATE INDEX "email_templates_category_idx" ON "email_templates"("category");

-- CreateIndex
CREATE INDEX "email_templates_is_active_idx" ON "email_templates"("is_active");

-- CreateIndex
CREATE INDEX "broadcast_messages_created_by_idx" ON "broadcast_messages"("created_by");

-- CreateIndex
CREATE INDEX "broadcast_messages_status_idx" ON "broadcast_messages"("status");

-- CreateIndex
CREATE INDEX "broadcast_messages_scheduled_for_idx" ON "broadcast_messages"("scheduled_for");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_type_idx" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_target_resource_type_idx" ON "audit_logs"("target_resource_type");

-- CreateIndex
CREATE UNIQUE INDEX "question_performance_question_id_key" ON "question_performance"("question_id");

-- CreateIndex
CREATE INDEX "question_performance_question_id_idx" ON "question_performance"("question_id");

-- CreateIndex
CREATE INDEX "question_performance_correct_rate_idx" ON "question_performance"("correct_rate");

-- CreateIndex
CREATE INDEX "user_warnings_user_id_idx" ON "user_warnings"("user_id");

-- CreateIndex
CREATE INDEX "user_warnings_issued_by_idx" ON "user_warnings"("issued_by");

-- CreateIndex
CREATE INDEX "user_warnings_created_at_idx" ON "user_warnings"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_stripe_event_id_key" ON "payment_webhook_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "payment_webhook_events_event_type_idx" ON "payment_webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "payment_webhook_events_processing_status_idx" ON "payment_webhook_events"("processing_status");

-- CreateIndex
CREATE INDEX "payment_webhook_events_received_at_idx" ON "payment_webhook_events"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "course_locks_course_id_key" ON "course_locks"("course_id");

-- CreateIndex
CREATE INDEX "course_locks_course_id_idx" ON "course_locks"("course_id");

-- CreateIndex
CREATE INDEX "course_locks_locked_by_idx" ON "course_locks"("locked_by");

-- AddForeignKey
ALTER TABLE "tutor_verification_applications" ADD CONSTRAINT "tutor_verification_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_verification_applications" ADD CONSTRAINT "tutor_verification_applications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_resolver_id_fkey" FOREIGN KEY ("resolver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_messages" ADD CONSTRAINT "broadcast_messages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
