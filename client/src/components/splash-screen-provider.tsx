import { useState, useEffect, createContext, useContext } from "react";
import { SplashScreen } from "./splash-screen";

interface SplashScreenContextType {
  isLoading: boolean;
  hideSplash: () => void;
}

const SplashScreenContext = createContext<SplashScreenContextType | undefined>(undefined);

export const useSplashScreen = () => {
  const context = useContext(SplashScreenContext);
  if (!context) {
    throw new Error('useSplashScreen must be used within a SplashScreenProvider');
  }
  return context;
};

interface SplashScreenProviderProps {
  children: React.ReactNode;
  minLoadingTime?: number;
  skipInDevelopment?: boolean;
}

export function SplashScreenProvider({ 
  children, 
  minLoadingTime = 2500,
  skipInDevelopment = false 
}: SplashScreenProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Skip splash screen in development mode if requested
    if (skipInDevelopment && import.meta.env.DEV) {
      setIsLoading(false);
      setShowSplash(false);
      return;
    }

    // Initialize app resources
    const initializeApp = async () => {
      const startTime = Date.now();
      
      try {
        // Simulate or perform actual initialization tasks
        await Promise.all([
          // Ensure minimum display time
          new Promise(resolve => setTimeout(resolve, minLoadingTime)),
          
          // Preload critical resources (if needed)
          new Promise(resolve => {
            // You can add actual preloading logic here
            // For example: preload images, initialize services, etc.
            setTimeout(resolve, 500);
          })
        ]);
        
      } catch (error) {
        console.warn('App initialization error:', error);
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      // Ensure minimum display time is met
      setTimeout(() => {
        setIsLoading(false);
        // Let splash screen handle its own fade-out animation
      }, remainingTime);
    };

    initializeApp();
  }, [minLoadingTime, skipInDevelopment]);

  const hideSplash = () => {
    setShowSplash(false);
  };

  const handleAnimationComplete = () => {
    setShowSplash(false);
  };

  return (
    <SplashScreenContext.Provider value={{ isLoading, hideSplash }}>
      {showSplash && (
        <SplashScreen 
          isVisible={isLoading}
          onAnimationComplete={handleAnimationComplete}
          minDisplayTime={minLoadingTime}
        />
      )}
      {/* Always render children, splash screen will overlay when needed */}
      <div className={showSplash && isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
        {children}
      </div>
    </SplashScreenContext.Provider>
  );
}