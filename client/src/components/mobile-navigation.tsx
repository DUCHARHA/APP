import { useLocation } from "wouter";
import { Home, Grid, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCallback } from "react";

export default function MobileNavigation() {
  const [location, setLocation] = useLocation();
  const { totalItems } = useCart();
  
  // Simple navigation handler without debouncing
  const handleNavigation = useCallback((path: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      // Only navigate if we're not already on this path
      if (location !== path) {
        setLocation(path);
      }
    };
  }, [location, setLocation]);

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
          <button
            key={item.path}
            onClick={handleNavigation(item.path)}
            className="flex flex-col items-center py-3 px-2 relative transition-colors text-[#5B21B6] ml-[12px] mr-[12px] mt-[2px] mb-[2px] pl-[8px] pr-[8px] pt-[12px] pb-[12px]"
          >
            <item.icon className="w-7 h-7" />
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-bright-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
