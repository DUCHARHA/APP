import { Link } from "wouter";
import { ArrowLeft, User, MapPin, Clock, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function Profile() {
  const userId = "demo-user";
  const [user, setUser] = useState({
    name: "Анна Иванова",
    email: "anna@example.com",
    phone: "+7 (999) 123-45-67",
    address: "ул. Пушкина, 25, кв. 10",
  });
  const [joinDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // 90 дней назад

  // Загружаем данные пользователя из localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      setUser(JSON.parse(savedProfile));
    }
  }, []);

  // Получаем реальные данные заказов
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders", userId],
  });

  const calculateStats = () => {
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(order => order.status === "delivered");
    const avgDeliveryTime = deliveredOrders.length > 0 ? 13 : 0; // В среднем 13 минут
    const daysWithUs = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      totalOrders,
      avgDeliveryTime,
      daysWithUs
    };
  };

  const stats = calculateStats();

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

  return (
    <main className="pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center p-4">
          <Link href="/">
            <button className="mr-3 p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
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

      {/* Delivery Address */}
      <section className="px-4 pb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-electric-green/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-electric-green" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Адрес доставки</h4>
                <p className="text-sm text-gray-500">{user.address}</p>
              </div>
            </div>
            <button className="text-agent-purple text-sm font-medium">
              Изменить
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Статистика</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-agent-purple">{stats.totalOrders}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Заказов</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-electric-green">
                {stats.avgDeliveryTime > 0 ? stats.avgDeliveryTime : '--'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Минут в среднем</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-bright-orange">{stats.daysWithUs}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Дней с нами</div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <button className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
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
    </main>
  );
}