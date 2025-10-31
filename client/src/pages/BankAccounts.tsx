import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface BankAccount {
  id: string;
  countryCode: string;
  countryName: string;
  bankName: string;
  accountNumber: string;
  currency: string;
}

const americanCountries = [
  { code: "AR", name: "Argentina", flag: "🇦🇷", currencies: ["ARS", "USD"] },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", currencies: ["BOB", "USD"] },
  { code: "CL", name: "Chile", flag: "🇨🇱", currencies: ["CLP", "USD"] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currencies: ["COP", "USD"] },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", currencies: ["CRC", "USD"] },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", currencies: ["USD"] },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", currencies: ["USD"] },
  { code: "MX", name: "México", flag: "🇲🇽", currencies: ["MXN", "USD"] },
  { code: "PE", name: "Perú", flag: "🇵🇪", currencies: ["PEN", "USD"] },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", currencies: ["UYU", "USD"] },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", currencies: ["VES", "USD"] },
];

const banksByCountry: Record<string, string[]> = {
  AR: ["Banco Galicia", "Banco Nación", "Banco Santander Río", "BBVA Argentina"],
  BO: ["Banco Nacional de Bolivia", "Banco Mercantil Santa Cruz", "Banco Bisa"],
  CL: ["Banco de Chile", "Banco Santander Chile", "Banco Estado", "BCI"],
  CO: ["Bancolombia", "Banco de Bogotá", "Davivienda", "BBVA Colombia"],
  CR: ["Banco Nacional de Costa Rica", "Banco de Costa Rica", "BAC San José"],
  EC: ["Banco Pichincha", "Banco del Pacífico", "Banco Guayaquil"],
  SV: ["Banco Agrícola", "Banco Cuscatlán", "Banco Davivienda"],
  MX: ["BBVA México", "Santander México", "Banorte", "Citibanamex"],
  PE: ["Banco de Crédito del Perú", "BBVA Perú", "Scotiabank Perú", "Interbank"],
  UY: ["Banco República", "Banco Itaú Uruguay", "BBVA Uruguay"],
  VE: ["Banco de Venezuela", "Banesco", "Banco Mercantil"],
};

const BankAccounts = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
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

  // Fetch bank accounts
  const { data: accounts = [], isLoading } = useQuery<BankAccount[]>({
    queryKey: ['/api/bank-accounts', { userId: user?.id }],
    enabled: !!user,
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const country = americanCountries.find(c => c.code === data.country);
      if (!country) throw new Error("Invalid country");

      await apiRequest('/api/bank-accounts', {
        method: 'POST',
        data: {
          userId: user?.id,
          countryCode: country.code,
          countryName: country.name,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          currency: data.currency,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: t('bankAccounts.success'),
        description: t('bankAccounts.accountAdded'),
      });
      setDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/bank-accounts'] });
    },
    onError: (error: any) => {
      toast({
        title: t('bankAccounts.error'),
        description: t('bankAccounts.addError'),
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/bank-accounts/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({
        title: t('bankAccounts.success'),
        description: t('bankAccounts.accountDeleted'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-accounts'] });
    },
    onError: (error: any) => {
      toast({
        title: t('bankAccounts.error'),
        description: t('bankAccounts.deleteError'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    await createAccountMutation.mutateAsync(data);
  };

  const handleDelete = async (id: string) => {
    await deleteAccountMutation.mutateAsync(id);
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <AppHeader 
        currentLanguage={language} 
        onLanguageChange={setLanguage} 
      />
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">{t('bankAccounts.title')}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">{t('bankAccounts.subtitle')}</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-account">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('bankAccounts.addAccount')}</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('auth.loading')}</p>
            </div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">{t('bankAccounts.noAccounts')}</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-first">
                  <Plus className="h-4 w-4" />
                  {t('bankAccounts.addFirstAccount')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {accounts.map((account) => {
                const country = americanCountries.find(c => c.code === account.countryCode);
                return (
                  <Card key={account.id} data-testid={`card-account-${account.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{country?.flag}</span>
                          <div>
                            <CardTitle className="text-lg">{account.bankName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{account.countryName}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(account.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${account.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('bankAccounts.accountNumber')}</p>
                          <p className="font-mono text-sm" data-testid={`text-account-${account.id}`}>{account.accountNumber}</p>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-add-account">
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
                        <SelectTrigger className="h-9" data-testid="select-country">
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
                        <SelectTrigger className="h-9" data-testid="select-bank">
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
                        <SelectTrigger className="h-9" data-testid="select-currency">
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
                        data-testid="input-account-number"
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
                }} size="sm" data-testid="button-cancel">
                  {t('bankAccounts.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={!form.formState.isValid} data-testid="button-submit">
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
