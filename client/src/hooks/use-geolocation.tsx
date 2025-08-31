import { useState, useEffect } from "react";

interface GeolocationState {
  location: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  // Temporarily disabled automatic geolocation requests
  // This prevents the browser from showing location permission popups
  // Location functionality can be re-enabled later when needed
  useEffect(() => {
    // Auto-location detection is disabled for now
    setState({
      location: null,
      error: null,
      loading: false,
    });
  }, []);

  return state;
}
