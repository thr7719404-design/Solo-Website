-- Add direct image URL column for subcategories (used for stylish admin tiles)
ALTER TABLE "subcategories" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(500);
