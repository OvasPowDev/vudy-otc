import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Key, Clock, Calendar, BookOpen, Code } from "lucide-react";
import { format } from "date-fns";
import { CreateApiKeyDialog } from "@/components/CreateApiKeyDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export default function ApiSettings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: [`/api/api-keys?userId=${user?.id}`],
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiRequest(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/api-keys?userId=${user?.id}`] });
      toast({
        title: t('apiSettings.keyRevoked'),
        description: t('apiSettings.keyRevokedDescription'),
      });
      setDeleteKeyId(null);
    },
    onError: () => {
      toast({
        title: t('apiSettings.error'),
        description: t('apiSettings.revokeError'),
        variant: 'destructive',
      });
    },
  });

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            {t('apiSettings.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('apiSettings.description')}
          </p>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="keys" className="gap-2">
              <Key className="h-4 w-4" />
              {t('apiSettings.apiKeys')}
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <BookOpen className="h-4 w-4" />
              {t('apiSettings.documentation')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t('apiSettings.manageKeys')}</h2>
                <p className="text-sm text-muted-foreground">{t('apiSettings.apiKeysDescription')}</p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-api-key">
                <Plus className="mr-2 h-4 w-4" />
                {t('apiSettings.createKey')}
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common.loading')}...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t('apiSettings.noKeys')}</p>
                <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('apiSettings.createFirstKey')}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('apiSettings.name')}</TableHead>
                    <TableHead>{t('apiSettings.key')}</TableHead>
                    <TableHead>{t('apiSettings.status')}</TableHead>
                    <TableHead>{t('apiSettings.created')}</TableHead>
                    <TableHead>{t('apiSettings.lastUsed')}</TableHead>
                    <TableHead className="text-right">{t('apiSettings.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id} data-testid={`row-api-key-${key.id}`}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {key.keyPrefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {key.isActive ? (
                          <Badge variant="default">{t('apiSettings.active')}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('apiSettings.revoked')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(key.createdAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {key.lastUsedAt ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(new Date(key.lastUsedAt), 'MMM d, yyyy HH:mm')}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">{t('apiSettings.neverUsed')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {key.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteKeyId(key.id)}
                            data-testid={`button-revoke-${key.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  API Documentation
                </CardTitle>
                <CardDescription>
                  Integra transacciones externas mediante nuestra API REST
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Authentication */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Autenticación
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Todas las peticiones requieren una API key en el header:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm">
                      x-api-key: vdy_your_api_key_here
                    </code>
                  </div>
                </div>

                {/* Endpoint */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Crear Transacción Externa
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge>POST</Badge>
                      <code className="text-sm">/api/external/transactions</code>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    <strong>Request Body:</strong>
                  </p>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs">
{`{
  "type": "fiat_to_crypto" | "crypto_to_fiat",
  "chain": "TRON" | "Ethereum" | "Polygon",
  "token": "USDT" | "USDC",
  "amountValue": "1000.00",
  "amountCurrency": "USD",
  "walletAddress": "0x...",
  "bankAccountId": "bank-account-uuid",
  "clientAlias": "Cliente ABC",
  "clientKycUrl": "https://...",
  "clientNotes": "Notas adicionales",
  "requestOrigin": "api",
  "slaMinutes": 30
}`}
                    </pre>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    <strong>Campos:</strong>
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded">
                      <span className="font-mono">type</span>
                      <span className="text-muted-foreground">string</span>
                      <span>Tipo de transacción</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      <span className="font-mono">chain</span>
                      <span className="text-muted-foreground">string</span>
                      <span>Blockchain (TRON, Ethereum, Polygon)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded">
                      <span className="font-mono">token</span>
                      <span className="text-muted-foreground">string</span>
                      <span>Token (USDT, USDC)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      <span className="font-mono">amountValue</span>
                      <span className="text-muted-foreground">string</span>
                      <span>Monto como string</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded">
                      <span className="font-mono">walletAddress</span>
                      <span className="text-muted-foreground">string</span>
                      <span>Dirección de wallet</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      <span className="font-mono">clientAlias</span>
                      <span className="text-muted-foreground">string</span>
                      <span>Nombre/alias del cliente</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded">
                      <span className="font-mono">clientKycUrl</span>
                      <span className="text-muted-foreground">string</span>
                      <span>URL del KYC del cliente</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2">
                      <span className="font-mono">slaMinutes</span>
                      <span className="text-muted-foreground">number</span>
                      <span>SLA en minutos (opcional)</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-4">
                    <strong>Response (201):</strong>
                  </p>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs">
{`{
  "id": "uuid",
  "code": "TXN-12345",
  "type": "buy",
  "status": "pending",
  "amountValue": "1000.00",
  "createdAt": "2025-11-06T00:00:00Z",
  ...
}`}
                    </pre>
                  </div>
                </div>

                {/* Example with cURL */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Ejemplo con cURL</h3>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs">
{`curl -X POST https://vudy-otc.replit.app/api/external/transactions \\
  -H "x-api-key: vdy_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "fiat_to_crypto",
    "chain": "TRON",
    "token": "USDT",
    "amountValue": "1000.00",
    "amountCurrency": "USD",
    "walletAddress": "TXabc123...",
    "bankAccountId": "uuid-here",
    "clientAlias": "Cliente ABC",
    "requestOrigin": "api"
  }'`}
                    </pre>
                  </div>
                </div>

                {/* Error Codes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Códigos de Error</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <Badge variant="destructive">401</Badge>
                      <span>API key inválida o faltante</span>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <Badge variant="destructive">400</Badge>
                      <span>Datos de petición inválidos</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                      <Badge variant="destructive">500</Badge>
                      <span>Error interno del servidor</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateApiKeyDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />

      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('apiSettings.revokeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('apiSettings.revokeConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyId && deleteMutation.mutate(deleteKeyId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('apiSettings.revokeKey')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
