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
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Wallet {
  id: string;
  name: string;
  address: string;
  chain: string;
  isDefault: boolean;
}

const chains = [
  { code: "Polygon", name: "Polygon", icon: "🟣" },
  { code: "Ethereum", name: "Ethereum", icon: "⟠" },
  { code: "BSC", name: "Binance Smart Chain", icon: "🟡" },
  { code: "Avalanche", name: "Avalanche", icon: "🔺" },
  { code: "Arbitrum", name: "Arbitrum", icon: "🔵" },
  { code: "Optimism", name: "Optimism", icon: "🔴" },
];

const Wallets = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const formSchema = z.object({
    name: z.string().min(1, { message: "El nombre es requerido" }),
    address: z.string().min(1, { message: "La dirección es requerida" }).regex(/^0x[a-fA-F0-9]{40}$/, { message: "Dirección de wallet inválida" }),
    chain: z.string().min(1, { message: "La cadena es requerida" }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      address: "",
      chain: "",
    },
  });

  // Fetch wallets
  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: [`/api/wallets?userId=${user?.id}`],
    enabled: !!user,
  });

  // Create wallet mutation
  const createWalletMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('/api/wallets', {
        method: 'POST',
        data: {
          userId: user?.id,
          name: data.name,
          address: data.address,
          chain: data.chain,
          isDefault: wallets.length === 0, // First wallet is default
        },
      });
    },
    onSuccess: () => {
      toast({
        title: t('bankAccounts.success'),
        description: t('wallets.walletAdded'),
      });
      setDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/wallets?userId=${user?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo agregar la wallet",
        variant: "destructive",
      });
    },
  });

  // Delete wallet mutation
  const deleteWalletMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/wallets/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({
        title: t('bankAccounts.success'),
        description: t('wallets.walletDeleted'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/wallets?userId=${user?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la wallet",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: any) => {
    await createWalletMutation.mutateAsync(data);
  };

  const handleDelete = async (id: string) => {
    await deleteWalletMutation.mutateAsync(id);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
    toast({
      title: t('bankAccounts.success'),
      description: t('wallets.address') + " " + (language === 'es' ? 'copiada al portapapeles' : 'copied to clipboard'),
    });
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
              <h2 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">{t('wallets.title')}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">{language === 'es' ? 'Gestiona tus billeteras de criptomonedas' : 'Manage your cryptocurrency wallets'}</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-wallet">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('wallets.addWallet')}</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('auth.loading')}</p>
            </div>
          ) : wallets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">{language === 'es' ? 'No tienes wallets registradas' : 'You don\'t have any registered wallets'}</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-first">
                  <Plus className="h-4 w-4" />
                  {t('wallets.addFirstWallet')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {wallets.map((wallet) => {
                const chainInfo = chains.find(c => c.code === wallet.chain);
                return (
                  <Card key={wallet.id} data-testid={`card-wallet-${wallet.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{chainInfo?.icon}</span>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {wallet.name}
                              {wallet.isDefault && <Badge variant="secondary" className="text-xs">{language === 'es' ? 'Por defecto' : 'Default'}</Badge>}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{chainInfo?.name}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(wallet.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${wallet.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">{t('wallets.address')}</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm flex-1 truncate" data-testid={`text-address-${wallet.id}`}>
                              {wallet.address}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyAddress(wallet.address)}
                              className="h-8 w-8"
                              data-testid={`button-copy-${wallet.id}`}
                            >
                              {copiedAddress === wallet.address ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
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
            <DialogTitle>{t('wallets.addWalletTitle')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-add-wallet">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('wallets.walletName')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('wallets.walletNamePlaceholder')}
                        className="h-9"
                        {...field}
                        data-testid="input-wallet-name"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('wallets.chain')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9" data-testid="select-chain">
                          <SelectValue placeholder={language === 'es' ? 'Selecciona una cadena' : 'Select a chain'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chains.map(chain => (
                          <SelectItem key={chain.code} value={chain.code}>
                            <span className="flex items-center gap-2">
                              <span>{chain.icon}</span>
                              <span>{chain.name}</span>
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t('wallets.address')} <span className="text-destructive">*</span>
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
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false);
                  form.reset();
                }} size="sm" data-testid="button-cancel">
                  {t('wallets.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={createWalletMutation.isPending}
                  data-testid="button-submit"
                >
                  {createWalletMutation.isPending ? (language === 'es' ? 'Agregando...' : 'Adding...') : t('wallets.add')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallets;
