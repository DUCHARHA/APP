import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200 z-40">
      <div className="flex items-center">
        <div className="bg-agent-purple p-2 rounded-lg mr-3">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">
            Установить приложение
          </h4>
          <p className="text-xs text-gray-500">
            Быстрый доступ с главного экрана
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-agent-purple text-white px-3 py-1 rounded-lg text-sm font-medium ml-2"
        >
          Установить
        </button>
        <button
          onClick={handleClose}
          className="p-2 text-gray-400 ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
