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
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
  name: string;
  chain: string;
  address: string;
}

export function CreateTransactionDialog({ open, onOpenChange, onTransactionCreated }: CreateTransactionDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [transactionType, setTransactionType] = useState<"FTC" | "CTF" | null>(null);

  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ['/api/bank-accounts', { userId: user?.id }],
    enabled: !!user && open,
  });

  // Fetch wallets
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets', { userId: user?.id }],
    enabled: !!user && open,
  });

  const chains = ["Polygon", "Ethereum", "Binance Smart Chain", "Avalanche"];
  const tokens = ["USDT", "USDC", "DAI"];
  const currencies = ["GTQ", "USD", "MXN"];

  // FTC Schema (Fiat to Crypto)
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

  // CTF Schema (Crypto to Fiat)
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

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('/api/transactions', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast.success(t('createTransaction.successCreated'));
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      if (onTransactionCreated) {
        onTransactionCreated({});
      }
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error creating transaction:', error);
      toast.error(t('createTransaction.errorCreating'));
    },
  });

  const onSubmitFTC = async (data: any) => {
    if (!user) {
      toast.error(t('auth.errors.notAuthenticated'));
      return;
    }

    const transactionCode = `FTC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    await createTransactionMutation.mutateAsync({
      userId: user.id,
      type: 'buy',
      amountValue: parseFloat(data.amount),
      amountCurrency: data.currency,
      token: data.token,
      walletAddress: data.walletAddress,
      bankAccountId: data.bankAccount,
      code: transactionCode,
      direction: 'FTC',
      chain: data.chain,
      status: 'pending',
    });
  };

  const onSubmitCTF = async (data: any) => {
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

    await createTransactionMutation.mutateAsync({
      userId: user.id,
      type: 'sell',
      amountValue: parseFloat(data.amount),
      amountCurrency: selectedBank.currency,
      token: 'USDT', // Default token, can be customized
      walletAddress: selectedWallet.address,
      bankAccountId: data.bankAccount,
      code: transactionCode,
      direction: 'CTF',
      chain: selectedWallet.chain,
      status: 'pending',
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTransactionType(null);
    ftcForm.reset();
    ctfForm.reset();
  };

  const getSelectedWallet = () => {
    const walletId = ctfForm.watch("wallet");
    return wallets.find(w => w.id === walletId);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="dialog-create-transaction">
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
                data-testid="button-select-ftc"
              >
                <span className="text-2xl">💵</span>
                <span className="text-sm font-semibold">FTC</span>
                <span className="text-xs text-muted-foreground">{t('createTransaction.ftcDescription')}</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => setTransactionType("CTF")}
                data-testid="button-select-ctf"
              >
                <span className="text-2xl">🪙</span>
                <span className="text-sm font-semibold">CTF</span>
                <span className="text-xs text-muted-foreground">{t('createTransaction.ctfDescription')}</span>
              </Button>
            </div>
          </div>
        ) : transactionType === "FTC" ? (
          <Form {...ftcForm}>
            <form onSubmit={ftcForm.handleSubmit(onSubmitFTC)} className="space-y-4" data-testid="form-ftc">
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
                        <SelectTrigger className="h-9" data-testid="select-bank-account">
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
                        <SelectTrigger className="h-9" data-testid="select-currency">
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
                        data-testid="input-amount"
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
                          <SelectTrigger className="h-9" data-testid="select-chain">
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
                          <SelectTrigger className="h-9" data-testid="select-token">
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
                        data-testid="input-wallet-address"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleClose} size="sm" data-testid="button-cancel">
                  {t('createTransaction.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={!ftcForm.formState.isValid || createTransactionMutation.isPending} data-testid="button-submit">
                  {createTransactionMutation.isPending ? t('auth.loading') : t('createTransaction.create')}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...ctfForm}>
            <form onSubmit={ctfForm.handleSubmit(onSubmitCTF)} className="space-y-4" data-testid="form-ctf">
              <FormField
                control={ctfForm.control}
                name="wallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.fromWallet')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9" data-testid="select-wallet">
                          <SelectValue placeholder={t('createTransaction.selectWallet')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map(wallet => (
                          <SelectItem key={wallet.id} value={wallet.id} className="text-sm">
                            {wallet.name} ({wallet.chain})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {getSelectedWallet() && (
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('createTransaction.chain')}:</span>
                    <span className="font-medium">{getSelectedWallet()?.chain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('createTransaction.address')}:</span>
                    <span className="font-mono text-xs">{getSelectedWallet()?.address.substring(0, 10)}...</span>
                  </div>
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
                        data-testid="input-amount"
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
                        <SelectTrigger className="h-9" data-testid="select-bank-account">
                          <SelectValue placeholder={t('createTransaction.selectAccount')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankAccounts.map(account => (
                          <SelectItem key={account.id} value={account.id} className="text-sm">
                            {account.bankName} ({account.currency})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleClose} size="sm" data-testid="button-cancel">
                  {t('createTransaction.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={!ctfForm.formState.isValid || createTransactionMutation.isPending} data-testid="button-submit">
                  {createTransactionMutation.isPending ? t('auth.loading') : t('createTransaction.create')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
