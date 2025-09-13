import { useEffect, useRef, useState } from "react";
import { X, Search, Plus, Minus, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useDataPreloader } from "@/hooks/use-data-preloader";

// Declare global ymaps type
declare global {
  interface Window {
    ymaps: any;
  }
}

interface MapData {
  map: any;
  customerMarker: any;
}

interface SelectedAddress {
  coordinates: [number, number];
  address: string;
  description?: string;
}

interface MapConfig {
  apiKey: string;
}

interface AddressOnboardingProps {
  onAddressSelected: (address: SelectedAddress) => void;
  onClose: () => void;
}

export default function AddressOnboarding({ onAddressSelected, onClose }: AddressOnboardingProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapDataRef = useRef<MapData | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const geocodingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Preload app data in the background while user selects address
  useDataPreloader();

  // Get map config
  const { data: config } = useQuery<MapConfig>({
    queryKey: ['/api/config/yandex-maps'],
    enabled: true
  });

  // Load Yandex Maps script
  useEffect(() => {
    if (!config?.apiKey) return;

    const loadYandexMaps = () => {
      if (window.ymaps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${config.apiKey}&lang=ru_RU&coordorder=latlong`;
      script.type = 'text/javascript';
      script.onload = () => {
        window.ymaps.ready(() => {
          initializeMap();
        });
      };
      document.head.appendChild(script);
    };

    loadYandexMaps();
  }, [config?.apiKey]);

  // Initialize Yandex Map
  const initializeMap = () => {
    if (!mapRef.current || !window.ymaps) return;

    // Dushanbe coordinates (latitude, longitude)
    const dushanbeCenter: [number, number] = [38.559772, 68.787038];

    const map = new window.ymaps.Map(mapRef.current, {
      center: dushanbeCenter,
      zoom: 15,
      controls: [] // Disable default controls
    });

    // Add click listener for address selection
    map.events.add('click', handleMapClick);
    
    // Add map movement listeners to update address in real-time
    const updateAddress = () => {
      const center = map.getCenter();
      updateAddressForCoordinates(center);
    };
    
    map.events.add('boundschange', updateAddress); // During movement
    map.events.add('actionend', updateAddress); // When user stops dragging/zooming

    mapDataRef.current = {
      map,
      customerMarker: null
    };

    // Try to get user's current location
    getCurrentLocation();
    
    // Get initial address for map center
    updateAddressForCoordinates(dushanbeCenter);
  };

  // Update address for given coordinates with debouncing
  const updateAddressForCoordinates = async (coordinates: [number, number]) => {
    if (!config?.apiKey || !window.ymaps) return;

    // Clear previous timeout
    if (geocodingTimeoutRef.current) {
      clearTimeout(geocodingTimeoutRef.current);
    }

    // Set new timeout for debouncing
    geocodingTimeoutRef.current = setTimeout(async () => {
      try {
        const geocoder = window.ymaps.geocode(coordinates, {
          results: 1,
          kind: 'house'
        });

        geocoder.then((result: any) => {
          const firstResult = result.geoObjects.get(0);
          const address = firstResult ? firstResult.getAddressLine() : 'Неизвестное место';
          setCurrentAddress(address);
        });
      } catch (error) {
        console.error('Error getting address for coordinates:', error);
        setCurrentAddress('Неизвестное место');
      }
    }, 500); // 500ms debounce
  };

  // Get current location
  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];

          if (mapDataRef.current) {
            mapDataRef.current.map.setCenter(coords, 16);
          }
        },
        (error) => {
          // If geolocation fails, stay centered on Dushanbe
          console.log("Geolocation error:", error);
        }
      );
    }
  };

  // Handle map click for address selection
  const handleMapClick = async (e: any) => {
    if (!config?.apiKey) return;

    const coordinates = e.get('coords');
    setIsLoading(true);

    try {
      // Get address by coordinates using Yandex Geocoder
      const geocoder = window.ymaps.geocode(coordinates, {
        results: 1,
        kind: 'house'
      });

      geocoder.then((result: any) => {
        const firstResult = result.geoObjects.get(0);
        const address = firstResult ? firstResult.getAddressLine() : 'Выбранное место';
        const description = firstResult ? firstResult.properties.get('text') : '';

        // Remove existing marker
        if (mapDataRef.current?.customerMarker) {
          mapDataRef.current.map.geoObjects.remove(mapDataRef.current.customerMarker);
        }

        // Add customer marker at selected location
        const selectedMarker = new window.ymaps.Placemark(coordinates, {
          balloonContent: address,
          iconContent: ''
        }, {
          preset: 'islands#redDotIcon',
          iconColor: '#ff6b35'
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
      });
    } catch (error) {
      console.error('Error getting address:', error);
      setIsLoading(false);
      toast({
        title: "Ошибка",
        description: "Не удалось получить адрес для выбранной точки",
        variant: "destructive"
      });
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

        // Remove existing marker
        if (mapDataRef.current?.customerMarker) {
          mapDataRef.current.map.geoObjects.remove(mapDataRef.current.customerMarker);
        }

        // Add marker and center map
        const customerMarker = new window.ymaps.Placemark(coordinates, {
          balloonContent: addressName,
          iconContent: ''
        }, {
          preset: 'islands#redDotIcon',
          iconColor: '#ff6b35'
        });

        if (mapDataRef.current?.map) {
          mapDataRef.current.map.geoObjects.add(customerMarker);
          mapDataRef.current.customerMarker = customerMarker;
          mapDataRef.current.map.setCenter(coordinates, 16);
        }

        setSelectedAddress({
          coordinates,
          address: addressName,
          description: addressName
        });

        setIsLoading(false);
        toast({
          title: "Адрес найден",
          description: addressName
        });
      });
    } catch (error) {
      console.error('Error searching address:', error);
      setIsLoading(false);
      toast({
        title: "Ошибка поиска",
        description: "Не удалось найти адрес",
        variant: "destructive"
      });
    }
  };

  // Handle zoom in
  const zoomIn = () => {
    if (mapDataRef.current?.map) {
      const currentZoom = mapDataRef.current.map.getZoom();
      mapDataRef.current.map.setZoom(Math.min(currentZoom + 1, 19));
    }
  };

  // Handle zoom out  
  const zoomOut = () => {
    if (mapDataRef.current?.map) {
      const currentZoom = mapDataRef.current.map.getZoom();
      mapDataRef.current.map.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  // Handle current location
  const goToCurrentLocation = () => {
    if (mapDataRef.current?.map) {
      getCurrentLocation();
    }
  };

  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchForAddress();
    }
  };

  // Confirm address selection
  const confirmAddress = () => {
    // Use selectedAddress (from click) or create from currentAddress (from map movement)
    if (selectedAddress) {
      onAddressSelected(selectedAddress);
    } else if (currentAddress && mapDataRef.current) {
      // Create address object from current map center and address
      const center = mapDataRef.current.map.getCenter();
      const addressData = {
        address: currentAddress,
        coordinates: [center[0], center[1]] as [number, number]
      };
      onAddressSelected(addressData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          {/* Search Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const input = document.querySelector('[data-testid="input-search"]') as HTMLInputElement;
              if (input) {
                input.focus();
              }
            }}
            className="bg-white dark:bg-gray-800 shadow-md"
            data-testid="button-search"
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Close Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="bg-white dark:bg-gray-800 shadow-md"
            data-testid="button-close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Current Address Display */}
        {currentAddress && (
          <div className="mt-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mx-auto max-w-sm">
            <p className="text-center font-medium text-gray-900 dark:text-gray-100">
              {currentAddress}
            </p>
          </div>
        )}
        
        {/* Selected Address Display (when address is selected) */}
        {selectedAddress && (
          <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-md p-3 mx-auto max-w-sm border border-blue-200 dark:border-blue-700">
            <p className="text-center font-medium text-blue-900 dark:text-blue-100 text-sm">
              📍 Выбрано: {selectedAddress.address}
            </p>
          </div>
        )}

        {/* Search Input */}
        <div className="mt-3">
          <Input
            data-testid="input-search"
            type="text"
            placeholder="Введите адрес..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-white dark:bg-gray-800 shadow-md"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0">
        <div 
          ref={mapRef} 
          className="w-full h-full"
          data-testid="map-container"
        />
      </div>

      {/* Center Pin */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-10">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <div className="w-0.5 h-4 bg-red-500 mx-auto"></div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute right-4 top-[40%] z-10 space-y-3">
        <Button
          variant="outline"
          size="icon"
          onClick={zoomIn}
          className="bg-white dark:bg-gray-800 shadow-lg w-12 h-12 rounded-xl"
          data-testid="button-zoom-in"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={zoomOut}
          className="bg-white dark:bg-gray-800 shadow-lg w-12 h-12 rounded-xl"
          data-testid="button-zoom-out"
        >
          <Minus className="h-5 w-5" />
        </Button>
      </div>

      {/* Current Location Button */}
      <div className="absolute right-4 bottom-32 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={goToCurrentLocation}
          className="bg-white dark:bg-gray-800 shadow-md"
          data-testid="button-current-location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom Action Button */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <Button
          onClick={confirmAddress}
          disabled={(!selectedAddress && !currentAddress) || isLoading}
          className="w-full h-14 bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-medium text-lg rounded-lg shadow-lg"
          data-testid="button-ready"
        >
          Выбрать
        </Button>
      </div>
    </div>
  );
}