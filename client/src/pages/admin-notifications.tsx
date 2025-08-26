import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Send, Bell, Users, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentUserId } from "@/utils/user-session";

export default function AdminNotifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [notificationData, setNotificationData] = useState({
    userId: getCurrentUserId(),
    title: "",
    message: "",
    type: "info"
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Проверка авторизации
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
      return;
    }
  }, [setLocation]);

  const notificationTypes = [
    { value: "info", label: "Информация", color: "bg-blue-100 text-blue-800", icon: "ℹ️" },
    { value: "success", label: "Успех", color: "bg-green-100 text-green-800", icon: "✅" },
    { value: "warning", label: "Предупреждение", color: "bg-yellow-100 text-yellow-800", icon: "⚠️" },
    { value: "error", label: "Ошибка", color: "bg-red-100 text-red-800", icon: "❌" },
    { value: "promotion", label: "Акция", color: "bg-purple-100 text-purple-800", icon: "🎉" }
  ];

  const sendNotification = async () => {
    if (!notificationData.title.trim() || !notificationData.message.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните заголовок и текст уведомления",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/notifications', notificationData);
      
      // Invalidate notification queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Уведомление отправлено",
        description: "Уведомление успешно создано и отправлено всем пользователям"
      });
      
      // Reset form
      setNotificationData({
        userId: getCurrentUserId(),
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
    } finally {
      setIsLoading(false);
    }
  };

  const sendPromoNotification = async (type: 'discount' | 'newProducts' | 'weekendSale') => {
    const promoMessages = {
      discount: {
        title: "🎉 Новая акция - скидка 25%!",
        message: "Только сегодня скидка 25% на все товары! Используйте промокод СКИДКА25 при оформлении заказа. Торопитесь, акция ограничена!",
        type: "promotion"
      },
      newProducts: {
        title: "🆕 Новые товары в каталоге!",
        message: "Мы добавили свежие продукты в наш каталог! Овощи, фрукты, молочные продукты и многое другое. Сделайте заказ прямо сейчас!",
        type: "info"
      },
      weekendSale: {
        title: "🛒 Выходные со скидкой!",
        message: "Весь уикенд действует скидка 15% на заказы от 1000₽. Используйте промокод ВЫХОДНЫЕ15. Доставка бесплатно!",
        type: "promotion"
      }
    };

    setNotificationData({
      userId: getCurrentUserId(),
      ...promoMessages[type]
    });
  };

  const currentType = notificationTypes.find(type => type.value === notificationData.type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin")}
              className="mr-3 p-2 -ml-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Уведомления и рассылки
                </h1>
                <p className="text-sm text-gray-500">
                  Отправка уведомлений всем пользователям
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые шаблоны</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-purple-500"
              onClick={() => sendPromoNotification('discount')}
              data-testid="card-discount-promo"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <h3 className="font-medium text-gray-900">Акция со скидкой</h3>
                    <p className="text-sm text-gray-500">Скидка 25% на все товары</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
              onClick={() => sendPromoNotification('newProducts')}
              data-testid="card-new-products"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🆕</div>
                  <div>
                    <h3 className="font-medium text-gray-900">Новые товары</h3>
                    <p className="text-sm text-gray-500">Уведомление о поступлении</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
              onClick={() => sendPromoNotification('weekendSale')}
              data-testid="card-weekend-sale"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🛒</div>
                  <div>
                    <h3 className="font-medium text-gray-900">Выходная распродажа</h3>
                    <p className="text-sm text-gray-500">Скидка на выходные</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span>Создать уведомление</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Тип уведомления</Label>
              <Select
                value={notificationData.type}
                onValueChange={(value) => setNotificationData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger data-testid="select-notification-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок уведомления</Label>
              <Input
                id="title"
                placeholder="Введите заголовок уведомления"
                value={notificationData.title}
                onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-notification-title"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Текст сообщения</Label>
              <Textarea
                id="message"
                placeholder="Введите текст уведомления"
                value={notificationData.message}
                onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                data-testid="textarea-notification-message"
              />
            </div>

            {/* Preview */}
            {notificationData.title && (
              <div className="space-y-2">
                <Label>Предварительный просмотр</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`p-2 rounded-lg ${currentType?.color || 'bg-blue-100'}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{notificationData.title}</h3>
                        <Badge variant="outline">{currentType?.label}</Badge>
                      </div>
                      {notificationData.message && (
                        <p className="text-gray-600 text-sm">{notificationData.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>Уведомление будет отправлено всем пользователям</span>
              </div>
              <Button
                onClick={sendNotification}
                disabled={isLoading || !notificationData.title.trim() || !notificationData.message.trim()}
                className="bg-green-500 hover:bg-green-600 text-white"
                data-testid="button-send-notification"
              >
                {isLoading ? (
                  "Отправляется..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить уведомление
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Информация об уведомлениях</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Уведомления отправляются всем зарегистрированным пользователям</li>
                  <li>• Пользователи увидят уведомления в своем личном кабинете</li>
                  <li>• Промо-уведомления автоматически выделяются специальными значками</li>
                  <li>• Отправленные уведомления нельзя отозвать или изменить</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}