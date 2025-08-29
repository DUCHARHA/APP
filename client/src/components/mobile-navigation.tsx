import { useLocation } from "wouter";
import { Home, Grid, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCallback } from "react";

export default function MobileNavigation() {
  const [location, setLocation] = useLocation();
  const { totalItems } = useCart();
  
  // Enhanced navigation handler with haptic feedback
  const handleNavigation = useCallback((path: string) => {
    return (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      
      // Haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
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
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-card border-t border-gray-200 dark:border-gray-700 z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-4 py-1 pb-safe">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={handleNavigation(item.path)}
            onTouchStart={handleNavigation(item.path)}
            className={`
              flex flex-col items-center py-3 px-2 relative transition-all duration-200 
              min-h-[60px] active:scale-95 active:bg-gray-100 dark:active:bg-gray-800
              ${item.active 
                ? 'text-[#5B21B6] bg-purple-50 dark:bg-purple-900/20' 
                : 'text-gray-600 dark:text-gray-400 hover:text-[#5B21B6] hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
            aria-label={item.label}
            role="tab"
            aria-selected={item.active}
          >
            <item.icon className={`w-6 h-6 mb-1 transition-transform ${item.active ? 'scale-110' : ''}`} />
            <span className={`text-xs font-medium transition-all ${item.active ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-bright-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
