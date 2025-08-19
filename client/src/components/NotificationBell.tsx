import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    
    // Mark all notifications as read when opening
    if (isOpen && unreadCount > 0) {
      await handleMarkAllAsRead();
    }
  };

  // Fetch notification count
  const { data: countData } = useQuery({
    queryKey: ['/api/notifications', userId, 'count'],
    enabled: !!userId,
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  // Fetch notifications when dialog opens
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', userId],
    enabled: !!userId && open,
  });

  const unreadCount = (countData as { count?: number })?.count || 0;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
      
      // Invalidate both queries to refresh counts and list
      const queryClient = (await import('@/lib/queryClient')).queryClient;
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId, 'count'] });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('PATCH', `/api/notifications/${userId}/read-all`);
      
      // Invalidate queries
      const queryClient = (await import('@/lib/queryClient')).queryClient;
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId, 'count'] });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Только что';
    if (diffMinutes < 60) return `${diffMinutes} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📢';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="relative p-2">
          <Bell className="text-gray-600 dark:text-gray-300 w-6 h-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-bright-orange hover:bg-bright-orange text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center p-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Уведомления</DialogTitle>
          <DialogDescription className="sr-only">
            Список всех ваших уведомлений
          </DialogDescription>
          <div className="flex items-center justify-between">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Отметить все как прочитанные
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="mx-auto mb-2 w-8 h-8 opacity-50" />
              <p>Пока уведомлений нет</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    notification.isRead
                      ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-card border-bright-orange/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-bright-orange rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt!)}
                        </span>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs h-6 px-2"
                          >
                            Прочитано
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}