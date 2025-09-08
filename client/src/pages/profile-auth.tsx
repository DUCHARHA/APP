import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { isUserAuthenticated, getAuthState } from "@/utils/auth-state";
import AuthScreen from "@/components/auth-screen";
import { lazy } from "react";

const Profile = lazy(() => import("@/pages/profile"));

export default function ProfileAuth() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isUserAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleAuthComplete = () => {
    setIsAuthenticated(true);
  };

  const handleBack = () => {
    setLocation("/");
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B21B6] mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthComplete={handleAuthComplete}
        onBack={handleBack}
      />
    );
  }

  // Show profile if authenticated
  return <Profile />;
}