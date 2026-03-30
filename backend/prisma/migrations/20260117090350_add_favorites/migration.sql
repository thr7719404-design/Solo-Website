-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "public"."favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_productId_idx" ON "public"."favorites"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_productId_key" ON "public"."favorites"("userId", "productId");

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
