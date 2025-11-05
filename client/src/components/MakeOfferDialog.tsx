import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    transactionId?: string;
    type: "BUY" | "SELL";
    token: string;
    amount: string;
    userName?: string;
    senderWallet?: string;
  };
  onOfferCreated?: () => void;
}

interface Wallet {
  id: string;
  name: string;
  address: string;
  chain: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  currency: string;
  accountNumber: string;
  countryCode: string;
  countryName: string;
}

export function MakeOfferDialog({ open, onOpenChange, request, onOfferCreated }: MakeOfferDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Fetch wallets
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: [`/api/wallets?userId=${user?.id}`],
    enabled: !!user && open,
  });

  // Fetch bank accounts
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: [`/api/bank-accounts?userId=${user?.id}`],
    enabled: !!user && open,
  });

  // Determine if FTC or CTF
  const isFTC = request.type === "BUY";
  const transactionCode = isFTC ? "FTC" : "CTF";

  // Extract currency from token
  const getCurrency = () => {
    const tokenParts = request.token.split('/');
    if (tokenParts.length === 2) {
      const currency = tokenParts[1];
      const currencySymbols: { [key: string]: string } = {
        'GTQ': 'Q',
        'USD': '$',
        'MXN': '$',
      };
      return { code: currency, symbol: currencySymbols[currency] || currency };
    }
    return { code: 'GTQ', symbol: 'Q' };
  };

  const currency = getCurrency();

  // Calculate fee (0.50%)
  const amount = parseFloat(request.amount) || 0;
  const fee = amount * 0.005;
  const totalAmount = amount + fee;

  // Form schema
  const formSchema = z.object({
    offerAmount: z.string()
      .min(1, { message: t('auth.errors.fieldRequired') })
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: t('auth.errors.invalidAmount'),
      }),
    etaMinutes: z.string()
      .min(1, { message: t('auth.errors.fieldRequired') })
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Tiempo de atención inválido',
      }),
    selectedBank: z.string().optional(),
    selectedWallet: z.string().optional(),
    notes: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      offerAmount: "",
      etaMinutes: "30",
      selectedBank: "",
      selectedWallet: "",
      notes: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const handleDownloadKyc = () => {
    console.log("Downloading KYC...");
    toast.info("Funcionalidad de descarga KYC próximamente");
  };

  // Create offer mutation
  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      // Find transaction by code if transactionId not provided
      let txId = request.transactionId;
      if (!txId) {
        // Fetch all transactions to find by code (not filtered by user)
        const transactions: any[] = await apiRequest(`/api/transactions`);
        const tx = transactions.find((t: any) => t.code === request.id || t.id === request.id);
        if (!tx) {
          throw new Error('Transacción no encontrada');
        }
        txId = tx.id;
      }

      // Check if user already made an offer
      const existingOffers: any[] = await apiRequest(`/api/offers/transaction/${txId}`);
      const userOffer = existingOffers.find((o: any) => o.userId === user?.id);
      
      if (userOffer) {
        throw new Error('Ya enviaste una oferta para esta transacción');
      }

      // Create offer
      await apiRequest('/api/offers', {
        method: 'POST',
        data: {
          transactionId: txId,
          userId: user?.id,
          amountValue: parseFloat(data.offerAmount),
          amountCurrency: currency.code,
          bankAccountId: data.selectedBank || null,
          walletId: data.selectedWallet || null,
          etaMinutes: parseInt(data.etaMinutes),
          notes: data.notes || null,
          status: 'pending',
        },
      });
    },
    onSuccess: () => {
      toast.success('Oferta creada correctamente');
      // Invalidate all queries that could be affected
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      if (onOfferCreated) {
        onOfferCreated();
      }
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Error creating offer:', error);
      toast.error(error.message || 'Error al crear la oferta');
    },
  });

  const onSubmit = async (data: any) => {
    // Validate that wallet or bank is selected based on transaction type
    if (isFTC && !data.selectedBank) {
      toast.error('Selecciona una cuenta bancaria');
      return;
    }
    if (!isFTC && !data.selectedWallet) {
      toast.error('Selecciona una wallet');
      return;
    }

    await createOfferMutation.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-make-offer">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">{t('makeOffer.title')}</DialogTitle>
            <Badge variant={request.type === "BUY" ? "default" : "secondary"} className="text-xs">
              {transactionCode}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction details */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{request.userName || "Usuario Ejemplo"}</h3>
                <Badge variant="secondary" className="text-xs">{request.type}</Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadKyc}
                className="gap-1 h-8"
                data-testid="button-download-kyc"
              >
                <Download className="h-3 w-3" />
                <span className="text-xs">{t('makeOffer.downloadKyc')}</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('makeOffer.amount')}</p>
                <p className="font-medium">{request.amount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('makeOffer.vudyFee')}</p>
                <p className="font-medium">{fee.toFixed(2)} USDT</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('makeOffer.totalAmount')}</p>
                <p className="font-semibold text-primary">{totalAmount.toFixed(2)} USDT</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground">{t('makeOffer.senderWallet')}</p>
                <p className="font-mono text-xs break-all">{request.senderWallet || (wallets[0]?.address ?? '—')}</p>
              </div>
            </div>
          </div>

          {/* Offer form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-make-offer">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="offerAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {t('makeOffer.offerAmount')} ({currency.symbol}) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="h-9"
                          {...field}
                          data-testid="input-offer-amount"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="etaMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {t('makeOffer.etaMinutes')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9" data-testid="select-eta">
                            <SelectValue placeholder="30" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="60">60</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {isFTC ? (
                <FormField
                  control={form.control}
                  name="selectedBank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {t('makeOffer.bankAccount')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9" data-testid="select-bank">
                            <SelectValue placeholder={t('makeOffer.selectBank')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No hay cuentas bancarias. Agrega una desde tu perfil.
                            </div>
                          ) : (
                            bankAccounts.map(account => (
                              <SelectItem key={account.id} value={account.id} className="text-sm">
                                {account.bankName} - {account.accountNumber} ({account.currency})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="selectedWallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {t('makeOffer.wallet')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9" data-testid="select-wallet">
                            <SelectValue placeholder={t('makeOffer.selectWallet')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No hay wallets. Agrega una desde tu perfil.
                            </div>
                          ) : (
                            wallets.map(wallet => (
                              <SelectItem key={wallet.id} value={wallet.id} className="text-sm">
                                {wallet.name} ({wallet.chain})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t('makeOffer.notes')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('makeOffer.notesPlaceholder')}
                        className="min-h-[80px] resize-none"
                        {...field}
                        data-testid="input-notes"
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
                  onClick={() => onOpenChange(false)} 
                  size="sm"
                  data-testid="button-cancel"
                >
                  {t('makeOffer.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={createOfferMutation.isPending}
                  data-testid="button-submit"
                >
                  {createOfferMutation.isPending ? t('auth.loading') : t('makeOffer.submit')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
