import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export const NotificationBell = ({ unreadCount, onClick }: NotificationBellProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={onClick}
      aria-label="Abrir notificaciones"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
          aria-label={`${unreadCount} notificaciones no leídas`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};
