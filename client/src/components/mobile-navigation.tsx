import React, { useCallback, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Grid, ShoppingCart, User, Phone } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/AuthDialog";
import { UserProfile } from "@/components/UserProfile";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { totalItems } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
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
  ];
  
  // Auth/Profile navigation item
  const authIcon = isAuthenticated ? User : Phone;
  const authLabel = isAuthenticated ? (user?.firstName || "Профиль") : "Вход";

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-card border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-4 py-2">
          {navigationItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button
                onClick={handleNavigation}
                className={`flex flex-col items-center py-2 px-1 relative transition-colors ${
                  item.active
                    ? "text-agent-purple"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
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
          
          {/* Auth/Profile button */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                setShowProfileDialog(true);
              } else {
                setShowAuthDialog(true);
              }
            }}
            className="flex flex-col items-center py-2 px-1 relative transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            data-testid={isAuthenticated ? "nav-profile" : "nav-login"}
          >
            {React.createElement(authIcon, { className: "w-6 h-6 mb-1" })}
            <span className="text-xs font-medium truncate max-w-[60px]">{authLabel}</span>
          </button>
        </div>
      </nav>

      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      >
        <span />
      </AuthDialog>

      {/* Profile Dialog - custom modal */}
      {showProfileDialog && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowProfileDialog(false)}>
          <div className="fixed inset-4 bg-white dark:bg-card rounded-lg shadow-lg max-w-md mx-auto mt-20" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Профиль пользователя</h2>
                <button 
                  onClick={() => setShowProfileDialog(false)}
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-close-profile"
                >
                  ✕
                </button>
              </div>
              <UserProfile />
            </div>
          </div>
        </div>
      )}
    </>
  );
}