import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Edit, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Banner } from "@shared/schema";

export default function Admin() {
  const [notificationData, setNotificationData] = useState({
    userId: "demo-user",
    title: "",
    message: "",
    type: "info"
  });
  
  const [bannerData, setBannerData] = useState({
    title: "",
    subtitle: "",
    message: "",
    type: "info",
    backgroundColor: "#6366f1",
    textColor: "#ffffff",
    buttonText: "",
    buttonLink: "",
    isActive: true,
    priority: 0
  });
  
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const { toast } = useToast();

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['/api/admin/banners'],
  });

  const sendNotification = async () => {
    try {
      await apiRequest('POST', '/api/notifications', notificationData);
      
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
      
      const orderResponse = await apiRequest('POST', '/api/orders', orderData);
      const order = await orderResponse.json();
      
      // Then update its status to trigger notification
      await apiRequest('PATCH', `/api/admin/orders/${order.id}/status`, { status: "confirmed" });
      
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

  const createOrUpdateBanner = async () => {
    try {
      const dataToSend = {
        ...bannerData,
        subtitle: bannerData.subtitle || null,
        buttonText: bannerData.buttonText || null,
        buttonLink: bannerData.buttonLink || null
      };
      
      if (editingBanner) {
        await apiRequest('PUT', `/api/admin/banners/${editingBanner.id}`, dataToSend);
        toast({
          title: "Баннер обновлен",
          description: "Баннер успешно обновлен"
        });
      } else {
        await apiRequest('POST', '/api/admin/banners', dataToSend);
        toast({
          title: "Баннер создан",
          description: "Баннер успешно создан"
        });
      }
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      
      // Reset form
      setBannerData({
        title: "",
        subtitle: "",
        message: "",
        type: "info",
        backgroundColor: "#6366f1",
        textColor: "#ffffff",
        buttonText: "",
        buttonLink: "",
        isActive: true,
        priority: 0
      });
      setEditingBanner(null);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: `Не удалось ${editingBanner ? 'обновить' : 'создать'} баннер`,
        variant: "destructive"
      });
    }
  };

  const deleteBanner = async (bannerId: string) => {
    try {
      await apiRequest(`/api/admin/banners/${bannerId}`, 'DELETE');
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      
      toast({
        title: "Баннер удален",
        description: "Баннер успешно удален"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить баннер",
        variant: "destructive"
      });
    }
  };

  const editBanner = (banner: Banner) => {
    setBannerData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      message: banner.message,
      type: banner.type,
      backgroundColor: banner.backgroundColor || "#6366f1",
      textColor: banner.textColor || "#ffffff",
      buttonText: banner.buttonText || "",
      buttonLink: banner.buttonLink || "",
      isActive: banner.isActive || true,
      priority: banner.priority || 0
    });
    setEditingBanner(banner);
  };

  const getBannerTypeColor = (type: string) => {
    switch (type) {
      case 'promo':
        return 'bg-orange-500';
      case 'announcement':
        return 'bg-blue-500';
      case 'partnership':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Админ панель - Управление контентом</h1>
      
      <Tabs defaultValue="banners" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="banners">Управление баннерами</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
        </TabsList>
        
        <TabsContent value="banners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingBanner ? 'Редактировать баннер' : 'Создать баннер'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Заголовок *</Label>
                  <Input
                    id="title"
                    value={bannerData.title}
                    onChange={(e) => setBannerData({ ...bannerData, title: e.target.value })}
                    placeholder="🎉 Добро пожаловать!"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subtitle">Подзаголовок</Label>
                  <Input
                    id="subtitle"
                    value={bannerData.subtitle}
                    onChange={(e) => setBannerData({ ...bannerData, subtitle: e.target.value })}
                    placeholder="Экспресс-доставка продуктов"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Сообщение *</Label>
                <Textarea
                  id="message"
                  value={bannerData.message}
                  onChange={(e) => setBannerData({ ...bannerData, message: e.target.value })}
                  placeholder="Свежие продукты к вашему столу за 10-15 минут"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Тип</Label>
                  <Select value={bannerData.type} onValueChange={(value) => setBannerData({ ...bannerData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Информация</SelectItem>
                      <SelectItem value="promo">Промо-акция</SelectItem>
                      <SelectItem value="announcement">Объявление</SelectItem>
                      <SelectItem value="partnership">Партнерство</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Приоритет</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={bannerData.priority}
                    onChange={(e) => setBannerData({ ...bannerData, priority: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backgroundColor">Цвет фона</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={bannerData.backgroundColor}
                      onChange={(e) => setBannerData({ ...bannerData, backgroundColor: e.target.value })}
                      className="w-16 p-1 h-10"
                    />
                    <Input
                      value={bannerData.backgroundColor}
                      onChange={(e) => setBannerData({ ...bannerData, backgroundColor: e.target.value })}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="textColor">Цвет текста</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={bannerData.textColor}
                      onChange={(e) => setBannerData({ ...bannerData, textColor: e.target.value })}
                      className="w-16 p-1 h-10"
                    />
                    <Input
                      value={bannerData.textColor}
                      onChange={(e) => setBannerData({ ...bannerData, textColor: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buttonText">Текст кнопки</Label>
                  <Input
                    id="buttonText"
                    value={bannerData.buttonText}
                    onChange={(e) => setBannerData({ ...bannerData, buttonText: e.target.value })}
                    placeholder="Получить скидку"
                  />
                </div>
                
                <div>
                  <Label htmlFor="buttonLink">Ссылка кнопки</Label>
                  <Input
                    id="buttonLink"
                    value={bannerData.buttonLink}
                    onChange={(e) => setBannerData({ ...bannerData, buttonLink: e.target.value })}
                    placeholder="/catalog"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={bannerData.isActive}
                  onCheckedChange={(checked) => setBannerData({ ...bannerData, isActive: checked })}
                />
                <Label htmlFor="isActive">Активный баннер</Label>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createOrUpdateBanner} className="flex-1">
                  {editingBanner ? 'Обновить баннер' : 'Создать баннер'}
                </Button>
                {editingBanner && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingBanner(null);
                      setBannerData({
                        title: "",
                        subtitle: "",
                        message: "",
                        type: "info",
                        backgroundColor: "#6366f1",
                        textColor: "#ffffff",
                        buttonText: "",
                        buttonLink: "",
                        isActive: true,
                        priority: 0
                      });
                    }}
                  >
                    Отмена
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Существующие баннеры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{banner.title}</h3>
                          <Badge className={getBannerTypeColor(banner.type)}>
                            {banner.type}
                          </Badge>
                          {banner.isActive ? (
                            <Badge variant="default">Активный</Badge>
                          ) : (
                            <Badge variant="secondary">Неактивный</Badge>
                          )}
                        </div>
                        {banner.subtitle && (
                          <p className="text-sm text-gray-600 mb-1">{banner.subtitle}</p>
                        )}
                        <p className="text-sm text-gray-500">{banner.message}</p>
                        {banner.buttonText && (
                          <p className="text-xs text-gray-400 mt-1">
                            Кнопка: "{banner.buttonText}" → {banner.buttonLink}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editBanner(banner)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteBanner(banner.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Приоритет: {banner.priority}</span>
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: banner.backgroundColor || '#6366f1' }}
                      />
                      <span>{banner.backgroundColor}</span>
                    </div>
                  </div>
                ))}
                
                {banners.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Пока нет баннеров. Создайте первый баннер выше.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Отправить уведомление</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">ID пользователя</Label>
                <Input
                  id="userId"
                  value={notificationData.userId}
                  onChange={(e) => setNotificationData({ ...notificationData, userId: e.target.value })}
                  placeholder="demo-user"
                />
              </div>
              
              <div>
                <Label htmlFor="notifTitle">Заголовок</Label>
                <Input
                  id="notifTitle"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                  placeholder="Заголовок уведомления"
                />
              </div>
              
              <div>
                <Label htmlFor="notifMessage">Сообщение</Label>
                <Textarea
                  id="notifMessage"
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                  placeholder="Текст уведомления"
                />
              </div>
              
              <div>
                <Label htmlFor="notifType">Тип</Label>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}