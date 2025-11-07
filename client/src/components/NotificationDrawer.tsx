import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  AlertTriangle,
  Check
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const getIcon = (type: string, severity: string) => {
  if (type.includes('approved')) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (type.includes('failed')) return <AlertCircle className="h-5 w-5 text-red-500" />;
  if (type.includes('pending')) return <Info className="h-5 w-5 text-blue-500" />;
  if (type.includes('warning')) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  return <Info className="h-5 w-5 text-muted-foreground" />;
};

const groupByDate = (notifications: Notification[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { [key: string]: Notification[] } = {
    'Hoy': [],
    'Ayer': [],
    'Anteriores': []
  };

  notifications.forEach(notification => {
    const notifDate = new Date(notification.created_at);
    notifDate.setHours(0, 0, 0, 0);

    if (notifDate.getTime() === today.getTime()) {
      groups['Hoy'].push(notification);
    } else if (notifDate.getTime() === yesterday.getTime()) {
      groups['Ayer'].push(notification);
    } else {
      groups['Anteriores'].push(notification);
    }
  });

  return groups;
};

export const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationDrawerProps) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  const groupedNotifications = groupByDate(notifications);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[420px] p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Notificaciones</SheetTitle>
        </SheetHeader>
        
        {unreadCount > 0 && (
          <div className="px-6 pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todo como leído
            </Button>
          </div>
        )}
        
        <Separator />

        <ScrollArea className="h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">Estás al día</h3>
              <p className="text-sm text-muted-foreground">
                No hay notificaciones nuevas
              </p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedNotifications).map(([group, items]) => {
                if (items.length === 0) return null;
                
                return (
                  <div key={group} className="mb-4">
                    <div className="px-6 py-2 text-xs font-semibold text-muted-foreground">
                      {group}
                    </div>
                    {items.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "px-6 py-4 hover:bg-accent cursor-pointer transition-colors",
                          !notification.read && "bg-accent/50"
                        )}
                        onClick={() => {
                          if (!notification.read) {
                            onMarkAsRead(notification.id);
                          }
                          if (notification.payload?.link) {
                            window.location.href = notification.payload.link;
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getIcon(notification.type, notification.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-sm">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.created_at && !isNaN(new Date(notification.created_at).getTime())
                                ? formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                    locale: es
                                  })
                                : 'Recién'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

function Bell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
