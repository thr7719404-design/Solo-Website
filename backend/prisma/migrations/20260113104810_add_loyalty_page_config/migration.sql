-- CreateTable
CREATE TABLE "public"."loyalty_page_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL,
    "ctaUrl" TEXT NOT NULL,
    "spendAedThreshold" INTEGER NOT NULL DEFAULT 1000,
    "rewardAed" INTEGER NOT NULL DEFAULT 10,
    "howItWorksJson" JSONB NOT NULL DEFAULT '[]',
    "faqsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_page_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_page_config_key_key" ON "public"."loyalty_page_config"("key");

-- CreateIndex
CREATE INDEX "loyalty_page_config_key_idx" ON "public"."loyalty_page_config"("key");
