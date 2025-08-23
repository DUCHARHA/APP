import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';
import { useOnboarding } from './onboarding-provider';

export const ReturningUserWelcome: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const { isOnboardingComplete, startOnboarding } = useOnboarding();

  useEffect(() => {
    // Show welcome message for returning users (but not immediately)
    if (isOnboardingComplete) {
      const hasSeenReturningMessage = localStorage.getItem('ducharkha_returning_welcome_shown');
      
      // Show returning user welcome only once per session
      if (!hasSeenReturningMessage && !sessionStorage.getItem('returning_welcome_shown')) {
        setTimeout(() => {
          setShowWelcome(true);
          sessionStorage.setItem('returning_welcome_shown', 'true');
        }, 2000);
      }
    }
  }, [isOnboardingComplete]);

  const handleDismiss = () => {
    setShowWelcome(false);
    localStorage.setItem('ducharkha_returning_welcome_shown', 'true');
  };

  const handleReplayOnboarding = () => {
    setShowWelcome(false);
    startOnboarding();
  };

  if (!showWelcome) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <div className="bg-white rounded-xl shadow-lg border p-4 max-w-sm mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              С возвращением! 👋
            </h3>
            <p className="text-sm text-gray-600">
              Рады видеть вас снова в ДУЧАРХА. Готовы к новым покупкам?
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 rounded-full ml-2"
            data-testid="button-dismiss-welcome"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReplayOnboarding}
            className="text-xs"
            data-testid="button-replay-onboarding"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Показать гид
          </Button>
          <Button
            size="sm"
            onClick={handleDismiss}
            className="text-xs bg-[#5B21B6] hover:bg-[#5B21B6]/90"
            data-testid="button-start-shopping"
          >
            Начать покупки
          </Button>
        </div>
      </div>
    </div>
  );
};