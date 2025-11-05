import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Key, Clock, Calendar } from "lucide-react";
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                {t('apiSettings.title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('apiSettings.description')}
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-api-key">
              <Plus className="mr-2 h-4 w-4" />
              {t('apiSettings.createKey')}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('apiSettings.apiKeys')}
            </CardTitle>
            <CardDescription>{t('apiSettings.apiKeysDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('apiSettings.documentation')}</CardTitle>
            <CardDescription>{t('apiSettings.documentationDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href="/api-docs" target="_blank" rel="noopener noreferrer" data-testid="link-api-docs">
                {t('apiSettings.viewDocs')}
              </a>
            </Button>
          </CardContent>
        </Card>
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
