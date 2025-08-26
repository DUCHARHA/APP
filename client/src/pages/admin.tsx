import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Package, 
  Users, 
  TrendingUp, 
  Bell, 
  Settings, 
  Image as ImageIcon,
  CreditCard,
  BarChart3,
  Activity,
  Plus,
  ArrowRight,
  ChevronRight,
  LogOut,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type Order, type Banner } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Проверка авторизации
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin/login");
      return;
    }
  }, [setLocation]);

  // Получаем данные для статистики
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        setLocation("/admin/login");
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ["/api/admin/banners"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/banners", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        setLocation("/admin/login");
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to fetch banners");
      return res.json();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin/login");
  };

  // Вычисляем статистику
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt!).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  });

  const pendingOrders = orders.filter(order => order.status === "pending");
  const activeBanners = banners.filter(banner => banner.isActive);
  const totalRevenue = orders
    .filter(order => order.status === "completed")
    .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  const adminSections = [
    {
      title: "Управление заказами",
      description: "Обработка и статус заказов",
      icon: Package,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      path: "/admin/orders",
      stats: `${pendingOrders.length} новых`,
      priority: true
    },
    {
      title: "Баннеры и реклама",
      description: "Управление промо-баннерами",
      icon: ImageIcon,
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      path: "/admin/banners",
      stats: `${activeBanners.length} активных`
    },
    {
      title: "Уведомления",
      description: "Рассылки и уведомления",
      icon: Bell,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      path: "/admin/notifications",
      stats: "Отправить всем"
    },
    {
      title: "Промокоды",
      description: "Управление скидками",
      icon: CreditCard,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      path: "/admin/promocodes",
      stats: "3 активных"
    },
    {
      title: "Аналитика",
      description: "Статистика продаж",
      icon: BarChart3,
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
      path: "/admin/analytics",
      stats: "Отчеты"
    },
    {
      title: "Настройки",
      description: "Конфигурация системы",
      icon: Settings,
      color: "bg-gray-500",
      hoverColor: "hover:bg-gray-600",
      path: "/admin/settings",
      stats: "Система"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Панель управления ДУЧАРХА
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Добро пожаловать в административную панель
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Заказы сегодня</p>
                  <p className="text-3xl font-bold">{todayOrders.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Выручка</p>
                  <p className="text-3xl font-bold">{totalRevenue.toFixed(0)}₽</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Новые заказы</p>
                  <p className="text-3xl font-bold">{pendingOrders.length}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Активные баннеры</p>
                  <p className="text-3xl font-bold">{activeBanners.length}</p>
                </div>
                <ImageIcon className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {pendingOrders.length > 0 && (
          <div className="mb-8">
            <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                        У вас {pendingOrders.length} новых заказов
                      </h3>
                      <p className="text-orange-700 dark:text-orange-300">
                        Требуется обработка заказов
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setLocation("/admin/orders")}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="button-process-orders"
                  >
                    Обработать
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Navigation */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Управление системой
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section) => (
              <Card 
                key={section.title}
                className={`group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 overflow-hidden ${
                  section.priority ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''
                }`}
                onClick={() => setLocation(section.path)}
                data-testid={`card-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${section.color} ${section.hoverColor} transition-colors group-hover:scale-110 transform duration-200`}>
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    {section.priority && (
                      <Badge variant="destructive" className="text-xs">
                        Требует внимания
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {section.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {section.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {section.stats}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span>Последние заказы</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Заказ #{order.id.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt!).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {parseFloat(order.totalAmount).toFixed(0)}₽
                      </p>
                      <Badge variant={order.status === "pending" ? "destructive" : "default"}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-purple-500" />
                <span>Активные баннеры</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeBanners.slice(0, 5).map((banner) => (
                  <div key={banner.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {banner.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {banner.type}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        Приоритет {banner.priority}
                      </Badge>
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: banner.backgroundColor || "#6366f1" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}