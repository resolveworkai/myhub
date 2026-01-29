import { useState, useRef, useCallback } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  value?: { lat: number; lng: number };
  onChange: (location: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

// Free OpenStreetMap-based tile style
const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

export function LocationPicker({ value, onChange, className }: LocationPickerProps) {
  const mapRef = useRef<MapRef>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [address, setAddress] = useState('');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const [viewState, setViewState] = useState({
    longitude: value?.lng || 72.8777,
    latitude: value?.lat || 19.076,
    zoom: 13,
  });

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
      onChange({ lat, lng });
    }
  }, [onChange]);

  // Handle map click to place marker
  const handleMapClick = useCallback((event: maplibregl.MapMouseEvent) => {
    const { lng, lat } = event.lngLat;
    setMarkerPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  // Handle geolocate event
  const handleGeolocate = useCallback((e: GeolocationPosition) => {
    const { latitude, longitude } = e.coords;
    setMarkerPosition({ lat: latitude, lng: longitude });
    setViewState((prev) => ({
      ...prev,
      longitude,
      latitude,
      zoom: 16,
    }));
    reverseGeocode(latitude, longitude);
  }, [reverseGeocode]);

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback((event: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = event.lngLat;
    setMarkerPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

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
        
        setViewState({
          longitude,
          latitude,
          zoom: 16,
        });
        setMarkerPosition({ lat: latitude, lng: longitude });
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

      {/* Search bar */}
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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Map container */}
      <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-border">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={handleMapClick}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          attributionControl={false}
        >
          {/* Navigation controls */}
          <NavigationControl position="top-right" />
          
          {/* Geolocation control */}
          <GeolocateControl
            position="top-right"
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation={false}
            onGeolocate={handleGeolocate}
          />

          {/* Draggable marker */}
          {markerPosition && (
            <Marker
              longitude={markerPosition.lng}
              latitude={markerPosition.lat}
              anchor="bottom"
              draggable
              onDragEnd={handleMarkerDragEnd}
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary -mt-1" />
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* Selected coordinates */}
      {markerPosition && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <MapPin className="h-4 w-4" />
            Location Selected
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {markerPosition.lat.toFixed(6)}°N, {markerPosition.lng.toFixed(6)}°E
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
