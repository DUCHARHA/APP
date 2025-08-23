import React, { useEffect } from 'react';
import { useOnboarding } from './onboarding-provider';
import { useGeolocation } from '@/hooks/use-geolocation';

export const OnboardingTrigger: React.FC = () => {
  const { isOnboardingComplete, startOnboarding } = useOnboarding();
  const { location } = useGeolocation();

  // Auto-request location permission after onboarding starts
  useEffect(() => {
    if (!isOnboardingComplete) {
      // Request geolocation permission as part of onboarding
      navigator.geolocation?.getCurrentPosition(
        () => {
          // Location permission granted
          console.log('Location permission granted during onboarding');
        },
        () => {
          // Location permission denied or unavailable
          console.log('Location permission denied or unavailable');
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    }
  }, [isOnboardingComplete]);

  return null; // This component doesn't render anything visible
};