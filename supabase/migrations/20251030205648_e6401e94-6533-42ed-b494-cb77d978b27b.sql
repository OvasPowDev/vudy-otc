-- Create enum for transaction type
CREATE TYPE public.transaction_type AS ENUM ('Buy', 'Sell');

-- Create enum for transaction status
CREATE TYPE public.transaction_status AS ENUM ('pending', 'offer_made', 'escrow_created', 'completed');

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  offered_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  type transaction_type NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('CTF', 'FTC')),
  chain TEXT NOT NULL,
  token TEXT NOT NULL,
  amount_value DECIMAL(20, 2) NOT NULL,
  amount_currency TEXT NOT NULL DEFAULT 'USD',
  bank_account_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_code ON public.transactions(code);
CREATE INDEX idx_transactions_chain ON public.transactions(chain);
CREATE INDEX idx_transactions_token ON public.transactions(token);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.transactions IS 'Tabla de transacciones CTF/FTC con estados y fechas de ciclo de vida';