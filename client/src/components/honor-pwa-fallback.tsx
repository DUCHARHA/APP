
import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { PWADetector } from '../utils/pwa-detection';

export function HonorPWAFallback() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isHonorDevice, setIsHonorDevice] = useState(false);

  useEffect(() => {
    const isHonor = PWADetector.isHonorDevice();
    const isAlreadyPWA = PWADetector.isRunningAsPWA();
    
    setIsHonorDevice(isHonor);
    
    // Показываем инструкции только для Honor устройств, если PWA не установлено
    if (isHonor && !isAlreadyPWA) {
      const hasSeenInstructions = localStorage.getItem('honor-pwa-instructions-seen');
      if (!hasSeenInstructions) {
        setShowInstructions(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowInstructions(false);
    localStorage.setItem('honor-pwa-instructions-seen', 'true');
  };

  if (!showInstructions || !isHonorDevice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Smartphone className="w-6 h-6 text-purple-600" />
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Установка приложения ДУЧАРХА
        </h3>
        
        <p className="text-gray-600 mb-4">
          Для Honor устройств следуйте этим шагам:
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <p className="text-sm text-gray-700">
              Нажмите меню браузера (три точки ⋮)
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <p className="text-sm text-gray-700">
              Выберите "Добавить на главный экран" или "Установить приложение"
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <p className="text-sm text-gray-700">
              Подтвердите установку
            </p>
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg mb-4">
          <p className="text-xs text-purple-700">
            💡 После установки приложение будет открываться как отдельное приложение без адресной строки браузера
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
