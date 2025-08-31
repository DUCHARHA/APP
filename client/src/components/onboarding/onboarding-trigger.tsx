import React, { useEffect } from 'react';
import { useOnboarding } from './onboarding-provider';
import { useGeolocation } from '@/hooks/use-geolocation';

export const OnboardingTrigger: React.FC = () => {
  const { isOnboardingComplete, startOnboarding } = useOnboarding();
  const { location } = useGeolocation();

  // Location permission request disabled for now
  // This prevents the location popup during onboarding
  useEffect(() => {
    // Location functionality temporarily disabled
    if (!isOnboardingComplete) {
      console.log('Onboarding started - location requests disabled');
    }
  }, [isOnboardingComplete]);

  return null; // This component doesn't render anything visible
};