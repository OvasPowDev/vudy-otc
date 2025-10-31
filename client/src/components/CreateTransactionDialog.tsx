import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionCreated?: (transaction: any) => void;
}

interface BankAccount {
  id: string;
  bankName: string;
  currency: string;
  accountNumber: string;
}

interface Wallet {
  id: string;
  chain: string;
  token: string;
  address: string;
  balance: string;
}

export function CreateTransactionDialog({ open, onOpenChange, onTransactionCreated }: CreateTransactionDialogProps) {
  const { t } = useLanguage();
  const [transactionType, setTransactionType] = useState<"FTC" | "CTF" | null>(null);
  
  // Mock data - simular cuentas bancarias
  const [bankAccounts] = useState<BankAccount[]>([
    { id: "1", bankName: "Nexa Banco GTQ", currency: "GTQ", accountNumber: "156416815561" },
    { id: "2", bankName: "Banco Industrial USD", currency: "USD", accountNumber: "123456789" },
  ]);
  
  // Mock data - simular wallets
  const [wallets] = useState<Wallet[]>([
    { id: "1", chain: "Polygon", token: "USDT", address: "0x216516518546461314", balance: "25,458.25" },
    { id: "2", chain: "Ethereum", token: "USDC", address: "0x987654321098765432", balance: "10,250.50" },
  ]);

  const chains = ["Polygon", "Ethereum", "Binance Smart Chain"];
  const tokens = ["USDT", "USDC", "DAI"];
  const currencies = ["GTQ", "USD", "MXN"];

  // Esquema de validación para FTC (Fiat to Crypto)
  const ftcSchema = z.object({
    bankAccount: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
    currency: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
    amount: z.string()
      .min(1, { message: t('auth.errors.fieldRequired') })
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: t('auth.errors.invalidAmount'),
      }),
    chain: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
    token: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
    walletAddress: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
  });

  // Esquema de validación para CTF (Crypto to Fiat)
  const ctfSchema = z.object({
    wallet: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
    amount: z.string()
      .min(1, { message: t('auth.errors.fieldRequired') })
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: t('auth.errors.invalidAmount'),
      }),
    bankAccount: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
  });

  const ftcForm = useForm({
    resolver: zodResolver(ftcSchema),
    mode: "onTouched",
    defaultValues: {
      bankAccount: "",
      currency: "",
      amount: "",
      chain: "",
      token: "",
      walletAddress: "",
    },
  });

  const ctfForm = useForm({
    resolver: zodResolver(ctfSchema),
    mode: "onTouched",
    defaultValues: {
      wallet: "",
      amount: "",
      bankAccount: "",
    },
  });

  const getSelectedWallet = () => {
    const walletId = ctfForm.watch("wallet");
    return wallets.find(w => w.id === walletId);
  };

  const onSubmitFTC = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('auth.errors.notAuthenticated'));
        return;
      }

      const transactionCode = `FTC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const { error } = await supabase.from('transactions').insert([{
        user_id: user.id,
        type: 'Buy' as const,
        amount_value: parseFloat(data.amount),
        amount_currency: data.currency,
        token: data.token,
        wallet_address: data.walletAddress,
        bank_account_id: data.bankAccount,
        code: transactionCode,
        direction: 'FTC',
        chain: data.chain,
        status: 'pending' as const,
      }]);

      if (error) {
        console.error('Error creating transaction:', error);
        toast.error(t('createTransaction.errorCreating'));
        return;
      }

      toast.success(t('createTransaction.successCreated'));
      
      if (onTransactionCreated) {
        onTransactionCreated({});
      }
      
      onOpenChange(false);
      ftcForm.reset();
      setTransactionType(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('createTransaction.errorCreating'));
    }
  };

  const onSubmitCTF = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('auth.errors.notAuthenticated'));
        return;
      }

      const selectedWallet = wallets.find(w => w.id === data.wallet);
      const selectedBank = bankAccounts.find(b => b.id === data.bankAccount);
      
      if (!selectedWallet || !selectedBank) {
        toast.error(t('createTransaction.errorCreating'));
        return;
      }

      const transactionCode = `CTF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const { error } = await supabase.from('transactions').insert([{
        user_id: user.id,
        type: 'Sell' as const,
        amount_value: parseFloat(data.amount),
        amount_currency: selectedBank.currency,
        token: selectedWallet.token,
        wallet_address: selectedWallet.address,
        bank_account_id: data.bankAccount,
        code: transactionCode,
        direction: 'CTF',
        chain: selectedWallet.chain,
        status: 'pending' as const,
      }]);

      if (error) {
        console.error('Error creating transaction:', error);
        toast.error(t('createTransaction.errorCreating'));
        return;
      }

      toast.success(t('createTransaction.successCreated'));
      
      if (onTransactionCreated) {
        onTransactionCreated({});
      }
      
      onOpenChange(false);
      ctfForm.reset();
      setTransactionType(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('createTransaction.errorCreating'));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTransactionType(null);
    ftcForm.reset();
    ctfForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{t('createTransaction.title')}</DialogTitle>
        </DialogHeader>

        {!transactionType ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('createTransaction.selectType')}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => setTransactionType("FTC")}
              >
                <span className="text-2xl">💵</span>
                <span className="text-sm font-semibold">FTC</span>
                <span className="text-xs text-muted-foreground">{t('createTransaction.ftcDescription')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => setTransactionType("CTF")}
              >
                <span className="text-2xl">🪙</span>
                <span className="text-sm font-semibold">CTF</span>
                <span className="text-xs text-muted-foreground">{t('createTransaction.ctfDescription')}</span>
              </Button>
            </div>
          </div>
        ) : transactionType === "FTC" ? (
          <Form {...ftcForm}>
            <form onSubmit={ftcForm.handleSubmit(onSubmitFTC)} className="space-y-4">
              <FormField
                control={ftcForm.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.fromAccount')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('createTransaction.selectAccount')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankAccounts.map(account => (
                          <SelectItem key={account.id} value={account.id} className="text-sm">
                            {account.bankName} ({account.accountNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={ftcForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.currency')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('createTransaction.selectCurrency')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={ftcForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.amount')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('createTransaction.enterAmount')}
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={ftcForm.control}
                  name="chain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {t('createTransaction.chain')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('createTransaction.selectChain')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {chains.map(chain => (
                            <SelectItem key={chain} value={chain}>{chain}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={ftcForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {t('createTransaction.token')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('createTransaction.selectToken')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tokens.map(token => (
                            <SelectItem key={token} value={token}>{token}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={ftcForm.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.walletAddress')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0x..."
                        className="h-9 font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleClose} size="sm">
                  {t('createTransaction.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={!ftcForm.formState.isValid}>
                  {t('createTransaction.create')}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...ctfForm}>
            <form onSubmit={ctfForm.handleSubmit(onSubmitCTF)} className="space-y-4">
              <FormField
                control={ctfForm.control}
                name="wallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.fromWallet')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        const wallet = wallets.find(w => w.id === value);
                        if (wallet) {
                          // Auto-populate chain and token based on selected wallet
                        }
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('createTransaction.selectChain')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.chain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select disabled value={getSelectedWallet()?.token || ""}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('createTransaction.selectToken')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={getSelectedWallet()?.token || "USDT"}>
                            {getSelectedWallet()?.token || "Token"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {getSelectedWallet() && (
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  <Input
                    value={getSelectedWallet()?.address}
                    disabled
                    className="h-8 text-xs font-mono bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('createTransaction.balance')}: {getSelectedWallet()?.token} {getSelectedWallet()?.balance}
                  </p>
                </div>
              )}

              <FormField
                control={ctfForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.amount')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('createTransaction.enterAmount')}
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={ctfForm.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.toAccount')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('createTransaction.selectAccount')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankAccounts.map(account => (
                          <SelectItem key={account.id} value={account.id} className="text-sm">
                            {account.bankName} ({account.accountNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleClose} size="sm">
                  {t('createTransaction.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={!ctfForm.formState.isValid}>
                  {t('createTransaction.create')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
