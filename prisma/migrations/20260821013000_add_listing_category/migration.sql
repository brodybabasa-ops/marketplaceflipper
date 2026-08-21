-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Other';

-- CreateIndex
CREATE INDEX "Listing_category_idx" ON "Listing"("category");
