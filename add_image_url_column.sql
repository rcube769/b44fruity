-- Add image_url column to listings table
-- This migration adds support for storing fruit images

-- Add the image_url column (nullable, as existing listings won't have it)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN listings.image_url IS 'Public URL of the fruit image stored in Supabase Storage';
