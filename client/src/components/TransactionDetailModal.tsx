import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    offer_made: "Oferta hecha",
    escrow_created: "Escrow creado",
    completed: "Completada",
  };
  return labels[status] || status;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
    case "offer_made": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "escrow_created": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
    case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  }
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  } catch {
    return "N/A";
  }
};

const formatAmount = (value: number, currency: string): string => {
  try {
    return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch {
    return `${currency} ${value}`;
  }
};

export function TransactionDetailModal({ open, onOpenChange, transactionId }: TransactionDetailModalProps) {
  const { t } = useLanguage();

  // Fetch transaction data
  const { data: transaction, isLoading, error } = useQuery<any>({
    queryKey: [`/api/transactions/${transactionId}`],
    enabled: !!transactionId && open,
  });

  // Fetch offers for this transaction
  const { data: offers = [] } = useQuery<any[]>({
    queryKey: [`/api/offers/transaction/${transactionId}`],
    enabled: !!transactionId && open,
  });

  if (!transactionId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-transaction-detail">
        <DialogHeader>
          <DialogTitle className="text-lg">{t('transactionDetail.title')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-destructive">Error al cargar la transacción</p>
          </div>
        ) : !transaction ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">Transacción no encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Transaction Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Información de la Transacción</CardTitle>
                  <Badge className={getStatusColor(transaction.status)}>
                    {getStatusLabel(transaction.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Código</p>
                    <p className="font-medium">{transaction.code || transaction.id.substring(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium">{transaction.type === 'buy' ? 'Compra' : 'Venta'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dirección</p>
                    <p className="font-medium">{transaction.direction || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cadena</p>
                    <p className="font-medium">{transaction.chain}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Token</p>
                    <p className="font-medium">{transaction.token}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monto</p>
                    <p className="font-medium">{formatAmount(transaction.amountValue, transaction.amountCurrency)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Dirección de Wallet</p>
                    <p className="font-mono text-xs break-all">{transaction.walletAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Creada</p>
                    <p className="text-xs">{formatDateTime(transaction.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Actualizada</p>
                    <p className="text-xs">{formatDateTime(transaction.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Offers Card */}
            {offers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ofertas ({offers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {offers.map((offer: any) => (
                      <div key={offer.id} className="p-3 bg-muted rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Monto</p>
                            <p className="font-medium">{formatAmount(offer.amountValue, offer.amountCurrency)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">ETA</p>
                            <p className="font-medium">{offer.etaMinutes} minutos</p>
                          </div>
                          {offer.notes && (
                            <div className="col-span-2">
                              <p className="text-xs text-muted-foreground">Notas</p>
                              <p className="text-xs">{offer.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
