import { useLocation } from "wouter";
import { Bell, ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserId } from "@/utils/user-session";
import type { Notification } from "@shared/schema";
import AppHeader from "@/components/app-header";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = getCurrentUserId();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', userId],
    enabled: !!userId,
  });

  // Fetch notification count
  const { data: countData } = useQuery({
    queryKey: ['/api/notifications', userId, 'count'],
    enabled: !!userId,
  });

  const unreadCount = (countData as { count?: number })?.count || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      const queryClient = require('@/lib/queryClient').queryClient;
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId, 'count'] });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомление как прочитанное",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', `/api/notifications/${userId}/read-all`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      const queryClient = require('@/lib/queryClient').queryClient;
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId, 'count'] });
      toast({
        title: "Успешно",
        description: "Все уведомления отмечены как прочитанные",
      });
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отметить все уведомления как прочитанные",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Сегодня, ${date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'promotion':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <AppHeader
          title="Уведомления"
          showBack={true}
          onBack={() => setLocation("/profile")}
          showNotifications={false}
        />
        <div className="flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20" data-testid="page-notifications">
      <AppHeader
        title="Уведомления"
        showBack={true}
        onBack={() => setLocation("/profile")}
        showNotifications={false}
      />

      <div className="px-4 py-6 space-y-4">
        {/* Header with count and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Уведомления
            </h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" data-testid="badge-unread-count">
                {unreadCount} новых
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                  Обработка...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Прочитать все
                </>
              )}
            </Button>
          )}
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Нет уведомлений
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Здесь будут отображаться важные сообщения и обновления
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-colors ${
                    notification.isRead 
                      ? 'bg-white dark:bg-gray-800' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type || 'default')}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{formatDate(notification.createdAt!)}</span>
                          </div>
                          
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50"
                              data-testid={`button-mark-read-${notification.id}`}
                            >
                              {markAsReadMutation.isPending ? (
                                <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                              ) : (
                                'Прочитано'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </main>
  );
}