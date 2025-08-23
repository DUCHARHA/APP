import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUserId } from '@/utils/user-session';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  isOnboardingActive: boolean;
  currentStep: number;
  totalSteps: number;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const userId = getCurrentUserId();
  const storageKey = `ducharkha_onboarding_${userId}`;

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(storageKey);
    
    if (!hasCompletedOnboarding) {
      setIsOnboardingComplete(false);
      // Auto-start onboarding for new users after a short delay
      setTimeout(() => {
        setIsOnboardingActive(true);
      }, 1000);
    }
  }, [storageKey]);

  const startOnboarding = () => {
    setCurrentStep(1);
    setIsOnboardingActive(true);
  };

  const completeOnboarding = () => {
    setIsOnboardingActive(false);
    setIsOnboardingComplete(true);
    localStorage.setItem(storageKey, 'completed');
    localStorage.setItem(`${storageKey}_date`, new Date().toISOString());
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const value: OnboardingContextType = {
    isOnboardingComplete,
    isOnboardingActive,
    currentStep,
    totalSteps,
    startOnboarding,
    completeOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};