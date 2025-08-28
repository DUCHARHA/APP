import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Shield, 
  LogOut, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  ShoppingCart,
  Bell,
  Settings,
  BarChart3,
  CreditCard,
  Activity,
  ArrowRight,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";
import { type Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Проверка авторизации
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
      return;
    }

    // Обновление времени каждую секунду
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/orders", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch orders");
      }
      return res.json();
    },
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["/api/admin/banners"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/banners", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch banners");
      return res.json();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast({
      title: "Вы вышли из системы",
      description: "До свидания!",
    });
    setLocation("/admin/login");
  };

  // Статистика
  const today = new Date().toDateString();
  const todayOrders = orders.filter(order => 
    new Date(order.createdAt!).toDateString() === today
  );
  const pendingOrders = orders.filter(order => order.status === "pending");
  const totalRevenue = orders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount), 0
  );
  const activeBanners = banners.filter((banner: any) => banner.active);

  // Статистика по часам (последние 24 часа)
  const hourlyStats = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i), 0, 0, 0);
    const ordersInHour = orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      return orderDate.getHours() === hour.getHours() && 
             orderDate.toDateString() === hour.toDateString();
    });
    return {
      hour: hour.getHours(),
      orders: ordersInHour.length,
      revenue: ordersInHour.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0)
    };
  });

  const maxOrdersInHour = Math.max(...hourlyStats.map(stat => stat.orders), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                  <Shield className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  ДУЧАРХА Admin
                </h1>
                <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{currentTime.toLocaleTimeString('ru-RU')}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{currentTime.toLocaleDateString('ru-RU')}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-4 mr-4">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Система активна</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 lg:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 lg:p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-blue-100" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  Сегодня
                </Badge>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-1">
                  {todayOrders.length}
                </p>
                <p className="text-blue-100 text-sm lg:text-base">Заказов сегодня</p>
                <div className="mt-2 flex items-center text-xs lg:text-sm text-blue-100">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  <span>+{Math.round((todayOrders.length / (orders.length || 1)) * 100)}% от общего</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 lg:p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-100" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  Общая
                </Badge>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-1">
                  {totalRevenue.toFixed(0)}₽
                </p>
                <p className="text-emerald-100 text-sm lg:text-base">Выручка</p>
                <div className="mt-2 flex items-center text-xs lg:text-sm text-emerald-100">
                  <Target className="w-3 h-3 mr-1" />
                  <span>Средний чек: {orders.length ? (totalRevenue / orders.length).toFixed(0) : 0}₽</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 lg:p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-6 h-6 lg:w-8 lg:h-8 text-orange-100" />
                <div className="flex items-center space-x-1">
                  {pendingOrders.length > 0 && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    Активные
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-1">
                  {pendingOrders.length}
                </p>
                <p className="text-orange-100 text-sm lg:text-base">Новых заказов</p>
                <div className="mt-2 flex items-center text-xs lg:text-sm text-orange-100">
                  <Zap className="w-3 h-3 mr-1" />
                  <span>{pendingOrders.length > 0 ? 'Требует внимания' : 'Все обработаны'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-4 lg:p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-6 h-6 lg:w-8 lg:h-8 text-purple-100" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  Контент
                </Badge>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-1">
                  {activeBanners.length}
                </p>
                <p className="text-purple-100 text-sm lg:text-base">Активных баннеров</p>
                <div className="mt-2 flex items-center text-xs lg:text-sm text-purple-100">
                  <Star className="w-3 h-3 mr-1" />
                  <span>Промо кампании</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <Card className="xl:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Заказы по часам (24ч)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 lg:h-64 flex items-end space-x-1 lg:space-x-2">
                {hourlyStats.map((stat, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div className="w-full relative">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                        style={{ 
                          height: `${(stat.orders / maxOrdersInHour) * 100}%`,
                          minHeight: stat.orders > 0 ? '8px' : '2px'
                        }}
                        title={`${stat.hour}:00 - ${stat.orders} заказов (${stat.revenue.toFixed(0)}₽)`}
                      >
                        {stat.orders > 0 && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {stat.orders} заказов
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">{stat.hour}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span>Быстрые действия</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingOrders.length > 0 && (
                <Button
                  onClick={() => setLocation("/admin/orders")}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  data-testid="button-process-orders"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Обработать {pendingOrders.length} заказов
                </Button>
              )}
              
              <Button
                onClick={() => setLocation("/admin/banners")}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                data-testid="button-manage-banners"
              >
                <Globe className="w-4 h-4 mr-2" />
                Управление контентом
              </Button>
              
              <Button
                onClick={() => setLocation("/admin/notifications")}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                data-testid="button-send-notifications"
              >
                <Bell className="w-4 h-4 mr-2" />
                Отправить уведомление
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Управление системой
            </h2>
            <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-1">
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Десктоп</span>
              </div>
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <Tablet className="w-4 h-4" />
                <span className="hidden sm:inline">Планшет</span>
              </div>
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Мобильный</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
            {[
              {
                title: "Управление заказами",
                description: "Обработка и статус",
                icon: ShoppingCart,
                gradient: "from-blue-500 to-cyan-500",
                path: "/admin/orders",
                stats: `${orders.length} заказов`,
                urgent: pendingOrders.length > 0
              },
              {
                title: "Баннеры и реклама",
                description: "Управление промо",
                icon: Globe,
                gradient: "from-purple-500 to-pink-500",
                path: "/admin/banners",
                stats: `${activeBanners.length} активных`
              },
              {
                title: "Уведомления",
                description: "Рассылки",
                icon: Bell,
                gradient: "from-green-500 to-emerald-500",
                path: "/admin/notifications",
                stats: "Отправить всем"
              },
              {
                title: "Промокоды",
                description: "Управление скидками",
                icon: CreditCard,
                gradient: "from-orange-500 to-red-500",
                path: "/admin/promocodes",
                stats: "Создать акцию"
              },
              {
                title: "Аналитика",
                description: "Статистика продаж",
                icon: BarChart3,
                gradient: "from-indigo-500 to-purple-500",
                path: "/admin/analytics",
                stats: "Отчеты"
              },
              {
                title: "Настройки",
                description: "Конфигурация",
                icon: Settings,
                gradient: "from-slate-500 to-slate-600",
                path: "/admin/settings",
                stats: "Система"
              }
            ].map((section) => (
              <Card 
                key={section.title}
                className={`group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden relative bg-gradient-to-br ${section.gradient} ${
                  section.urgent ? 'ring-2 ring-orange-400 ring-offset-2 animate-pulse' : ''
                }`}
                onClick={() => setLocation(section.path)}
                data-testid={`card-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-4 lg:p-6 text-white relative">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <section.icon className="w-6 h-6 lg:w-8 lg:h-8 text-white/90 group-hover:text-white transition-colors duration-200" />
                      {section.urgent && (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="w-4 h-4 text-orange-300" />
                          <Badge className="bg-orange-500/20 text-orange-100 border-orange-300/30 text-xs">
                            Срочно
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-sm lg:text-base mb-1">
                        {section.title}
                      </h3>
                      <p className="text-white/80 text-xs lg:text-sm mb-3">
                        {section.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs lg:text-sm text-white/70">
                          {section.stats}
                        </span>
                        <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {orders.length > 0 && (
          <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-white/20 dark:border-slate-700/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Последние заказы</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/admin/orders")}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Смотреть все
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        order.status === 'pending' ? 'bg-orange-500 animate-pulse' :
                        order.status === 'processing' ? 'bg-blue-500' :
                        order.status === 'delivering' ? 'bg-purple-500' :
                        order.status === 'completed' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          Заказ №{order.id.slice(-6)}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {order.deliveryAddress.slice(0, 30)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {parseFloat(order.totalAmount).toFixed(0)}₽
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(order.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}