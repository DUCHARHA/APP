import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Search, Check, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

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

interface SelectedAddress {
  coordinates: [number, number];
  address: string;
  description: string;
}

const DUSHANBE_CENTER = [38.559772, 68.787038];
const STORE_COORDINATES = [38.559772, 68.787038]; // Пока используем центр Душанбе, пользователь укажет свои координаты

export default function Maps() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapDataRef = useRef<MapData | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [isSelectingAddress, setIsSelectingAddress] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
        // Check if script already loaded
        if (window.ymaps) {
          resolve();
          return;
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
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${config.apiKey}&lang=ru_RU&load=package.full`;
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

          // Add store marker
          const storeMarker = new window.ymaps.Placemark(STORE_COORDINATES, {
            balloonContent: 'ДУЧАРХА - Магазин',
            hintContent: 'Наш магазин'
          }, {
            preset: 'islands#redDotIcon'
          });

          map.geoObjects.add(storeMarker);

          // Add click event listener for address selection
          map.events.add('click', (e: any) => {
            console.log('Map clicked, isSelectingAddress:', isSelectingAddress);
            
            if (!isSelectingAddress) {
              toast({
                title: "Сначала нажмите 'Выбрать на карте'",
                description: "Для выбора адреса доставки нажмите кнопку 'Выбрать на карте' сверху",
                variant: "default"
              });
              return;
            }
            
            const coords = e.get('coords');
            console.log('Clicked coordinates:', coords);
            handleMapClick(coords);
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

  // Handle map click for address selection
  const handleMapClick = async (coordinates: [number, number]) => {
    console.log('handleMapClick called with coordinates:', coordinates);
    
    if (!window.ymaps || !mapDataRef.current) {
      console.error('ymaps or mapDataRef not available');
      return;
    }

    setIsLoading(true);

    try {
      // Get address by coordinates (reverse geocoding)
      const geocoder = window.ymaps.geocode(coordinates, { results: 1 });
      
      geocoder.then((result: any) => {
        const firstResult = result.geoObjects.get(0);
        
        if (!firstResult) {
          toast({
            title: "Адрес не найден",
            description: "Не удалось определить адрес по выбранной точке",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const address = firstResult.getAddressLine();
        const description = firstResult.properties.get('text');

        // Remove existing customer marker
        if (mapDataRef.current?.customerMarker) {
          mapDataRef.current.map.geoObjects.remove(mapDataRef.current.customerMarker);
        }

        // Add selected address marker
        const selectedMarker = new window.ymaps.Placemark(coordinates, {
          balloonContent: `Выбранный адрес: ${address}`,
          hintContent: 'Выбранный адрес доставки'
        }, {
          preset: 'islands#greenDotIcon'
        });

        mapDataRef.current!.map.geoObjects.add(selectedMarker);
        mapDataRef.current!.customerMarker = selectedMarker;

        // Set selected address
        setSelectedAddress({
          coordinates,
          address,
          description
        });

        setIsLoading(false);
        
        toast({
          title: "Адрес выбран",
          description: `Выбран: ${address}`,
        });

      }).catch((error: any) => {
        console.error('Reverse geocoding error:', error);
        toast({
          title: "Ошибка определения адреса",
          description: "Не удалось определить адрес по выбранной точке",
          variant: "destructive"
        });
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Map click error:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при выборе адреса",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Confirm selected address
  const confirmAddress = () => {
    if (!selectedAddress) return;

    // Save to localStorage for now (later can be integrated with backend)
    const addressData = {
      id: Date.now().toString(),
      title: "Выбранный на карте",
      address: selectedAddress.address,
      coordinates: selectedAddress.coordinates,
      type: "other" as const,
      isDefault: false,
      timestamp: new Date().toISOString()
    };

    // Get existing addresses from localStorage
    const existingAddresses = localStorage.getItem('user-addresses');
    const addresses = existingAddresses ? JSON.parse(existingAddresses) : [];
    
    // Add new address
    addresses.push(addressData);
    localStorage.setItem('user-addresses', JSON.stringify(addresses));

    toast({
      title: "Адрес сохранен",
      description: "Адрес доставки успешно добавлен",
    });

    // Navigate back or to addresses page
    setLocation('/addresses');
  };

  // Cancel address selection
  const cancelSelection = () => {
    setIsSelectingAddress(false);
    setSelectedAddress(null);
    
    // Remove customer marker if exists
    if (mapDataRef.current?.customerMarker) {
      mapDataRef.current.map.geoObjects.remove(mapDataRef.current.customerMarker);
      mapDataRef.current.customerMarker = null;
    }
  };

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
          <h1 className="text-xl font-bold text-foreground">
            🗺️ Карта доставки
          </h1>
          <div className="w-16"></div> {/* Spacer for balance */}
        </div>

        {!isSelectingAddress ? (
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
                data-testid="button-select-address"
                onClick={() => setIsSelectingAddress(true)}
                variant="default"
                size="sm"
                className="flex-1"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Выбрать на карте
              </Button>
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
        ) : (
          <>
            {/* Address Selection Mode */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                📍 Нажмите на карту, чтобы выбрать адрес доставки
              </p>
              {selectedAddress && (
                <div className="bg-white dark:bg-gray-800 rounded p-2 border mt-2">
                  <p className="text-sm font-medium">Выбранный адрес:</p>
                  <p className="text-xs text-muted-foreground">{selectedAddress.address}</p>
                </div>
              )}
            </div>

            {/* Selection Action Buttons */}
            <div className="flex gap-2">
              <Button 
                data-testid="button-cancel-selection"
                onClick={cancelSelection}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Отменить
              </Button>
              <Button 
                data-testid="button-confirm-address"
                onClick={confirmAddress}
                disabled={!selectedAddress || isLoading}
                size="sm"
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Подтвердить
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1">
        <div 
          ref={mapRef} 
          className="w-full h-full"
          data-testid="map-container"
        />
      </div>
    </div>
  );
}