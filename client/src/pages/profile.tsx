import { Link, useLocation } from "wouter";
import { ArrowLeft, User, MapPin, Clock, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Edit, RefreshCw, RotateCcw, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { type Order, type UserStatistics } from "@shared/schema";
import { getCurrentUserId, clearUserSession } from "@/utils/user-session";
import { forceRefreshApp } from "@/utils/force-refresh";
import { getAuthState, logout, getUserDisplayName } from "@/utils/auth-state";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/components/onboarding";
import { FeatureTooltip } from "@/components/onboarding/feature-tooltip";
import PWAInstallBannerProfile from "@/components/pwa-install-banner-profile";
import AppHeader from "@/components/app-header";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { UserStatistics as UserStatsComponent } from "@/components/profile/user-statistics";

export default function Profile() {
  const userId = getCurrentUserId();
  const { toast } = useToast();
  const { startOnboarding, isOnboardingComplete } = useOnboarding();
  const [, setLocation] = useLocation();
  const [authState, setAuthState] = useState(() => getAuthState());
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    name: authState?.name || "Пользователь",
    email: authState?.isGuest ? "" : "Ducharha@gmail.com",
    phone: authState?.phone || "",
    address: "ул. Джами ",
    avatar: "",
  });

  const handleRefreshSession = () => {
    toast({
      title: "Обновление сессии",
      description: "Очищаем кэш и перезагружаем приложение...",
    });

    setTimeout(() => {
      forceRefreshApp();
    }, 1000);
  };

  const handleStartOnboarding = () => {
    toast({
      title: "Запуск введения",
      description: "Покажем вам основные возможности приложения",
    });

    setTimeout(() => {
      startOnboarding();
    }, 500);
  };

  const handleLogout = () => {
    if (authState?.isGuest) {
      // If guest, redirect to auth to create account
      logout();
      setLocation("/profile");
      toast({
        title: "Создание аккаунта",
        description: "Войдите или создайте профиль для получения полного доступа",
      });
    } else {
      // If authenticated, logout and return to auth screen
      logout();
      setLocation("/profile");
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
    }
  };

  // Загружаем данные пользователя из auth state
  useEffect(() => {
    const currentAuthState = getAuthState();
    setAuthState(currentAuthState);
    
    if (currentAuthState) {
      setUser(prev => ({
        ...prev,
        name: currentAuthState.name || "Пользователь",
        phone: currentAuthState.phone || "",
        email: currentAuthState.isGuest ? "" : prev.email,
      }));
    }
    
    // Fallback to saved profile for backward compatibility
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile && !currentAuthState?.isAuthenticated) {
      const parsed = JSON.parse(savedProfile);
      setUser(prev => ({ ...prev, ...parsed }));
    }
  }, []);

  // Получаем реальные данные заказов и вычисляем статистику
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", userId],
  });

  // Получаем данные для статистики пользователя
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["/api/users", userId, "preferences"],
  });

  // Вычисляем статистику на основе заказов
  const userStatistics: UserStatistics = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0),
    averageOrderValue: orders.length > 0 
      ? orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0) / orders.length 
      : 0,
    favoriteCategories: ["Овощи и фрукты", "Молочные продукты", "Хлебобулочные"], // Заглушка
    lastOrderDate: orders.length > 0 ? orders[0].createdAt : undefined,
    loyaltyLevel: orders.length >= 50 ? 'platinum' : orders.length >= 25 ? 'gold' : orders.length >= 10 ? 'silver' : 'bronze',
    deliveryAddresses: 2, // Заглушка
    completedOrders: orders.filter(order => order.status === 'delivered').length,
    cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
  };

  const profileMenuItems = [
    {
      icon: MapPin,
      label: "Адреса доставки",
      description: "Управление адресами",
      href: "/addresses",
      badge: userStatistics.deliveryAddresses.toString(),
    },
    {
      icon: Clock,
      label: "История заказов",
      description: "Ваши покупки",
      href: "/orders",
      badge: userStatistics.totalOrders.toString(),
    },
    {
      icon: CreditCard,
      label: "Способы оплаты",
      description: "Карты и кошельки", 
      href: "/payment-methods",
    },
  ];

  const settingsMenuItems = [
    {
      icon: Bell,
      label: "Уведомления",
      description: "Настройки push",
      href: "/notifications",
    },
    {
      icon: HelpCircle,
      label: "Помощь",
      description: "FAQ и поддержка",
      href: "/help",
    },
  ];

  const appMenuItems = [
    {
      icon: RotateCcw,
      label: "Показать гид",
      description: "Повторить введение",
      action: handleStartOnboarding,
    },
    {
      icon: RefreshCw,
      label: "Обновить сессию",
      description: "Очистить кэш",
      action: handleRefreshSession,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <AppHeader 
        title="Профиль"
        showBack={false}
        showNotifications={false}
      />
      
      <div className="px-4 py-6 space-y-6">
        {/* User Profile Card */}
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <ProfileAvatar 
                name={user.name}
                email={user.email}
                avatarUrl={user.avatar}
                size="xl"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold" data-testid="text-profile-name">
                  {user.name}
                </h3>
                {authState?.isGuest && (
                  <Badge variant="secondary" className="bg-orange-500 text-white mt-1">
                    Гостевой режим
                  </Badge>
                )}
                {!authState?.isGuest && (
                  <div className="mt-1 space-y-1">
                    {user.email && (
                      <p className="text-sm text-indigo-100" data-testid="text-profile-email">
                        {user.email}
                      </p>
                    )}
                    {user.phone && (
                      <p className="text-sm text-indigo-100" data-testid="text-profile-phone">
                        {user.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Link href="/profile-edit">
                  <Button variant="secondary" size="sm" data-testid="button-edit-profile">
                    <Edit className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <UserStatsComponent 
          statistics={userStatistics}
          isLoading={ordersLoading}
        />

        {/* Profile Menu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Мой профиль</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profileMenuItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`text-menu-${item.label.toLowerCase().replace(/ /g, '-')}`}>
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge variant="secondary" data-testid={`badge-${item.label.toLowerCase().replace(/ /g, '-')}`}>
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Settings Menu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Настройки</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settingsMenuItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`text-settings-${item.label.toLowerCase().replace(/ /g, '-')}`}>
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* App Actions */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {appMenuItems.map((item, index) => (
              <FeatureTooltip
                key={index}
                id={`profile-action-${index}`}
                title="Полезная функция"
                description={item.label === "Показать гид" 
                  ? "Нажмите, чтобы повторно просмотреть введение в приложение с основными возможностями"
                  : "Очистите кэш если приложение работает некорректно"
                }
                trigger="hover"
              >
                <button
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  data-testid={`button-${item.label.toLowerCase().replace(/ /g, '-')}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${item.label === "Показать гид" ? "bg-purple-100 dark:bg-purple-900" : "bg-blue-100 dark:bg-blue-900"} rounded-lg flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${item.label === "Показать гид" ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.label === "Показать гид" && (
                      <Sparkles className="w-4 h-4 text-purple-500" />
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              </FeatureTooltip>
            ))}
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-left"
              data-testid="button-logout"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {authState?.isGuest ? 'Создать аккаунт' : 'Выйти'}
                  </p>
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {authState?.isGuest 
                      ? 'Получите полный доступ' 
                      : 'Выход из аккаунта'
                    }
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </CardContent>
        </Card>

        {/* PWA Install Banner */}
        <PWAInstallBannerProfile />

        {/* Hidden admin link - click 5 times on version */}
        <div 
          className="text-center py-2 cursor-pointer"
          onClick={(e) => {
            const clicks = parseInt(e.currentTarget.dataset.clicks || "0") + 1;
            e.currentTarget.dataset.clicks = clicks.toString();
            if (clicks >= 5) {
              window.location.href = "/admin/login";
            }
          }}
        >
          <p className="text-xs text-gray-400">ДУЧАРХА v2.0.0</p>
        </div>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mx-4 mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Debug Info (Dev Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>User ID: {userId}</p>
              <p>Auth State: {JSON.stringify(authState, null, 2)}</p>
              <p>Orders: {orders.length} orders loaded</p>
              <p>Onboarding: {isOnboardingComplete ? 'Complete' : 'Incomplete'}</p>
              <p>Statistics: {JSON.stringify(userStatistics, null, 2)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}