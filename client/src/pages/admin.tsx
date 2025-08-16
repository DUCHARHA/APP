import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [notificationData, setNotificationData] = useState({
    userId: "demo-user",
    title: "",
    message: "",
    type: "info"
  });
  const { toast } = useToast();

  const sendNotification = async () => {
    try {
      await apiRequest('/api/notifications', 'POST', notificationData);
      
      // Invalidate notification queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Уведомление отправлено",
        description: "Уведомление успешно создано"
      });
      
      // Reset form
      setNotificationData({
        userId: "demo-user",
        title: "",
        message: "",
        type: "info"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление",
        variant: "destructive"
      });
    }
  };

  const createTestOrder = async () => {
    try {
      // First create an order
      const orderData = {
        userId: "demo-user",
        totalAmount: "500.00",
        status: "pending",
        deliveryAddress: "ул. Пушкина, 25"
      };
      
      const order = await apiRequest('/api/orders', 'POST', orderData);
      
      // Then update its status to trigger notification
      await apiRequest(`/api/admin/orders/${order.id}/status`, 'PATCH', { status: "confirmed" });
      
      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Тестовый заказ создан",
        description: "Заказ создан и подтвержден, отправлено уведомление"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать тестовый заказ",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Админ панель - Тест уведомлений</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Отправить уведомление</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">ID пользователя</label>
              <Input
                value={notificationData.userId}
                onChange={(e) => setNotificationData({ ...notificationData, userId: e.target.value })}
                placeholder="demo-user"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Заголовок</label>
              <Input
                value={notificationData.title}
                onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                placeholder="Заголовок уведомления"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Сообщение</label>
              <Textarea
                value={notificationData.message}
                onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                placeholder="Текст уведомления"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Тип</label>
              <Select value={notificationData.type} onValueChange={(value) => setNotificationData({ ...notificationData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Информация</SelectItem>
                  <SelectItem value="success">Успех</SelectItem>
                  <SelectItem value="warning">Предупреждение</SelectItem>
                  <SelectItem value="error">Ошибка</SelectItem>
                  <SelectItem value="order">Заказ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={sendNotification} className="w-full">
              Отправить уведомление
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Тестовые сценарии</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={createTestOrder} variant="outline" className="w-full">
              Создать тестовый заказ (автоматически отправит уведомление)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}