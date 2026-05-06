-- Adds a direct logo URL column to brands so admins can paste or upload a logo
-- without needing the media_assets join (logo_id remains for legacy compatibility).
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "logo_url" VARCHAR(500);
