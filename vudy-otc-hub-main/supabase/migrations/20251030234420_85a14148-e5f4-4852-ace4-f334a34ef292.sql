-- Create wallets table for storing user wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, address, chain)
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallets
CREATE POLICY "Users can view their own wallets"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallets"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
ON public.wallets FOR DELETE
USING (auth.uid() = user_id);

-- Create otc_offers table
CREATE TABLE IF NOT EXISTS public.otc_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_value NUMERIC(18,6) NOT NULL CHECK (amount_value > 0),
  amount_currency TEXT NOT NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE RESTRICT,
  eta_minutes INTEGER NOT NULL CHECK (eta_minutes BETWEEN 1 AND 2880),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_offer_once_per_user_tx UNIQUE (transaction_id, user_id)
);

-- Enable RLS on otc_offers
ALTER TABLE public.otc_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for otc_offers
CREATE POLICY "Users can view offers on their transactions"
ON public.otc_offers FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.transactions WHERE id = transaction_id
  ) OR auth.uid() = user_id
);

CREATE POLICY "Users can create offers"
ON public.otc_offers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers"
ON public.otc_offers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers"
ON public.otc_offers FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_offers_transaction ON public.otc_offers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_offers_user ON public.otc_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);

-- Create trigger for updated_at on wallets
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on otc_offers
CREATE TRIGGER update_otc_offers_updated_at
BEFORE UPDATE ON public.otc_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();