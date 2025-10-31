-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

-- Create new SELECT policies
-- 1. Users can always view their own transactions (all statuses)
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- 2. All authenticated users can view pending transactions from any user
CREATE POLICY "Users can view all pending transactions"
ON public.transactions
FOR SELECT
USING (
  status = 'pending'
  AND auth.uid() IS NOT NULL
);