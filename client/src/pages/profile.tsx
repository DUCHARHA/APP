import { Link } from "wouter";
import { ArrowLeft, MapPin, Clock, CreditCard, Bell, HelpCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/AuthDialog";
import { UserProfile } from "@/components/UserProfile";
import { type Order } from "@shared/schema";

export default function Profile() {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Получаем реальные данные заказов только для авторизованных пользователей
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <main className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/">
              <button className="mr-3 p-2 -ml-2" data-testid="button-back">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agent-purple"></div>
        </div>
      </main>
    );
  }

  // Если пользователь не авторизован, показываем форму входа
  if (!isAuthenticated) {
    return (
      <main className="pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center p-4">
            <Link href="/">
              <button className="mr-3 p-2 -ml-2" data-testid="button-back">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ArrowLeft className="w-12 h-12 text-gray-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Добро пожаловать!
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm">
            Войдите в аккаунт, чтобы управлять заказами, адресами и получать персональные скидки
          </p>
          
          <AuthDialog>
            <Button size="lg" className="w-full max-w-sm" data-testid="button-login-main">
              Войти в ДУЧАРХА
            </Button>
          </AuthDialog>
        </div>
      </main>
    );
  }

  const menuItems = [
    {
      icon: Clock,
      label: "История заказов",
      description: `${orders.length} заказов`,
      href: "/orders",
    },
    {
      icon: MapPin,
      label: "Адреса доставки",
      description: "Управление адресами",
      href: "/addresses",
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
            <button className="mr-3 p-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
        </div>
      </header>

      {/* User Info with integrated UserProfile */}
      <section className="p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <UserProfile />
        </div>
      </section>

      {/* Menu Items */}
      <section className="px-4 pb-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <button 
                className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
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
          <Button className="bg-white text-agent-purple hover:bg-gray-100" data-testid="button-premium">
            Узнать больше
          </Button>
        </div>
      </section>

      {/* Version info with hidden admin access */}
      <section className="px-4 pb-8">
        <div 
          className="text-center py-2 cursor-pointer"
          onClick={(e) => {
            const target = e.currentTarget as HTMLElement;
            const clicks = parseInt(target.dataset.clicks || "0") + 1;
            target.dataset.clicks = clicks.toString();
            if (clicks >= 5) {
              window.location.href = "/admin/login";
            }
          }}
          data-testid="version-info"
        >
          <p className="text-xs text-gray-400">ДУЧАРХА v2.0.0</p>
        </div>
      </section>
    </main>
  );
}