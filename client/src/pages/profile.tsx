import { Link } from "wouter";
import { ArrowLeft, User, MapPin, Clock, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Edit, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { type Order } from "@shared/schema";
import { getCurrentUserId, clearUserSession } from "@/utils/user-session";
import { forceRefreshApp } from "@/utils/force-refresh";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/components/onboarding";
import { FeatureTooltip } from "@/components/onboarding/feature-tooltip";

export default function Profile() {
  const userId = getCurrentUserId();
  const { toast } = useToast();
  const { startOnboarding, isOnboardingComplete } = useOnboarding();
  const [user, setUser] = useState({
    name: "Фируз Пулотов",
    email: "anna@example.com",
    phone: "+7 (952) 270-47-18",
    address: "ул. Пушкина, 25, кв. 10",
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
  

  // Загружаем данные пользователя из localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setUser(JSON.parse(savedProfile));
    }
  }, []);

  // Получаем реальные данные заказов
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", userId],
  });

  

  const menuItems = [
    {
      icon: MapPin,
      label: "Адреса доставки",
      description: "Управление адресами",
      href: "/addresses",
    },
    {
      icon: Clock,
      label: "История заказов",
      description: "Ваши покупки",
      href: "/orders",
    },
    {
      icon: CreditCard,
      label: "Способы оплаты",
      description: "Карты и кошельки",
      href: "/payment-methods",
    },
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

  // Show user session info for debugging
  const showSessionInfo = process.env.NODE_ENV === 'development';

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-[#5B21B6] shadow-sm sticky top-0 z-40">
        <div className="flex items-center p-4 bg-[#5B21B6]">
          <Link href="/">
            <button className="mr-3 p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-white">Профиль</h1>
        </div>
      </header>
      {/* User Info */}
      <section className="p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-agent-purple/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-agent-purple" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-500">{user.phone}</p>
            </div>
            <Link href="/profile/edit">
              <button className="p-2 text-gray-400 hover:text-agent-purple">
                <Edit className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>
      {/* Menu Items */}
      <section className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </Link>
          ))}
          
          {/* App Actions Separator */}
          <div className="bg-gray-100 px-4 py-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Приложение
            </p>
          </div>
          
          {/* App Menu Items */}
          {appMenuItems.map((item, index) => (
            <FeatureTooltip
              key={item.label}
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
                className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                data-testid={`button-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-10 h-10 ${item.label === "Показать гид" ? "bg-purple-100" : "bg-blue-100"} rounded-lg flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.label === "Показать гид" ? "text-purple-600" : "text-blue-600"}`} />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                {item.label === "Показать гид" && (
                  <Sparkles className="w-4 h-4 text-purple-500" />
                )}
              </button>
            </FeatureTooltip>
          ))}
        </div>
      </section>
      {/* Promo Section */}
      <section className="px-4 pb-4">
        <div className="bg-gradient-to-r from-agent-purple to-purple-600 rounded-xl p-4 text-white">
          <h3 className="font-bold text-lg mb-1">ДУЧАРХА Премиум</h3>
          <p className="text-purple-100 text-sm mb-3">
            Бесплатная доставка и скидки до 15%
          </p>
          <Button className="bg-white text-agent-purple hover:bg-gray-100">
            Узнать больше
          </Button>
        </div>
      </section>
      {/* Logout */}
      <section className="px-4 pb-8">
        <button className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-center space-x-2 text-red-500">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выйти</span>
        </button>
        
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
          <p className="text-xs text-gray-400">ДУЧАРХА v1.0.0</p>
        </div>
      </section>

      {/* Session Management & Debug Info */}
      <section className="p-4">
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Настройки приложения</h3>
          
          <Button
            onClick={handleRefreshSession}
            variant="outline"
            className="w-full mb-3"
            data-testid="button-refresh-session"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить приложение
          </Button>
          
          {showSessionInfo && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
              <p className="font-medium mb-2">Информация о сессии:</p>
              <p className="text-gray-600 dark:text-gray-400 break-all">ID: {userId}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Если вы видите проблемы с данными, нажмите "Обновить приложение"
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}