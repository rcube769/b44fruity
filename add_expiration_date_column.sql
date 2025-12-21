-- Add expiration_date column to listings table
-- This migration adds support for automatic expiration based on ML prediction

-- Add the expiration_date column (nullable, as existing listings won't have it)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;

-- Add a comment to document the column
COMMENT ON COLUMN listings.expiration_date IS 'Predicted expiration date for the fruit, calculated from ML model prediction';

-- Optional: Create an index for faster queries when filtering by expiration date
CREATE INDEX IF NOT EXISTS idx_listings_expiration_date ON listings(expiration_date);

-- Optional: Create a function to automatically cancel expired listings
CREATE OR REPLACE FUNCTION cancel_expired_listings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE listings
  SET status = 'cancelled'
  WHERE status = 'active'
    AND expiration_date IS NOT NULL
    AND expiration_date < NOW();
END;
$$;

-- Optional: You can set up a cron job in Supabase to run this function periodically
-- Example: Run every hour to check for expired listings
-- SELECT cron.schedule('cancel-expired-listings', '0 * * * *', 'SELECT cancel_expired_listings();');
