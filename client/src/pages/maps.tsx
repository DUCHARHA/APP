import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Search, ArrowLeft, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import LocationPermissionDialog from "@/components/LocationPermissionDialog";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useDebounce } from "@/hooks/use-debounce";

// Declare global ymaps type
declare global {
  interface Window {
    ymaps: any;
  }
}

interface MapData {
  map: any;
  storeMarker: any;
  customerMarker: any;
  route: any;
}

interface HoverTooltipData {
  visible: boolean;
  coordinates: [number, number] | null;
  address: string;
  loading: boolean;
  error: boolean;
}


const DUSHANBE_CENTER = [38.5598, 68.7870]; // Яндекс Карты: [широта, долгота]
const STORE_COORDINATES = [38.5598, 68.7870]; // Центр Душанбе

export default function Maps() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapDataRef = useRef<MapData | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [pendingUserLocation, setPendingUserLocation] = useState<GeolocationPosition | null>(null);
  const [hoverData, setHoverData] = useState<HoverTooltipData>({
    visible: false,
    coordinates: null,
    address: '',
    loading: false,
    error: false
  });
  
  // Debounce coordinates for geocoding to avoid too many API calls
  const debouncedCoordinates = useDebounce(hoverData.coordinates, 750);
  const { toast } = useToast();
  const { requestLocation, loading: locationLoading, error: locationError } = useGeolocation();

  // Geocode coordinates to get address on hover
  const geocodeCoordinates = useCallback(async (coordinates: [number, number]) => {
    if (!window.ymaps || !coordinates) return;

    try {
      setHoverData(prev => ({ ...prev, loading: true, error: false }));
      
      const geocoder = window.ymaps.geocode(coordinates, { results: 1 });
      const result = await geocoder;
      
      const firstResult = result.geoObjects.get(0);
      if (firstResult) {
        const address = firstResult.getAddressLine();
        setHoverData(prev => ({ 
          ...prev, 
          address: address || 'Адрес не найден',
          loading: false,
          error: false
        }));
      } else {
        setHoverData(prev => ({ 
          ...prev, 
          address: 'Адрес не найден',
          loading: false,
          error: true
        }));
      }
    } catch (error) {
      console.warn('Geocoding error on hover:', error);
      setHoverData(prev => ({ 
        ...prev, 
        address: 'Ошибка загрузки адреса',
        loading: false,
        error: true
      }));
    }
  }, []);

  // Effect to geocode coordinates when they change (debounced)
  useEffect(() => {
    if (debouncedCoordinates && hoverData.visible) {
      geocodeCoordinates(debouncedCoordinates);
    }
  }, [debouncedCoordinates, hoverData.visible, geocodeCoordinates]);

  // Helper function to apply user location to map
  const applyUserLocationToMap = (position: GeolocationPosition) => {
    if (!mapDataRef.current?.map || !window.ymaps) return;

    const userCoordinates: [number, number] = [
      position.coords.latitude,
      position.coords.longitude
    ];

    // Center map on user location
    mapDataRef.current.map.setCenter(userCoordinates, 15, { duration: 1000 });

    // Add user location marker
    if (mapDataRef.current.customerMarker) {
      mapDataRef.current.map.geoObjects.remove(mapDataRef.current.customerMarker);
    }

    const userMarker = new window.ymaps.Placemark(userCoordinates, {
      balloonContent: 'Ваше местоположение',
      hintContent: 'Вы находитесь здесь'
    }, {
      preset: 'islands#greenDotIcon'
    });

    mapDataRef.current.map.geoObjects.add(userMarker);
    mapDataRef.current.customerMarker = userMarker;

    // Get address for the location
    const geocoder = window.ymaps.geocode(userCoordinates, { results: 1 });
    geocoder.then((result: any) => {
      const firstResult = result.geoObjects.get(0);
      if (firstResult) {
        const address = firstResult.getAddressLine();
        toast({
          title: "Местоположение определено",
          description: `Ваше местоположение: ${address}`,
        });
      }
    }).catch((error: any) => {
      console.warn('Could not get address for user location:', error);
    });

    toast({
      title: "Местоположение найдено",
      description: "Карта центрирована на вашем местоположении",
    });
  };

  // Apply pending location when map becomes ready
  useEffect(() => {
    if (isMapReady && pendingUserLocation && mapDataRef.current?.map) {
      applyUserLocationToMap(pendingUserLocation);
      setPendingUserLocation(null); // Clear pending location
    }
  }, [isMapReady, pendingUserLocation]);

  // Handle location permission response
  const handleLocationPermission = async (permission: "while_using" | "once" | "deny") => {
    setShowLocationDialog(false);

    if (permission === "deny") {
      toast({
        title: "Геолокация отклонена",
        description: "Вы можете воспользоваться поиском для нахождения адреса",
      });
      return;
    }

    try {
      const position = await requestLocation(permission);
      
      if (position) {
        if (mapDataRef.current?.map && isMapReady) {
          // Map is ready, apply location immediately
          applyUserLocationToMap(position);
        } else {
          // Map not ready yet, store for later application
          setPendingUserLocation(position);
          toast({
            title: "Местоположение получено",
            description: "Применим местоположение когда карта будет готова",
          });
        }
      }
    } catch (error) {
      console.error('Location request failed:', error);
      toast({
        title: "Не удалось получить местоположение",
        description: locationError || "Попробуйте воспользоваться поиском для нахождения адреса",
        variant: "destructive"
      });
    }
  };

  // Get Yandex Maps API key
  const { data: config } = useQuery<{ apiKey: string }>({
    queryKey: ["/api/config/yandex-maps"],
    staleTime: Infinity, // API key doesn't change frequently
  });

  // Initialize map
  useEffect(() => {
    if (!config?.apiKey || !mapRef.current) return;

    // Load Yandex Maps script dynamically with API key
    const loadYandexMaps = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if script already exists and validate coordinate order
        const existingScript = document.getElementById('ymaps-script') as HTMLScriptElement;
        if (existingScript && window.ymaps) {
          // Check if the existing API uses the correct coordinate order
          const coordinatesOrder = (window.ymaps as any)?.meta?.coordinatesOrder;
          const scriptSrc = existingScript.src || '';
          
          if (coordinatesOrder !== 'latlong' || !scriptSrc.includes('coordorder=latlong')) {
            // Remove stale script and API instance with wrong coordinate order
            existingScript.remove();
            delete (window as any).ymaps;
          } else {
            resolve();
            return;
          }
        }

        // Check if script is already being loaded
        if (document.getElementById('ymaps-script')) {
          // Wait for existing script to load
          const existingScript = document.getElementById('ymaps-script') as HTMLScriptElement;
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load Yandex Maps')));
          return;
        }

        // Create and load script
        const script = document.createElement('script');
        script.id = 'ymaps-script';
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${config.apiKey}&lang=ru_RU&load=package.full&coordorder=latlong`;
        script.defer = true;
        
        script.addEventListener('load', () => resolve());
        script.addEventListener('error', () => reject(new Error('Failed to load Yandex Maps')));
        
        document.head.appendChild(script);
      });
    };

    // Initialize map after script loads
    const initMap = async () => {
      try {
        await loadYandexMaps();
        
        if (!window.ymaps) {
          throw new Error('Yandex Maps not available');
        }

        window.ymaps.ready(() => {
        try {
          // Create map centered on Dushanbe
          const map = new window.ymaps.Map(mapRef.current, {
            center: DUSHANBE_CENTER,
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl']
          });
          
          // Mark map as ready
          setIsMapReady(true);
          
          // Explicitly verify and set center after initialization
          setTimeout(() => {
            // Force center to Dushanbe with immediate duration
            map.setCenter(DUSHANBE_CENTER, 12, { duration: 0 });
          }, 100);

          // Add store marker
          const storeMarker = new window.ymaps.Placemark(STORE_COORDINATES, {
            balloonContent: 'ДУЧАРХА - Магазин',
            hintContent: 'Наш магазин'
          }, {
            preset: 'islands#redDotIcon'
          });

          map.geoObjects.add(storeMarker);


          // Add hover event listeners to the map
          map.events.add('mousemove', (e: any) => {
            const coordinates = e.get('coords') as [number, number];
            setHoverData(prev => ({
              ...prev,
              visible: true,
              coordinates: coordinates
            }));
          });

          map.events.add('mouseleave', () => {
            setHoverData(prev => ({
              ...prev,
              visible: false,
              coordinates: null,
              address: '',
              loading: false,
              error: false
            }));
          });

          // Store map data for later use
          mapDataRef.current = {
            map,
            storeMarker,
            customerMarker: null,
            route: null
          };

        } catch (error) {
          console.error('Map initialization error:', error);
          toast({
            title: "Ошибка загрузки карты",
            description: "Не удалось загрузить карту. Попробуйте обновить страницу.",
            variant: "destructive"
          });
        }
        });

      } catch (error) {
        console.error('Yandex Maps loading error:', error);
        toast({
          title: "Ошибка загрузки карт",
          description: "Не удалось загрузить Яндекс.Карты. Проверьте подключение к интернету.",
          variant: "destructive"
        });
      }
    };

    initMap();

    // Cleanup on unmount
    return () => {
      if (mapDataRef.current?.map) {
        mapDataRef.current.map.destroy();
        mapDataRef.current = null;
      }
    };
  }, [config?.apiKey]);




  // Search for address
  const searchForAddress = async () => {
    if (!searchAddress.trim() || !mapDataRef.current || !config?.apiKey) {
      toast({
        title: "Введите адрес",
        description: "Пожалуйста, введите адрес для поиска",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use Yandex Geocoder to find address
      const geocoder = window.ymaps.geocode(`Душанбе, ${searchAddress}`, {
        results: 1
      });

      geocoder.then((result: any) => {
        const firstResult = result.geoObjects.get(0);
        
        if (!firstResult) {
          toast({
            title: "Адрес не найден",
            description: "Попробуйте изменить запрос или указать более точный адрес",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const coordinates = firstResult.geometry.getCoordinates();
        const addressName = firstResult.getAddressLine();

        // Remove existing customer marker
        if (mapDataRef.current?.customerMarker) {
          mapDataRef.current.map.geoObjects.remove(mapDataRef.current.customerMarker);
        }

        // Add customer marker
        const customerMarker = new window.ymaps.Placemark(coordinates, {
          balloonContent: `Адрес доставки: ${addressName}`,
          hintContent: 'Адрес доставки'
        }, {
          preset: 'islands#blueDotIcon'
        });

        mapDataRef.current!.map.geoObjects.add(customerMarker);
        mapDataRef.current!.customerMarker = customerMarker;

        // Center map to show both markers
        const bounds = mapDataRef.current!.map.geoObjects.getBounds();
        mapDataRef.current!.map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 50
        });

        toast({
          title: "Адрес найден",
          description: `Найден адрес: ${addressName}`,
        });

        setIsLoading(false);
      }).catch((error: any) => {
        console.error('Geocoding error:', error);
        toast({
          title: "Ошибка поиска",
          description: "Не удалось найти указанный адрес",
          variant: "destructive"
        });
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Ошибка поиска",
        description: "Произошла ошибка при поиске адреса",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Build route from store to customer
  const buildRoute = () => {
    if (!mapDataRef.current?.customerMarker || !config?.apiKey) {
      toast({
        title: "Сначала найдите адрес",
        description: "Укажите адрес доставки для построения маршрута",
        variant: "destructive"
      });
      return;
    }

    try {
      const customerCoordinates = mapDataRef.current!.customerMarker.geometry.getCoordinates();

      // Remove existing route
      if (mapDataRef.current!.route) {
        mapDataRef.current!.map.geoObjects.remove(mapDataRef.current!.route);
      }

      // Build route
      const multiRoute = new window.ymaps.multiRouter.MultiRoute({
        referencePoints: [STORE_COORDINATES, customerCoordinates],
        params: {
          routingMode: 'auto'
        }
      }, {
        boundsAutoApply: true,
        routeActiveStrokeWidth: 6,
        routeActiveStrokeColor: '#5B21B6'
      });

      mapDataRef.current!.map.geoObjects.add(multiRoute);
      mapDataRef.current!.route = multiRoute;

      // Get route info
      multiRoute.model.events.add('requestsuccess', () => {
        const activeRoute = multiRoute.getActiveRoute();
        if (activeRoute) {
          const distance = activeRoute.properties.get('distance');
          const duration = activeRoute.properties.get('duration');
          
          const distanceText = distance.text;
          const durationText = duration.text;

          toast({
            title: "Маршрут построен",
            description: `Расстояние: ${distanceText}, время в пути: ${durationText}`,
          });
        }
      });

    } catch (error) {
      console.error('Route building error:', error);
      toast({
        title: "Ошибка построения маршрута",
        description: "Не удалось построить маршрут",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchForAddress();
    }
  };

  if (!config?.apiKey) {
    return (
      <div className="p-4 min-h-screen bg-background">
        <div className="text-center py-8">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Загрузка карты...</h2>
          <p className="text-muted-foreground">Подготавливаем карту для вас</p>
        </div>
      </div>
    );
  }

  // Show loading screen while map is initializing
  if (!isMapReady) {
    return (
      <>
        <div className="flex flex-col h-screen bg-background">
          {/* Map Container with Loading Overlay */}
          <div className="flex-1 relative">
            <div 
              ref={mapRef} 
              className="w-full h-full"
              data-testid="map-container"
            />
            {/* Loading Overlay */}
            <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-900/80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Загрузка карты...</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Подготавливаем карту</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Location Permission Dialog */}
        <LocationPermissionDialog
          open={showLocationDialog}
          onPermissionResponse={handleLocationPermission}
          isLoading={locationLoading}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground flex-1 text-center">
            🗺️ Карта доставки
          </h1>
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm" 
              data-testid="button-close"
              className="border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Search and Route Controls */}
        <>
            {/* Search Bar */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-address-search"
                  type="text"
                  placeholder="Введите адрес доставки..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              <Button 
                data-testid="button-search-address"
                onClick={searchForAddress}
                disabled={isLoading}
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                data-testid="button-build-route"
                onClick={buildRoute}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Маршрут
              </Button>
            </div>
        </>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef} 
          className="w-full h-full"
          data-testid="map-container"
        />
        
        {/* Hover Address Display - positioned at top of map */}
        {hoverData.visible && (
          <div 
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] 
                       bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm 
                       border border-gray-200 dark:border-gray-700 
                       rounded-lg shadow-lg px-4 py-3 min-w-[280px] max-w-[90%]"
            data-testid="hover-address-tooltip"
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {hoverData.loading ? (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm">Загрузка адреса...</span>
                  </div>
                ) : hoverData.error ? (
                  <div className="text-sm text-amber-600 dark:text-amber-400">
                    {hoverData.address}
                  </div>
                ) : (
                  <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {hoverData.address}
                  </div>
                )}
                
                {/* Show coordinates as secondary info */}
                {hoverData.coordinates && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {hoverData.coordinates[0].toFixed(6)}, {hoverData.coordinates[1].toFixed(6)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Small arrow pointing down to map */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 rotate-45"></div>
          </div>
        )}
      </div>

      
      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        open={showLocationDialog}
        onPermissionResponse={handleLocationPermission}
        isLoading={locationLoading}
      />
    </div>
  );
}