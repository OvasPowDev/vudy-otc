import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'transaction.pending' | 'transaction.approved' | 'transaction.failed' | 'system.info' | 'system.warning';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  severity: 'info' | 'success' | 'warning' | 'error';
  source: string;
  payload?: {
    transactionId?: string;
    amount?: { value: number; currency: string };
    customer?: { name: string; email: string };
    status?: string;
    link?: string;
  };
  actions?: Array<{ label: string; href?: string; type: string }>;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Fetch notifications from API
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/notifications/mark-all-read', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    await markAsReadMutation.mutateAsync(notificationId);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedNotification(null);
  }, []);

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const lastSeenId = localStorage.getItem('last_notification_id');
      
      if (latestNotification.id !== lastSeenId && !latestNotification.read) {
        if (latestNotification.type === 'transaction.pending') {
          toast.info(latestNotification.title, {
            description: latestNotification.message,
            duration: 5000,
          });
        } else if (latestNotification.type === 'transaction.approved') {
          setSelectedNotification(latestNotification);
        }
        
        localStorage.setItem('last_notification_id', latestNotification.id);
      }
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isDrawerOpen,
    selectedNotification,
    markAsRead,
    markAllAsRead,
    toggleDrawer,
    closeModal,
    isLoading,
  };
};
