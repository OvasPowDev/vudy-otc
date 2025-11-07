import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useNavigate } from "react-router-dom";

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionCreated?: (transaction: any) => void;
}

// Datos de prueba predefinidos
const TEST_DATA = {
  bankAccount: {
    id: "test-bank-001",
    name: "Banco de Prueba - USD",
    currency: "USD"
  },
  wallet: {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    chain: "Polygon"
  },
  token: "USDT"
};

export function CreateTransactionDialog({ open, onOpenChange, onTransactionCreated }: CreateTransactionDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState<"FTC" | "CTF" | null>(null);

  // Schema simplificado - solo monto
  const transactionSchema = z.object({
    amount: z.string()
      .min(1, { message: t('auth.errors.fieldRequired') })
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: t('auth.errors.invalidAmount'),
      }),
  });

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    mode: "onTouched",
    defaultValues: {
      amount: "",
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
      // Redirigir al dashboard después de crear la transacción
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Error creating transaction:', error);
      toast.error(t('createTransaction.errorCreating'));
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) {
      toast.error(t('auth.errors.notAuthenticated'));
      return;
    }

    const isFTC = transactionType === "FTC";
    const transactionCode = `${transactionType}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    await createTransactionMutation.mutateAsync({
      userId: user.id,
      type: isFTC ? 'buy' : 'sell',
      amountValue: data.amount.toString(),
      amountCurrency: TEST_DATA.bankAccount.currency,
      token: TEST_DATA.token,
      walletAddress: TEST_DATA.wallet.address,
      bankAccountId: TEST_DATA.bankAccount.id,
      code: transactionCode,
      direction: transactionType,
      chain: TEST_DATA.wallet.chain,
      status: 'pending',
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTransactionType(null);
    form.reset();
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
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-transaction">
              
              {/* Información de la transacción */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('createTransaction.type')}:</span>
                  <span className="text-sm font-bold">{transactionType === "FTC" ? t('createTransaction.fiatToCrypto') : t('createTransaction.cryptoToFiat')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('createTransaction.account')}:</span>
                  <span className="text-sm">{TEST_DATA.bankAccount.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('createTransaction.token')}:</span>
                  <span className="text-sm font-medium">{TEST_DATA.token} ({TEST_DATA.wallet.chain})</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('createTransaction.wallet')}:</span>
                  <span className="text-xs font-mono">{TEST_DATA.wallet.address.substring(0, 10)}...{TEST_DATA.wallet.address.substring(38)}</span>
                </div>
              </div>

              {/* Campo de monto */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('createTransaction.amount')} ({transactionType === "FTC" ? TEST_DATA.bankAccount.currency : TEST_DATA.token}) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={transactionType === "FTC" 
                          ? `${t('createTransaction.enterAmount')} en ${TEST_DATA.bankAccount.currency}` 
                          : `${t('createTransaction.enterAmount')} en ${TEST_DATA.token}`
                        }
                        className="h-10 text-lg"
                        {...field}
                        data-testid="input-amount"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose} 
                  size="sm" 
                  data-testid="button-cancel"
                >
                  {t('createTransaction.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!form.formState.isValid || createTransactionMutation.isPending} 
                  data-testid="button-submit"
                >
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
