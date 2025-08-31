
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { getCurrentUserId } from "@/utils/user-session";
import { useGeolocation } from "@/hooks/use-geolocation";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
}

export default function AppHeader({ 
  title, 
  showBack = false, 
  showLogo = false, 
  showNotifications = true,
  onBack 
}: AppHeaderProps) {
  const [, setLocation] = useLocation();
  const { location } = useGeolocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="bg-[#5B21B6] dark:bg-[#5B21B6] shadow-sm">
      <div className="flex items-center justify-between p-4 pt-[10px] pb-[10px] bg-[#5B21B6] dark:bg-[#5B21B6]">
        <div className="flex items-center space-x-3">
          {showBack && (
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
          )}
          
          {showLogo && (
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img 
                src="/icons/logo.png" 
                alt="ДУЧАРХА" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div>
            <h1 className="text-xl font-bold text-white dark:text-gray-100">
              {title || "ДУЧАРХА"}
            </h1>
            {showLogo && (
              <p className="text-xs text-purple-200 dark:text-gray-400">
                Доставка от 15 минут
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {showNotifications && (
            <NotificationBell userId={getCurrentUserId()} />
          )}
        </div>
      </div>
    </header>
  );
}
