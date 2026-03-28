-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('free', 'basic', 'pro');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'banned', 'suspended');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "LessonLevel" AS ENUM ('Beginner', 'Intermediate', 'Advanced');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('subscription', 'sheet_purchase', 'credits');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('manual', 'credit_card', 'momo', 'zalopay');

-- CreateEnum
CREATE TYPE "AIGradingStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "PracticeSessionStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "account_type" "AccountType" NOT NULL DEFAULT 'free',
    "account_status" "AccountStatus" NOT NULL DEFAULT 'active',
    "premium_started_at" TIMESTAMP(3),
    "premium_expires_at" TIMESTAMP(3),
    "ban_reason" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "lessons_completed" INTEGER NOT NULL DEFAULT 0,
    "total_practice_minutes" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "english_name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "emoji" TEXT,
    "color" TEXT,
    "bg_gradient" TEXT,
    "image" TEXT,
    "short_desc" TEXT,
    "description" TEXT,
    "origin" TEXT,
    "material" TEXT,
    "sound_range" TEXT,
    "difficulty" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "facts" JSONB,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "instrument_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "level" "LessonLevel" NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'draft',
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "youtube_embed_url" TEXT,
    "video_thumb" TEXT,
    "description" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 100,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "steps" JSONB,
    "tips" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetMusic" (
    "id" TEXT NOT NULL,
    "instrument_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "composer" TEXT,
    "genre" TEXT,
    "level" "LessonLevel",
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "file_path" TEXT NOT NULL,
    "preview_url" TEXT,
    "pages" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "SheetMusic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sheet_music_id" TEXT NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PremiumSubscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_type" "AccountType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "PaymentMethod" NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGradingSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "file_path" TEXT NOT NULL,
    "status" "AIGradingStatus" NOT NULL DEFAULT 'pending',
    "ai_score" INTEGER,
    "criteria_scores" JSONB,
    "ai_feedback" TEXT,
    "improvement_suggestions" JSONB,
    "error_message" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "AIGradingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "instrument_id" TEXT,
    "status" "PracticeSessionStatus" NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "xp_earned" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActivityLog" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_account_type_idx" ON "User"("account_type");

-- CreateIndex
CREATE INDEX "User_account_status_idx" ON "User"("account_status");

-- CreateIndex
CREATE INDEX "User_premium_expires_at_idx" ON "User"("premium_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_user_id_key" ON "UserStats"("user_id");

-- CreateIndex
CREATE INDEX "UserStats_user_id_idx" ON "UserStats"("user_id");

-- CreateIndex
CREATE INDEX "UserStats_level_idx" ON "UserStats"("level");

-- CreateIndex
CREATE INDEX "Instrument_order_index_idx" ON "Instrument"("order_index");

-- CreateIndex
CREATE INDEX "Lesson_instrument_id_idx" ON "Lesson"("instrument_id");

-- CreateIndex
CREATE INDEX "Lesson_level_idx" ON "Lesson"("level");

-- CreateIndex
CREATE INDEX "Lesson_status_idx" ON "Lesson"("status");

-- CreateIndex
CREATE INDEX "Lesson_is_premium_idx" ON "Lesson"("is_premium");

-- CreateIndex
CREATE INDEX "Lesson_order_index_idx" ON "Lesson"("order_index");

-- CreateIndex
CREATE INDEX "UserProgress_user_id_idx" ON "UserProgress"("user_id");

-- CreateIndex
CREATE INDEX "UserProgress_lesson_id_idx" ON "UserProgress"("lesson_id");

-- CreateIndex
CREATE INDEX "UserProgress_completed_idx" ON "UserProgress"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_user_id_lesson_id_key" ON "UserProgress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "SheetMusic_instrument_id_idx" ON "SheetMusic"("instrument_id");

-- CreateIndex
CREATE INDEX "SheetMusic_is_premium_idx" ON "SheetMusic"("is_premium");

-- CreateIndex
CREATE INDEX "SheetMusic_level_idx" ON "SheetMusic"("level");

-- CreateIndex
CREATE INDEX "UserPurchase_user_id_idx" ON "UserPurchase"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_user_id_sheet_music_id_key" ON "UserPurchase"("user_id", "sheet_music_id");

-- CreateIndex
CREATE INDEX "PremiumSubscription_user_id_idx" ON "PremiumSubscription"("user_id");

-- CreateIndex
CREATE INDEX "PremiumSubscription_status_idx" ON "PremiumSubscription"("status");

-- CreateIndex
CREATE INDEX "PremiumSubscription_expires_at_idx" ON "PremiumSubscription"("expires_at");

-- CreateIndex
CREATE INDEX "PaymentTransaction_user_id_idx" ON "PaymentTransaction"("user_id");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_created_at_idx" ON "PaymentTransaction"("created_at");

-- CreateIndex
CREATE INDEX "AIGradingSession_user_id_idx" ON "AIGradingSession"("user_id");

-- CreateIndex
CREATE INDEX "AIGradingSession_status_idx" ON "AIGradingSession"("status");

-- CreateIndex
CREATE INDEX "AIGradingSession_submitted_at_idx" ON "AIGradingSession"("submitted_at");

-- CreateIndex
CREATE INDEX "PracticeSession_user_id_idx" ON "PracticeSession"("user_id");

-- CreateIndex
CREATE INDEX "PracticeSession_status_idx" ON "PracticeSession"("status");

-- CreateIndex
CREATE INDEX "PracticeSession_started_at_idx" ON "PracticeSession"("started_at");

-- CreateIndex
CREATE INDEX "AdminActivityLog_admin_id_idx" ON "AdminActivityLog"("admin_id");

-- CreateIndex
CREATE INDEX "AdminActivityLog_action_idx" ON "AdminActivityLog"("action");

-- CreateIndex
CREATE INDEX "AdminActivityLog_resource_type_idx" ON "AdminActivityLog"("resource_type");

-- CreateIndex
CREATE INDEX "AdminActivityLog_created_at_idx" ON "AdminActivityLog"("created_at");

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetMusic" ADD CONSTRAINT "SheetMusic_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_sheet_music_id_fkey" FOREIGN KEY ("sheet_music_id") REFERENCES "SheetMusic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumSubscription" ADD CONSTRAINT "PremiumSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGradingSession" ADD CONSTRAINT "AIGradingSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGradingSession" ADD CONSTRAINT "AIGradingSession_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_instrument_id_fkey" FOREIGN KEY ("instrument_id") REFERENCES "Instrument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
