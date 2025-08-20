import { Link, useLocation } from "wouter";
import { Home, Grid, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCallback } from "react";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { totalItems } = useCart();
  
  // Prevent rapid navigation clicks
  const handleNavigation = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.style.pointerEvents === 'none') {
      e.preventDefault();
      return;
    }
    target.style.pointerEvents = 'none';
    setTimeout(() => {
      target.style.pointerEvents = 'auto';
    }, 300);
  }, []);

  const navigationItems = [
    {
      path: "/",
      icon: Home,
      label: "Главная",
      active: location === "/",
    },
    {
      path: "/catalog",
      icon: Grid,
      label: "Каталог",
      active: location.startsWith("/catalog"),
    },
    {
      path: "/checkout",
      icon: ShoppingCart,
      label: "Корзина",
      active: location === "/checkout" || location === "/cart",
      badge: totalItems,
    },
    {
      path: "/profile",
      icon: User,
      label: "Профиль",
      active: location === "/profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-card border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-4 py-2 pt-[0px] pb-[0px]">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="text-center ml-[0px] mr-[0px] pl-[25px] pr-[25px]">
            <button
              onClick={handleNavigation}
              className="flex flex-col items-center py-2 px-1 relative transition-colors pl-[0px] pr-[0px] ml-[33px] mr-[33px] text-center text-[#8B5CF6]"
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-bright-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
