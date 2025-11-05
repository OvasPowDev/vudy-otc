import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (keyName: string) => {
      const response = await apiRequest('/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          name: keyName,
        }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.plainKey);
      queryClient.invalidateQueries({ queryKey: [`/api/api-keys?userId=${user?.id}`] });
      toast({
        title: t('apiSettings.keyCreated'),
        description: t('apiSettings.keyCreatedDescription'),
      });
    },
    onError: () => {
      toast({
        title: t('apiSettings.error'),
        description: t('apiSettings.createError'),
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast({
        title: t('apiSettings.error'),
        description: t('apiSettings.nameRequired'),
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(name.trim());
  };

  const handleCopy = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('apiSettings.copied'),
        description: t('apiSettings.copiedDescription'),
      });
    }
  };

  const handleClose = () => {
    setName("");
    setGeneratedKey(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-create-api-key">
        <DialogHeader>
          <DialogTitle>{t('apiSettings.createNewKey')}</DialogTitle>
          <DialogDescription>
            {generatedKey
              ? t('apiSettings.saveKeyWarning')
              : t('apiSettings.createNewKeyDescription')}
          </DialogDescription>
        </DialogHeader>

        {generatedKey ? (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                {t('apiSettings.keyWarning')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>{t('apiSettings.yourApiKey')}</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedKey}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-generated-key"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  data-testid="button-copy-key"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">{t('apiSettings.keyName')}</Label>
              <Input
                id="key-name"
                placeholder={t('apiSettings.keyNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-key-name"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {generatedKey ? (
            <Button onClick={handleClose} data-testid="button-done">
              {t('common.done')}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={createMutation.isPending}
                data-testid="button-create"
              >
                {createMutation.isPending ? t('common.creating') : t('apiSettings.create')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
