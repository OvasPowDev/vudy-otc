import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string; // Este es el código legible (REQ-XXXX)
    transactionId?: string; // UUID real de la transacción en la BD
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
  bank_name: string;
  currency: string;
  account_number: string;
  country_code: string;
  country_name: string;
}

export function MakeOfferDialog({ open, onOpenChange, request, onOfferCreated }: MakeOfferDialogProps) {
  const { t } = useLanguage();
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [userWallets, setUserWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBank, setNewBank] = useState({ 
    bank_name: "", 
    currency: "GTQ", 
    account_number: "", 
    country_code: "GT", 
    country_name: "Guatemala" 
  });
  const [newWallet, setNewWallet] = useState({
    name: "",
    address: "",
    chain: "Polygon"
  });
  
  const countries = [
    { code: "GT", name: "Guatemala", flag: "🇬🇹", currencies: ["GTQ", "USD"] },
    { code: "MX", name: "México", flag: "🇲🇽", currencies: ["MXN", "USD"] },
    { code: "US", name: "Estados Unidos", flag: "🇺🇸", currencies: ["USD"] },
    { code: "SV", name: "El Salvador", flag: "🇸🇻", currencies: ["USD"] },
    { code: "HN", name: "Honduras", flag: "🇭🇳", currencies: ["HNL", "USD"] },
    { code: "CR", name: "Costa Rica", flag: "🇨🇷", currencies: ["CRC", "USD"] },
    { code: "PA", name: "Panamá", flag: "🇵🇦", currencies: ["PAB", "USD"] },
    { code: "CO", name: "Colombia", flag: "🇨🇴", currencies: ["COP", "USD"] },
    { code: "PE", name: "Perú", flag: "🇵🇪", currencies: ["PEN", "USD"] },
    { code: "AR", name: "Argentina", flag: "🇦🇷", currencies: ["ARS", "USD"] },
  ];
  
  // Determinar si es FTC (usuario quiere comprar crypto = type BUY) o CTF (usuario quiere vender crypto = type SELL)
  const isFTC = request.type === "BUY"; // FTC: Fiat to Crypto (usuario tiene fiat, quiere crypto)
  const transactionCode = isFTC ? "FTC" : "CTF";
  
  // Extraer la moneda fiat del token (ej: "USDT/GTQ" -> "GTQ", "USDT/USD" -> "USD")
  const getCurrency = () => {
    const tokenParts = request.token.split('/');
    if (tokenParts.length === 2) {
      const currency = tokenParts[1];
      // Mapear las monedas a sus símbolos
      const currencySymbols: { [key: string]: string } = {
        'GTQ': 'Q',
        'USD': '$',
        'MXN': '$',
        'HNL': 'L',
        'CRC': '₡',
        'PAB': 'B/.',
        'COP': '$',
        'PEN': 'S/',
        'ARS': '$',
      };
      return { code: currency, symbol: currencySymbols[currency] || currency };
    }
    return { code: 'GTQ', symbol: 'Q' };
  };
  
  const currency = getCurrency();
  
  // Calcular fee (0.50%)
  const amount = parseFloat(request.amount) || 0;
  const fee = amount * 0.005;
  const totalAmount = amount + fee;

  // Load user's wallets and bank accounts
  useEffect(() => {
    if (open) {
      loadUserData();
    }
  }, [open]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);

      if (walletsError) throw walletsError;
      setUserWallets(walletsData || []);

      // Load bank accounts
      const { data: banksData, error: banksError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (banksError) throw banksError;
      setBankAccounts(banksData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar tus datos');
    }
  };

  // Esquema de validación
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

  const handleDownloadKyc = () => {
    console.log("Downloading KYC...");
  };

  const handleAddBank = async () => {
    if (!newBank.bank_name || !newBank.account_number || !newBank.country_code) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          bank_name: newBank.bank_name,
          account_number: newBank.account_number,
          currency: newBank.currency,
          country_code: newBank.country_code,
          country_name: newBank.country_name,
        })
        .select()
        .single();

      if (error) throw error;

      setBankAccounts([...bankAccounts, data]);
      setNewBank({ 
        bank_name: "", 
        currency: "GTQ", 
        account_number: "", 
        country_code: "GT", 
        country_name: "Guatemala" 
      });
      setShowAddBank(false);
      toast.success('Cuenta bancaria agregada');
    } catch (error) {
      console.error('Error adding bank:', error);
      toast.error('Error al agregar cuenta bancaria');
    }
  };

  const handleAddWallet = async () => {
    if (!newWallet.name || !newWallet.address || !newWallet.chain) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          name: newWallet.name,
          address: newWallet.address,
          chain: newWallet.chain,
        })
        .select()
        .single();

      if (error) throw error;

      setUserWallets([...userWallets, data]);
      setNewWallet({ name: "", address: "", chain: "Polygon" });
      setShowAddWallet(false);
      toast.success('Wallet agregada');
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast.error('Error al agregar wallet');
    }
  };
  
  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setNewBank({
        ...newBank, 
        country_code: countryCode, 
        country_name: country.name,
        currency: country.currencies[0]
      });
    }
  };
  
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

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Get the real transaction UUID if not provided
      let txId = request.transactionId;
      if (!txId) {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('id')
          .eq('code', request.id)
          .single();

        if (txError || !txData) {
          toast.error('No se encontró la transacción');
          setLoading(false);
          return;
        }
        txId = txData.id;
      }

      // Check if user already made an offer
      const { data: existingOffer } = await supabase
        .from('otc_offers')
        .select('id')
        .eq('transaction_id', txId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingOffer) {
        toast.info('Ya enviaste una oferta para esta transacción');
        setLoading(false);
        return;
      }

      // Create offer
      const { error: offerError } = await supabase
        .from('otc_offers')
        .insert({
          transaction_id: txId,
          user_id: user.id,
          amount_value: parseFloat(data.offerAmount),
          amount_currency: currency.code,
          bank_account_id: data.selectedBank || null,
          wallet_id: data.selectedWallet || null,
          eta_minutes: parseInt(data.etaMinutes),
          notes: data.notes || null,
          status: 'pending',
        });

      if (offerError) throw offerError;

      toast.success('Oferta creada correctamente');
      
      if (onOfferCreated) {
        onOfferCreated();
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error('Error al crear la oferta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">{t('makeOffer.title')}</DialogTitle>
            <Badge variant={request.type === "BUY" ? "default" : "secondary"} className="text-xs">
              {transactionCode}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Detalles de la solicitud - Layout compacto */}
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
                <p className="font-mono text-xs break-all">{request.senderWallet || (userWallets[0]?.address ?? '—')}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Tu oferta - Layout en grid de 2 columnas */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="offerAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        {t('makeOffer.offerAmount')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={`${t('makeOffer.enterAmountIn')} ${currency.symbol}`}
                          className="mt-1 h-9"
                          {...field}
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
                        Tiempo de atención (minutos) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="2880"
                          placeholder="Ej. 30"
                          className="mt-1 h-9"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Si es FTC: usuario tiene fiat y quiere crypto */}
                {isFTC && (
                  <>
                    <FormField
                      control={form.control}
                      name="selectedBank"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel className="text-sm">
                              {t('makeOffer.bankAccount')} <span className="text-destructive">*</span>
                            </FormLabel>
                            {!showAddBank && (
                              <Button 
                                type="button"
                                variant="link" 
                                className="text-primary p-0 h-auto text-xs"
                                onClick={() => setShowAddBank(true)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar
                              </Button>
                            )}
                          </div>
                          
                          {showAddBank ? (
                            <div className="bg-muted p-2 rounded-lg space-y-2">
                              <Select value={newBank.country_code} onValueChange={handleCountryChange}>
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="País" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.map(country => (
                                    <SelectItem key={country.code} value={country.code} className="text-sm">
                                      <span className="flex items-center gap-2">
                                        <span>{country.flag}</span>
                                        <span>{country.name}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder={t('makeOffer.addBank.bankName')}
                                value={newBank.bank_name}
                                onChange={(e) => setNewBank({...newBank, bank_name: e.target.value})}
                                className="h-8 text-sm"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Select value={newBank.currency} onValueChange={(val) => setNewBank({...newBank, currency: val})}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Moneda" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {countries.find(c => c.code === newBank.country_code)?.currencies.map(curr => (
                                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="# Cuenta"
                                  value={newBank.account_number}
                                  onChange={(e) => setNewBank({...newBank, account_number: e.target.value})}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" size="sm" onClick={handleAddBank} className="h-7 text-xs">Agregar</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddBank(false)} className="h-7 text-xs">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Seleccionar cuenta" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bankAccounts.map(account => (
                                    <SelectItem key={account.id} value={account.id} className="text-sm">
                                      <span className="flex items-center gap-2">
                                        <span>{account.bank_name}</span>
                                        <span className="text-muted-foreground">• {account.currency}</span>
                                        <span className="text-muted-foreground">• {account.account_number}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t('makeOffer.receiveFunds')}
                              </p>
                            </>
                          )}
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="selectedWallet"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel className="text-sm">
                              {t('makeOffer.wallet')} <span className="text-destructive">*</span>
                            </FormLabel>
                            {!showAddWallet && (
                              <Button 
                                type="button"
                                variant="link" 
                                className="text-primary p-0 h-auto text-xs"
                                onClick={() => setShowAddWallet(true)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar
                              </Button>
                            )}
                          </div>
                          
                          {showAddWallet ? (
                            <div className="bg-muted p-2 rounded-lg space-y-2">
                              <Input
                                placeholder="Nombre de wallet"
                                value={newWallet.name}
                                onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
                                className="h-8 text-sm"
                              />
                              <Input
                                placeholder="Dirección (0x...)"
                                value={newWallet.address}
                                onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
                                className="h-8 text-sm"
                              />
                              <Select value={newWallet.chain} onValueChange={(val) => setNewWallet({...newWallet, chain: val})}>
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Cadena" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Polygon">Polygon</SelectItem>
                                  <SelectItem value="Ethereum">Ethereum</SelectItem>
                                  <SelectItem value="BSC">BSC</SelectItem>
                                  <SelectItem value="Avalanche">Avalanche</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                                <Button type="button" size="sm" onClick={handleAddWallet} className="h-7 text-xs">Agregar</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddWallet(false)} className="h-7 text-xs">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Seleccionar wallet" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {userWallets.length > 0 ? (
                                    userWallets.map(wallet => (
                                      <SelectItem key={wallet.id} value={wallet.id} className="text-sm">
                                        {wallet.name} - {wallet.address?.slice(0, 6) || '0x'}...{wallet.address?.slice(-4) || '0000'}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="no-wallet" disabled>
                                      No hay wallets disponibles
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t('makeOffer.receiveWallet')}
                              </p>
                            </>
                          )}
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Si es CTF: usuario tiene crypto y quiere fiat */}
                {!isFTC && (
                  <>
                    <FormField
                      control={form.control}
                      name="selectedWallet"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel className="text-sm">
                              {t('makeOffer.wallet')} <span className="text-destructive">*</span>
                            </FormLabel>
                            {!showAddWallet && (
                              <Button 
                                type="button"
                                variant="link" 
                                className="text-primary p-0 h-auto text-xs"
                                onClick={() => setShowAddWallet(true)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar
                              </Button>
                            )}
                          </div>
                          
                          {showAddWallet ? (
                            <div className="bg-muted p-2 rounded-lg space-y-2">
                              <Input
                                placeholder="Nombre de wallet"
                                value={newWallet.name}
                                onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
                                className="h-8 text-sm"
                              />
                              <Input
                                placeholder="Dirección (0x...)"
                                value={newWallet.address}
                                onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
                                className="h-8 text-sm"
                              />
                              <Select value={newWallet.chain} onValueChange={(val) => setNewWallet({...newWallet, chain: val})}>
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Cadena" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Polygon">Polygon</SelectItem>
                                  <SelectItem value="Ethereum">Ethereum</SelectItem>
                                  <SelectItem value="BSC">BSC</SelectItem>
                                  <SelectItem value="Avalanche">Avalanche</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                                <Button type="button" size="sm" onClick={handleAddWallet} className="h-7 text-xs">Agregar</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddWallet(false)} className="h-7 text-xs">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Seleccionar wallet" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {userWallets.length > 0 ? (
                                    userWallets.map(wallet => (
                                      <SelectItem key={wallet.id} value={wallet.id} className="text-sm">
                                        {wallet.name} - {wallet.address?.slice(0, 6) || '0x'}...{wallet.address?.slice(-4) || '0000'}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="no-wallet" disabled>
                                      No hay wallets disponibles
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t('makeOffer.sendWallet')}
                              </p>
                            </>
                          )}
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="selectedBank"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel className="text-sm">
                              {t('makeOffer.bankAccount')} <span className="text-destructive">*</span>
                            </FormLabel>
                            {!showAddBank && (
                              <Button 
                                type="button"
                                variant="link" 
                                className="text-primary p-0 h-auto text-xs"
                                onClick={() => setShowAddBank(true)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar
                              </Button>
                            )}
                          </div>
                          
                          {showAddBank ? (
                            <div className="bg-muted p-2 rounded-lg space-y-2">
                              <Select value={newBank.country_code} onValueChange={handleCountryChange}>
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="País" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.map(country => (
                                    <SelectItem key={country.code} value={country.code} className="text-sm">
                                      <span className="flex items-center gap-2">
                                        <span>{country.flag}</span>
                                        <span>{country.name}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder={t('makeOffer.addBank.bankName')}
                                value={newBank.bank_name}
                                onChange={(e) => setNewBank({...newBank, bank_name: e.target.value})}
                                className="h-8 text-sm"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Select value={newBank.currency} onValueChange={(val) => setNewBank({...newBank, currency: val})}>
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Moneda" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {countries.find(c => c.code === newBank.country_code)?.currencies.map(curr => (
                                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  placeholder="# Cuenta"
                                  value={newBank.account_number}
                                  onChange={(e) => setNewBank({...newBank, account_number: e.target.value})}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" size="sm" onClick={handleAddBank} className="h-7 text-xs">Agregar</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddBank(false)} className="h-7 text-xs">
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Seleccionar cuenta" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {bankAccounts.map(account => (
                                    <SelectItem key={account.id} value={account.id} className="text-sm">
                                      <span className="flex items-center gap-2">
                                        <span>{account.bank_name}</span>
                                        <span className="text-muted-foreground">• {account.currency}</span>
                                        <span className="text-muted-foreground">• {account.account_number}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t('makeOffer.sendFunds')}
                              </p>
                            </>
                          )}
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {/* Campo de notas - span completo */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Notas (opcional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Agrega información adicional sobre tu oferta..."
                        className="resize-none"
                        rows={3}
                        maxLength={500}
                        {...field}
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
                  disabled={loading}
                >
                  {t('makeOffer.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? 'Creando...' : t('makeOffer.createOffer')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}