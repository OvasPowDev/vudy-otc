import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const STORAGE_KEY = 'app.notifications';
const UNREAD_COUNT_KEY = 'app.notifications.unread';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      } catch (e) {
        console.error('Error parsing stored notifications:', e);
      }
    }
  }, []);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 500)));
      const count = notifications.filter(n => !n.read).length;
      setUnreadCount(count);
      localStorage.setItem(UNREAD_COUNT_KEY, count.toString());
    }
  }, [notifications]);

  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('New notification received:', notification);

    // Add to list
    setNotifications(prev => [notification, ...prev]);

    // Show toast for pending transactions
    if (notification.type === 'transaction.pending') {
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }

    // Open modal for approved transactions
    if (notification.type === 'transaction.approved') {
      setSelectedNotification(notification);
    }
  }, []);

  // Fetch initial notifications and set up realtime subscription
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          type: n.type as Notification['type'],
          title: n.title,
          message: n.message,
          created_at: n.created_at,
          read: n.read,
          severity: n.severity as Notification['severity'],
          source: n.source,
          payload: n.payload as Notification['payload'],
          actions: n.actions as Notification['actions']
        })));
      }
    };

    fetchNotifications();

    // Set up realtime subscription
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          handleNewNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewNotification]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking all as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, [notifications]);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedNotification(null);
  }, []);

  return {
    notifications,
    unreadCount,
    isDrawerOpen,
    selectedNotification,
    markAsRead,
    markAllAsRead,
    toggleDrawer,
    closeModal,
  };
};
