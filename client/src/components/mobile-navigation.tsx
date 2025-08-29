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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 max-w-md mx-auto">
      <div className="grid grid-cols-4 py-2 pt-[0px] pb-[0px]">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={handleNavigation(item.path)}
            className="flex flex-col items-center py-2 px-1 relative transition-colors text-[#5B21B6] ml-[18px] mr-[18px] mt-[-5px] mb-[-5px] pl-[5px] pr-[5px] pt-[8px] pb-[8px]"
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
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