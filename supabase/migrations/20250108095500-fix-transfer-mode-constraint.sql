
-- Fix the transfer_mode constraint to allow correct values
ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_transfer_mode_check;

-- Add the correct constraint with proper transfer mode values
ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_transfer_mode_check 
CHECK (transfer_mode IN ('pickup', 'delivery', 'both'));
