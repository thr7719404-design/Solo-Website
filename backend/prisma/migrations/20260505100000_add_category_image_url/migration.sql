-- Add a direct image URL column for categories (admin uploads)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(500);
