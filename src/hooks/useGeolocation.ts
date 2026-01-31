import { useEffect, useState, useCallback } from 'react';
import { useFilterStore, UserLocation } from '@/store/filterStore';

// Major Indian cities for fallback
const CITIES = [
  { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Gurgaon', lat: 28.4595, lng: 77.0266 },
  { name: 'Noida', lat: 28.5355, lng: 77.391 },
];

// No default location - we'll request browser location first
const DEFAULT_LOCATION: UserLocation | null = null;

// Find nearest city based on coordinates
function findNearestCity(lat: number, lng: number): string {
  let nearestCity = CITIES[0].name;
  let minDistance = Infinity;

  for (const city of CITIES) {
    const distance = Math.sqrt(
      Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city.name;
    }
  }

  return nearestCity;
}

export interface UseGeolocationReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
  setManualLocation: (city: string) => void;
  availableCities: typeof CITIES;
}

export function useGeolocation(): UseGeolocationReturn {
  const { userLocation, setUserLocation } = useFilterStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      // Fallback to Mumbai if geolocation not supported
      setUserLocation({
        lat: 19.076,
        lng: 72.8777,
        city: 'Mumbai',
        source: 'default',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setHasRequested(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const city = findNearestCity(latitude, longitude);
        
        setUserLocation({
          lat: latitude,
          lng: longitude,
          city,
          source: 'gps',
        });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable');
            break;
          case err.TIMEOUT:
            setError('Location request timed out');
            break;
          default:
            setError('An unknown error occurred');
        }
        // Fall back to Mumbai only after user denies/error
        setUserLocation({
          lat: 19.076,
          lng: 72.8777,
          city: 'Mumbai',
          source: 'default',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [setUserLocation]);

  const setManualLocation = useCallback(
    (cityName: string) => {
      const city = CITIES.find((c) => c.name === cityName);
      if (city) {
        setUserLocation({
          lat: city.lat,
          lng: city.lng,
          city: city.name,
          source: 'manual',
        });
      }
    },
    [setUserLocation]
  );

  // Auto-request browser location on mount if not already set
  useEffect(() => {
    if (!userLocation && !hasRequested) {
      requestLocation();
    }
  }, [userLocation, hasRequested, requestLocation]);

  return {
    location: userLocation,
    loading,
    error,
    requestLocation,
    setManualLocation,
    availableCities: CITIES,
  };
}
