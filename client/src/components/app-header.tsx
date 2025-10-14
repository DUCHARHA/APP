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
  showThemeToggle?: boolean;
  onBack?: () => void;
}

export default function AppHeader({ 
  title, 
  showBack = false, 
  showLogo = false, 
  showNotifications = true,
  showThemeToggle = true,
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

  const userId = getCurrentUserId();

  return (
    <header className="bg-[#5B21B6] dark:bg-[#5B21B6] shadow-sm">
      <div className="flex items-center justify-between p-3 pt-[10px] pb-[10px] bg-[#5B21B6] dark:bg-[#5B21B6]">
        <div className="flex items-center space-x-3">

          

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
          {showNotifications && <NotificationBell userId={userId} />}
          {showThemeToggle && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}