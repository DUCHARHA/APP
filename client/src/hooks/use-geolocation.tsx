import { useState, useCallback } from "react";

interface GeolocationState {
  location: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
}

type PermissionType = "while_using" | "once" | "deny";

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(async (permissionType: PermissionType): Promise<GeolocationPosition | null> => {
    if (permissionType === "deny") {
      setState({
        location: null,
        error: "Location access denied by user",
        loading: false,
      });
      return null;
    }

    if (!navigator.geolocation) {
      const error = "Geolocation is not supported by this browser";
      setState({
        location: null,
        error,
        loading: false,
      });
      throw new Error(error);
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const options: PositionOptions = {
          enableHighAccuracy: permissionType === "while_using" ? true : false,
          timeout: 10000,
          maximumAge: permissionType === "once" ? 0 : 300000, // 5 minutes for "while_using", always fresh for "once"
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(position);
          },
          (error) => {
            let errorMessage: string;
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Location access denied by user";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information unavailable";
                break;
              case error.TIMEOUT:
                errorMessage = "Location request timed out";
                break;
              default:
                errorMessage = "An unknown error occurred while retrieving location";
                break;
            }
            reject(new Error(errorMessage));
          },
          options
        );
      });

      setState({
        location: position,
        error: null,
        loading: false,
      });

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get location";
      setState({
        location: null,
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      location: null,
      error: null,
      loading: false,
    });
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation,
  };
}
