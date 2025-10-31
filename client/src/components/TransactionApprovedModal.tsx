import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Notification } from '@/hooks/useNotifications';

interface TransactionApprovedModalProps {
  notification: Notification | null;
  onClose: () => void;
}

export const TransactionApprovedModal = ({
  notification,
  onClose
}: TransactionApprovedModalProps) => {
  if (!notification) return null;

  const { payload } = notification;

  return (
    <Dialog open={!!notification} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-green-500/10 p-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <DialogTitle>Transacción aprobada</DialogTitle>
          </div>
          <DialogDescription>
            {notification.message}
          </DialogDescription>
        </DialogHeader>

        {payload && (
          <div className="space-y-3 py-4">
            {payload.transactionId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-medium">{payload.transactionId}</span>
              </div>
            )}
            {payload.amount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-medium">
                  {payload.amount.currency} {payload.amount.value.toLocaleString('es-GT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            )}
            {payload.customer && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{payload.customer.name}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {payload?.link && (
            <Button onClick={() => {
              window.location.href = payload.link!;
              onClose();
            }}>
              Ver detalle
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
