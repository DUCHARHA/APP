
import { Smartphone, Download } from "lucide-react";
import { usePWA } from "@/contexts/pwa-context";

export default function PWAInstallBannerProfile() {
  const { 
    showInstallBanner, 
    isInstalling, 
    handleInstall
  } = usePWA();

  if (!showInstallBanner) return null;

  return (
    <div className="mx-4 mb-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white rounded-full"></div>
      </div>

      <div className="relative flex items-center">
        <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
          <Smartphone className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">
            Установите приложение ДУЧАРХА
          </h3>
          <p className="text-sm text-purple-100 mb-3">
            Быстрый доступ с главного экрана • Работает офлайн • Без рекламы браузера
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-purple-50 transition-colors disabled:opacity-50"
              data-testid="button-install-pwa"
            >
              <Download className="w-4 h-4" />
              {isInstalling ? 'Установка...' : 'Установить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
