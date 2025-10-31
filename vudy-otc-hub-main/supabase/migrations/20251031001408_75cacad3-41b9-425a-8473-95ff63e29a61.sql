
-- Add accepted_by_user_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS accepted_by_user_id UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_accepted_by_user_id 
ON transactions(accepted_by_user_id);
