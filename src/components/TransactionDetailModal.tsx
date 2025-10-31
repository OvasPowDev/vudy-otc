import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

interface TransactionData {
  id: string;
  code: string;
  user_id: string;
  created_at: string;
  offered_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
  type: "Buy" | "Sell";
  direction: "CTF" | "FTC";
  chain: string;
  token: string;
  amount_value: string;
  amount_currency: string;
  bank_account_id: string;
  wallet_address: string;
  status: "pending" | "offer_made" | "escrow_created" | "completed";
  updated_at: string;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "completed":
      return "default";
    case "escrow_created":
      return "default";
    case "offer_made":
      return "default";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
};

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

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    Buy: "Compra (CTF)",
    Sell: "Venta (FTC)",
  };
  return labels[type] || type;
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  } catch {
    return "N/A";
  }
};

const formatAmount = (value: string, currency: string): string => {
  try {
    const numValue = parseFloat(value);
    return `${currency} ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch {
    return `${currency} ${value}`;
  }
};

export function TransactionDetailModal({ open, onOpenChange, transactionId }: TransactionDetailModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TransactionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (open && transactionId) {
      fetchTransactionData();
    } else {
      setData(null);
      setError(null);
    }
  }, [open, transactionId]);

  const fetchTransactionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;

      if (transaction) {
        setData(transaction as any);
      } else {
        throw new Error("Transacción no encontrada");
      }
    } catch (err) {
      console.error("Error fetching transaction:", err);
      setError("No se pudo cargar el detalle de la transacción");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const handleApprove = async () => {
    if (!data) return;
    
    setApproving(true);
    try {
      // Get first offer for this transaction
      const { data: offers, error: offersError } = await supabase
        .from('otc_offers')
        .select('id, user_id')
        .eq('transaction_id', data.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (offersError) throw offersError;
      
      if (!offers || offers.length === 0) {
        toast.error('No hay ofertas para aprobar');
        return;
      }

      const offer = offers[0];

      // Update transaction status to escrow_created and set accepted user
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'escrow_created',
          accepted_by_user_id: offer.user_id,
          approved_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      toast.success('Transacción aprobada exitosamente');
      await fetchTransactionData(); // Refresh data
    } catch (err) {
      console.error('Error approving transaction:', err);
      toast.error('Error al aprobar la transacción');
    } finally {
      setApproving(false);
    }
  };

  const InfoRow = ({ label, value, emphasis = false, copyable = false }: { 
    label: string; 
    value: string; 
    emphasis?: boolean; 
    copyable?: boolean;
  }) => (
    <div className="flex justify-between items-center gap-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs text-right ${emphasis ? "font-semibold text-foreground" : ""} ${copyable ? "font-mono" : ""}`}>
          {value}
        </span>
        {copyable && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0"
            onClick={() => handleCopy(value, label)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg truncate">{data?.code || 'Detalle de Transacción'}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{data && getTypeLabel(data.type)}</p>
            </div>
            {data && (
              <Badge className={`${getStatusColor(data.status)} shrink-0`}>
                {getStatusLabel(data.status)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-xs text-muted-foreground">Cargando transacción...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-destructive/10 p-2.5 mb-3">
              <ExternalLink className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid md:grid-cols-2 gap-3">
            {/* Columna Izquierda */}
            <div className="space-y-3">
              {/* Información General */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-semibold">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 px-3 pb-3">
                  <InfoRow label="Código" value={data.code} copyable emphasis />
                  <InfoRow label="Dirección" value={data.direction} />
                  <InfoRow label="Estado" value={getStatusLabel(data.status)} />
                </CardContent>
              </Card>

              {/* Fechas Importantes */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-semibold">Fechas Importantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 px-3 pb-3">
                  <InfoRow label="Creación" value={formatDateTime(data.created_at)} />
                  {data.offered_at && <InfoRow label="Oferta" value={formatDateTime(data.offered_at)} />}
                  {data.approved_at && <InfoRow label="Aprobación" value={formatDateTime(data.approved_at)} />}
                  {data.completed_at && <InfoRow label="Completada" value={formatDateTime(data.completed_at)} />}
                  <InfoRow label="Actualización" value={formatDateTime(data.updated_at)} />
                </CardContent>
              </Card>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-3">
              {/* Detalles y Montos */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-semibold">Detalles de Transacción</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 px-3 pb-3">
                  <InfoRow 
                    label="Monto" 
                    value={formatAmount(data.amount_value, data.amount_currency)} 
                    emphasis 
                  />
                  <InfoRow label="Token" value={data.token} emphasis />
                  <InfoRow label="Cadena" value={data.chain} />
                </CardContent>
              </Card>

              {/* Wallet */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-semibold">Wallet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 px-3 pb-3">
                  <InfoRow label="Address" value={data.wallet_address} copyable />
                </CardContent>
              </Card>

              {/* Cuenta Bancaria */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-semibold">Cuenta Bancaria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 px-3 pb-3">
                  <InfoRow label="ID" value={data.bank_account_id} copyable />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row items-center justify-between gap-2 pt-3">
          <div className="flex items-center gap-2">
            {data && data.status !== 'escrow_created' && data.status !== 'completed' && (
              <Button 
                variant="default" 
                size="sm"
                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Aprobando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1.5" />
                    Aprobar
                  </>
                )}
              </Button>
            )}
            {data && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleCopy(data.id, "ID")}
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  ID
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleCopy(data.code, "Código")}
                >
                  <Copy className="h-3 w-3 mr-1.5" />
                  Código
                </Button>
              </>
            )}
          </div>
          <Button size="sm" className="h-8" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
