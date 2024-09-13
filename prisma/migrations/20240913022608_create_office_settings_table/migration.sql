-- CreateTable
CREATE TABLE "OfficeSettings" (
    "settings_id" TEXT NOT NULL,
    "office_start_time" TIMESTAMP(3) NOT NULL,
    "office_end_time" TIMESTAMP(3) NOT NULL,
    "office_location" TEXT NOT NULL,
    "monthly_recap_day" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeSettings_pkey" PRIMARY KEY ("settings_id")
);
