import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Palette, Monitor, Sun, Moon, Smartphone, Globe, Volume2, Bell, Eye, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserId } from "@/utils/user-session";
import { apiRequest } from "@/lib/queryClient";
import { type ExtendedUserPreferences } from "@shared/schema";

// Color palette options
const colorOptions = [
  { name: "Индиго", value: "#6366f1", gradient: "from-indigo-500 to-indigo-600" },
  { name: "Фиолетовый", value: "#8b5cf6", gradient: "from-purple-500 to-purple-600" },
  { name: "Синий", value: "#3b82f6", gradient: "from-blue-500 to-blue-600" },
  { name: "Изумрудный", value: "#10b981", gradient: "from-emerald-500 to-emerald-600" },
  { name: "Розовый", value: "#ec4899", gradient: "from-pink-500 to-pink-600" },
  { name: "Оранжевый", value: "#f97316", gradient: "from-orange-500 to-orange-600" },
  { name: "Красный", value: "#ef4444", gradient: "from-red-500 to-red-600" },
  { name: "Янтарный", value: "#f59e0b", gradient: "from-amber-500 to-amber-600" },
];

interface ThemePreferencesProps {
  className?: string;
}

export function ThemePreferences({ className = "" }: ThemePreferencesProps) {
  const { toast } = useToast();
  const userId = getCurrentUserId();
  const queryClient = useQueryClient();
  
  const [preferences, setPreferences] = useState<ExtendedUserPreferences>({
    theme: "light",
    primaryColor: "#6366f1",
    accentColor: "#10b981",
    backgroundColor: null,
    customCss: null,
    userId: userId,
    notifications: {
      orderUpdates: true,
      promotions: true,
      recommendations: false,
      newsletters: false,
      pushEnabled: true,
      emailEnabled: true,
    },
    delivery: {
      preferredTimeSlots: ["09:00-12:00"],
      contactlessDelivery: false,
      leaveAtDoor: false,
      callOnArrival: true,
    },
    app: {
      language: "ru",
      currency: "TJS",
      measurementUnit: "metric",
      compactView: false,
      showPrices: true,
      autoRefresh: true,
    },
    privacy: {
      shareStatistics: true,
      allowAnalytics: true,
      showOnlineStatus: true,
      dataCollection: true,
    },
  });

  // Load user preferences
  const { data: userPreferences, isLoading } = useQuery({
    queryKey: ["/api/users", userId, "preferences"],
    enabled: !!userId,
  });

  useEffect(() => {
    if (userPreferences) {
      setPreferences(prev => ({
        ...prev,
        ...userPreferences,
        notifications: { ...prev.notifications, ...userPreferences.notifications },
        delivery: { ...prev.delivery, ...userPreferences.delivery },
        app: { ...prev.app, ...userPreferences.app },
        privacy: { ...prev.privacy, ...userPreferences.privacy },
      }));
    }
  }, [userPreferences]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<ExtendedUserPreferences>) => {
      return await apiRequest(`/api/users/${userId}/preferences`, {
        method: "PUT",
        body: JSON.stringify(newPreferences),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "preferences"] });
      toast({
        title: "Настройки сохранены",
        description: "Ваши предпочтения успешно обновлены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    },
  });

  const updatePreference = (path: string, value: any) => {
    const keys = path.split('.');
    const newPreferences = { ...preferences };
    let current: any = newPreferences;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setPreferences(newPreferences);
    
    // Auto-save after a short delay
    setTimeout(() => {
      savePreferencesMutation.mutate(newPreferences);
    }, 500);
  };

  const applyTheme = (theme: string) => {
    updatePreference('theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(theme);
    }
  };

  const applyPrimaryColor = (color: string) => {
    updatePreference('primaryColor', color);
    document.documentElement.style.setProperty('--primary', color);
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Тема оформления</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Режим темы</Label>
            <RadioGroup
              value={preferences.theme}
              onValueChange={applyTheme}
              className="grid grid-cols-3 gap-4 mt-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" data-testid="radio-theme-light" />
                <Label htmlFor="light" className="flex items-center space-x-2 cursor-pointer">
                  <Sun className="w-4 h-4" />
                  <span>Светлая</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" data-testid="radio-theme-dark" />
                <Label htmlFor="dark" className="flex items-center space-x-2 cursor-pointer">
                  <Moon className="w-4 h-4" />
                  <span>Темная</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" data-testid="radio-theme-system" />
                <Label htmlFor="system" className="flex items-center space-x-2 cursor-pointer">
                  <Monitor className="w-4 h-4" />
                  <span>Системная</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">Основной цвет</Label>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => applyPrimaryColor(color.value)}
                  className={`h-12 rounded-lg bg-gradient-to-r ${color.gradient} relative transition-all hover:scale-105 ${
                    preferences.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  data-testid={`button-color-${color.name.toLowerCase()}`}
                >
                  {preferences.primaryColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Выбранный: {colorOptions.find(c => c.value === preferences.primaryColor)?.name}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>Настройки приложения</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="language" className="text-base font-medium">
                  Язык интерфейса
                </Label>
                <Select
                  value={preferences.app.language}
                  onValueChange={(value) => updatePreference('app.language', value)}
                >
                  <SelectTrigger className="mt-2" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="tj">Тоҷикӣ</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency" className="text-base font-medium">
                  Валюта
                </Label>
                <Select
                  value={preferences.app.currency}
                  onValueChange={(value) => updatePreference('app.currency', value)}
                >
                  <SelectTrigger className="mt-2" data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TJS">Сомони (TJS)</SelectItem>
                    <SelectItem value="USD">Доллар (USD)</SelectItem>
                    <SelectItem value="RUB">Рубль (RUB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-view" className="text-base font-medium">
                  Компактный вид
                </Label>
                <Switch
                  id="compact-view"
                  checked={preferences.app.compactView}
                  onCheckedChange={(checked) => updatePreference('app.compactView', checked)}
                  data-testid="switch-compact-view"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-prices" className="text-base font-medium">
                  Показывать цены
                </Label>
                <Switch
                  id="show-prices"
                  checked={preferences.app.showPrices}
                  onCheckedChange={(checked) => updatePreference('app.showPrices', checked)}
                  data-testid="switch-show-prices"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh" className="text-base font-medium">
                  Автообновление
                </Label>
                <Switch
                  id="auto-refresh"
                  checked={preferences.app.autoRefresh}
                  onCheckedChange={(checked) => updatePreference('app.autoRefresh', checked)}
                  data-testid="switch-auto-refresh"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Уведомления</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Заказы</Label>
                  <p className="text-sm text-gray-500">Статус заказов и доставки</p>
                </div>
                <Switch
                  checked={preferences.notifications.orderUpdates}
                  onCheckedChange={(checked) => updatePreference('notifications.orderUpdates', checked)}
                  data-testid="switch-order-notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Акции</Label>
                  <p className="text-sm text-gray-500">Скидки и специальные предложения</p>
                </div>
                <Switch
                  checked={preferences.notifications.promotions}
                  onCheckedChange={(checked) => updatePreference('notifications.promotions', checked)}
                  data-testid="switch-promotion-notifications"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Рекомендации</Label>
                  <p className="text-sm text-gray-500">Персональные предложения</p>
                </div>
                <Switch
                  checked={preferences.notifications.recommendations}
                  onCheckedChange={(checked) => updatePreference('notifications.recommendations', checked)}
                  data-testid="switch-recommendation-notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Рассылки</Label>
                  <p className="text-sm text-gray-500">Новости и обновления</p>
                </div>
                <Switch
                  checked={preferences.notifications.newsletters}
                  onCheckedChange={(checked) => updatePreference('notifications.newsletters', checked)}
                  data-testid="switch-newsletter-notifications"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Конфиденциальность</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Статистика</Label>
                  <p className="text-sm text-gray-500">Делиться данными покупок</p>
                </div>
                <Switch
                  checked={preferences.privacy.shareStatistics}
                  onCheckedChange={(checked) => updatePreference('privacy.shareStatistics', checked)}
                  data-testid="switch-share-statistics"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Аналитика</Label>
                  <p className="text-sm text-gray-500">Разрешить сбор аналитики</p>
                </div>
                <Switch
                  checked={preferences.privacy.allowAnalytics}
                  onCheckedChange={(checked) => updatePreference('privacy.allowAnalytics', checked)}
                  data-testid="switch-allow-analytics"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Онлайн статус</Label>
                  <p className="text-sm text-gray-500">Показывать активность</p>
                </div>
                <Switch
                  checked={preferences.privacy.showOnlineStatus}
                  onCheckedChange={(checked) => updatePreference('privacy.showOnlineStatus', checked)}
                  data-testid="switch-online-status"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Сбор данных</Label>
                  <p className="text-sm text-gray-500">Улучшение качества услуг</p>
                </div>
                <Switch
                  checked={preferences.privacy.dataCollection}
                  onCheckedChange={(checked) => updatePreference('privacy.dataCollection', checked)}
                  data-testid="switch-data-collection"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Confirmation */}
      <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            Настройки сохраняются автоматически
          </span>
        </div>
        {savePreferencesMutation.isPending && (
          <Badge variant="secondary">Сохранение...</Badge>
        )}
      </div>
    </div>
  );
}