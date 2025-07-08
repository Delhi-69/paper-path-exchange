
-- First, let's check what values are currently allowed and fix the constraint
-- Drop the existing constraint if it exists
ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_transfer_mode_check;

-- Add the correct constraint with the right transfer mode values
ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_transfer_mode_check 
CHECK (transfer_mode IN ('pickup', 'delivery', 'both'));

-- Let's also check if there are any existing rows that might be causing issues
-- and see what transfer_mode values currently exist
DO $$
BEGIN
    -- Log current transfer_mode values to help debug
    RAISE NOTICE 'Current transfer_mode values in purchase_requests table:';
    
    -- This will show us what values are currently in the table
    FOR rec IN SELECT DISTINCT transfer_mode FROM purchase_requests LOOP
        RAISE NOTICE 'Found transfer_mode: %', rec.transfer_mode;
    END LOOP;
END $$;
