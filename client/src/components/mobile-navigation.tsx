import { Link, useLocation } from "wouter";
import { Home, Grid, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCallback, useRef, useEffect } from "react";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { totalItems } = useCart();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Prevent rapid navigation clicks
  const handleNavigation = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.style.pointerEvents === 'none') {
      e.preventDefault();
      return;
    }
    target.style.pointerEvents = 'none';
    
    // Clear previous timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      target.style.pointerEvents = 'auto';
      timeoutRef.current = null;
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
      path: "/cart",
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
          <Link key={item.path} href={item.path}>
            <button
              onClick={handleNavigation}
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
          </Link>
        ))}
      </div>
    </nav>
  );
}
