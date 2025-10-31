import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AppHeader } from "@/components/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface BankAccount {
  id: string;
  country_code: string;
  country_name: string;
  bank_name: string;
  account_number: string;
  currency: string;
}

const americanCountries = [
  { code: "AR", name: "Argentina", flag: "🇦🇷", currencies: ["ARS", "USD"] },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", currencies: ["BOB", "USD"] },
  { code: "BR", name: "Brasil", flag: "🇧🇷", currencies: ["BRL", "USD"] },
  { code: "CA", name: "Canadá", flag: "🇨🇦", currencies: ["CAD", "USD"] },
  { code: "CL", name: "Chile", flag: "🇨🇱", currencies: ["CLP", "USD"] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currencies: ["COP", "USD"] },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", currencies: ["CRC", "USD"] },
  { code: "CU", name: "Cuba", flag: "🇨🇺", currencies: ["CUP", "USD"] },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", currencies: ["USD"] },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", currencies: ["USD"] },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", currencies: ["GTQ", "USD"] },
  { code: "HN", name: "Honduras", flag: "🇭🇳", currencies: ["HNL", "USD"] },
  { code: "MX", name: "México", flag: "🇲🇽", currencies: ["MXN", "USD"] },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", currencies: ["NIO", "USD"] },
  { code: "PA", name: "Panamá", flag: "🇵🇦", currencies: ["PAB", "USD"] },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", currencies: ["PYG", "USD"] },
  { code: "PE", name: "Perú", flag: "🇵🇪", currencies: ["PEN", "USD"] },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴", currencies: ["DOP", "USD"] },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", currencies: ["USD"] },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", currencies: ["UYU", "USD"] },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", currencies: ["VES", "USD"] },
];

const banksByCountry: Record<string, string[]> = {
  AR: ["Banco Galicia", "Banco Nación", "Banco Santander Río", "BBVA Argentina", "Banco Macro", "HSBC Argentina", "Banco Patagonia"],
  BO: ["Banco Nacional de Bolivia", "Banco Mercantil Santa Cruz", "Banco Bisa", "Banco Económico", "Banco Sol"],
  BR: ["Banco do Brasil", "Itaú Unibanco", "Bradesco", "Caixa Econômica Federal", "Santander Brasil", "Banco Safra", "Nubank"],
  CA: ["Royal Bank of Canada", "Toronto-Dominion Bank", "Bank of Nova Scotia", "Bank of Montreal", "CIBC", "National Bank of Canada"],
  CL: ["Banco de Chile", "Banco Santander Chile", "Banco Estado", "BCI", "Scotiabank Chile", "Itaú Chile", "Banco Falabella"],
  CO: ["Bancolombia", "Banco de Bogotá", "Davivienda", "BBVA Colombia", "Banco Occidente", "Banco Popular", "Banco Agrario"],
  CR: ["Banco Nacional de Costa Rica", "Banco de Costa Rica", "BAC San José", "Banco Popular", "Scotiabank Costa Rica"],
  CU: ["Banco Popular de Ahorro", "Banco Metropolitano", "Banco de Crédito y Comercio"],
  EC: ["Banco Pichincha", "Banco del Pacífico", "Banco Guayaquil", "Produbanco", "Banco Internacional"],
  SV: ["Banco Agrícola", "Banco Cuscatlán", "Banco Davivienda", "Banco de América Central"],
  GT: ["Banco Industrial", "Banrural", "Banco G&T Continental", "BAM", "Banco Azteca", "Banco Ficohsa"],
  HN: ["Banco Atlántida", "Banco Ficohsa", "Banco de Occidente", "Banco Davivienda", "Banco del País"],
  MX: ["BBVA México", "Santander México", "Banorte", "Citibanamex", "HSBC México", "Scotiabank México", "Inbursa"],
  NI: ["Banco de América Central", "Banco de la Producción", "Banpro", "Banco Lafise"],
  PA: ["Banco General", "Banco Nacional de Panamá", "Banistmo", "BAC International Bank", "Global Bank"],
  PY: ["Banco Nacional de Fomento", "Banco Itaú Paraguay", "Banco Continental", "Banco Regional", "Banco Basa"],
  PE: ["Banco de Crédito del Perú", "BBVA Perú", "Scotiabank Perú", "Interbank", "Banco de la Nación", "BanBif"],
  DO: ["Banco Popular Dominicano", "Banco BHD León", "Banco de Reservas", "Scotiabank República Dominicana", "Banreservas"],
  US: ["Bank of America", "JPMorgan Chase", "Wells Fargo", "Citibank", "U.S. Bank", "PNC Bank", "Capital One"],
  UY: ["Banco República", "Banco Itaú Uruguay", "BBVA Uruguay", "Scotiabank Uruguay", "Banco Santander Uruguay", "BROU"],
  VE: ["Banco de Venezuela", "Banesco", "Banco Mercantil", "Banco Provincial", "Banco Occidental de Descuento"],
};

const BankAccounts = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formSchema = z.object({
    country: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
    bankName: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
    accountNumber: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
    currency: z.string().min(1, { message: t('auth.errors.fieldRequired') }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      country: "",
      bankName: "",
      accountNumber: "",
      currency: "",
    },
  });

  const selectedCountry = americanCountries.find(c => c.code === form.watch("country"));

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        loadAccounts();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: t('bankAccounts.error'),
        description: t('bankAccounts.loadError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const country = americanCountries.find(c => c.code === data.country);
      if (!country) return;

      const { error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user?.id,
          country_code: country.code,
          country_name: country.name,
          bank_name: data.bankName,
          account_number: data.accountNumber,
          currency: data.currency,
        });

      if (error) throw error;

      toast({
        title: t('bankAccounts.success'),
        description: t('bankAccounts.accountAdded'),
      });

      setDialogOpen(false);
      form.reset();
      loadAccounts();
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: t('bankAccounts.error'),
        description: t('bankAccounts.addError'),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('bankAccounts.success'),
        description: t('bankAccounts.accountDeleted'),
      });

      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: t('bankAccounts.error'),
        description: t('bankAccounts.deleteError'),
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        user={user} 
        currentLanguage={language} 
        onLanguageChange={setLanguage} 
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">{t('bankAccounts.title')}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">{t('bankAccounts.subtitle')}</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('bankAccounts.addAccount')}</span>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('auth.loading')}</p>
            </div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">{t('bankAccounts.noAccounts')}</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('bankAccounts.addFirstAccount')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => {
                const country = americanCountries.find(c => c.code === account.country_code);
                return (
                  <Card key={account.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{country?.flag}</span>
                          <div>
                            <CardTitle className="text-lg">{account.bank_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{account.country_name}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(account.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('bankAccounts.accountNumber')}</p>
                          <p className="font-mono text-sm">{account.account_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t('bankAccounts.currency')}</p>
                          <Badge variant="secondary">{account.currency}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('bankAccounts.addAccount')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('bankAccounts.country')} <span className="text-destructive">*</span>
                    </FormLabel>
                     <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("currency", "");
                      form.setValue("bankName", "");
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('bankAccounts.selectCountry')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {americanCountries.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('bankAccounts.bankName')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCountry}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('bankAccounts.selectBank')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background z-50">
                        {selectedCountry && banksByCountry[selectedCountry.code]?.map(bank => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('bankAccounts.currency')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCountry}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('bankAccounts.selectCurrency')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedCountry?.currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('bankAccounts.accountNumber')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('bankAccounts.enterAccountNumber')}
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false);
                  form.reset();
                }} size="sm">
                  {t('bankAccounts.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={!form.formState.isValid}>
                  {t('bankAccounts.add')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankAccounts;
