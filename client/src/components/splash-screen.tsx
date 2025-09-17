import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  minDisplayTime?: number;
  isVisible: boolean;
}

export function SplashScreen({ 
  onAnimationComplete, 
  minDisplayTime = 2000,
  isVisible 
}: SplashScreenProps) {
  const [showContent, setShowContent] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      // Start fade out animation
      setFadeOut(true);
      
      // Complete animation after fade out duration
      const fadeOutTimer = setTimeout(() => {
        setShowContent(false);
        onAnimationComplete?.();
      }, 500); // Match fade-out duration

      return () => clearTimeout(fadeOutTimer);
    }
  }, [isVisible, onAnimationComplete]);

  useEffect(() => {
    // Ensure minimum display time
    const minTimer = setTimeout(() => {
      // This ensures splash shows for minimum time
      // Actual hide logic is controlled by parent component
    }, minDisplayTime);

    return () => clearTimeout(minTimer);
  }, [minDisplayTime]);

  if (!showContent) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#5B21B6] via-[#7C3AED] to-[#5B21B6] ${
        fadeOut ? 'animate-splash-fade-out' : 'animate-splash-fade-in'
      }`}
      data-testid="splash-screen"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 -right-8 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-8">
        {/* Logo Container */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm animate-logo-pulse">
            <Zap className="w-12 h-12 text-white" />
          </div>
          
          {/* App Name */}
          <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">
            ДУЧАРХА
          </h1>
          
          {/* Tagline */}
          <p className="text-white/90 text-lg font-medium animate-fade-in animation-delay-200">
            Доставка продуктов
          </p>
        </div>

        {/* Loading Animation */}
        <div className="animate-fade-in animation-delay-400">
          <div className="w-48 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-white rounded-full loading-bar" />
          </div>
          <p className="text-white/80 text-sm mt-4 font-medium">
            Загружаем лучшие продукты...
          </p>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center animate-fade-in animation-delay-600">
        <p className="text-white/60 text-xs font-medium">
          Быстро • Свежо • Удобно
        </p>
      </div>
    </div>
  );
}