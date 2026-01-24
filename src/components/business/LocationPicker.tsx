import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  value?: { lat: number; lng: number };
  onChange: (location: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export function LocationPicker({ value, onChange, className }: LocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [address, setAddress] = useState('');

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default to Mumbai or provided value
    const defaultLat = value?.lat || 19.076;
    const defaultLng = value?.lng || 72.8777;

    const map = L.map(containerRef.current).setView([defaultLat, defaultLng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    // Add initial marker if value exists
    if (value?.lat && value?.lng) {
      const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;
      
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange({ lat: pos.lat, lng: pos.lng });
        reverseGeocode(pos.lat, pos.lng);
      });
    }

    // Click to place marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current = marker;
        
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChange({ lat: pos.lat, lng: pos.lng });
          reverseGeocode(pos.lat, pos.lng);
        });
      }
      
      onChange({ lat, lng });
      reverseGeocode(lat, lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Reverse geocode to get address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
        onChange({ lat, lng, address: data.display_name });
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  }, [onChange]);

  // Use current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            const marker = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
            markerRef.current = marker;
            
            marker.on('dragend', () => {
              const pos = marker.getLatLng();
              onChange({ lat: pos.lat, lng: pos.lng });
              reverseGeocode(pos.lat, pos.lng);
            });
          }
        }
        
        onChange({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        alert('Could not get your location. Please allow location access or search manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            const marker = L.marker([latitude, longitude], { draggable: true }).addTo(mapRef.current);
            markerRef.current = marker;
            
            marker.on('dragend', () => {
              const pos = marker.getLatLng();
              onChange({ lat: pos.lat, lng: pos.lng });
              reverseGeocode(pos.lat, pos.lng);
            });
          }
        }
        
        setAddress(display_name);
        onChange({ lat: latitude, lng: longitude, address: display_name });
      } else {
        alert('Location not found. Try a different search.');
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Click on the map or drag the marker to set your business location</span>
      </div>

      {/* Search and GPS buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search for your location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSearch}
            disabled={isLoading}
            className="shrink-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isLoading}
          className="gap-2 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Use My Location</span>
          <span className="sm:hidden">GPS</span>
        </Button>
      </div>

      {/* Map container */}
      <div 
        ref={containerRef} 
        className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-border"
        style={{ zIndex: 1 }}
      />

      {/* Selected coordinates */}
      {value?.lat && value?.lng && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <MapPin className="h-4 w-4" />
            Location Selected
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {value.lat.toFixed(6)}°N, {value.lng.toFixed(6)}°E
          </div>
          {address && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {address}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
