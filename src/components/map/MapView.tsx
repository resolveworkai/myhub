import { useRef, useEffect, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl, GeolocateControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";

interface Venue {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  rating: number;
  price: string;
}

interface MapViewProps {
  venues: Venue[];
  onVenueClick?: (id: string) => void;
  initialCenter?: { lat: number; lng: number };
}

const typeIcons: Record<string, string> = {
  gym: "🏋️",
  library: "📚",
  coaching: "📖",
  yoga: "🧘",
  dance: "💃",
  sports: "⚽",
};

const typeColors: Record<string, string> = {
  gym: "#3B82F6",
  library: "#10B981",
  coaching: "#8B5CF6",
  yoga: "#F97316",
  dance: "#EC4899",
  sports: "#EAB308",
};

// Free OpenStreetMap-based tile style
const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";

export function MapView({ venues, onVenueClick, initialCenter }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const geolocateRef = useRef<maplibregl.GeolocateControl>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [viewState, setViewState] = useState({
    longitude: initialCenter?.lng || 72.8777,
    latitude: initialCenter?.lat || 19.076,
    zoom: 12,
  });

  // Auto-trigger geolocation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (geolocateRef.current) {
        geolocateRef.current.trigger();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkerClick = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    if (onVenueClick) {
      onVenueClick(venue.id);
    }
  }, [onVenueClick]);

  const handleViewDetails = useCallback((venueId: string) => {
    window.location.href = `/business/${venueId}`;
  }, []);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      style={{ width: "100%", height: "100%", minHeight: "400px", borderRadius: "16px" }}
      mapStyle={MAP_STYLE}
      attributionControl={false}
    >
      {/* Navigation controls */}
      <NavigationControl position="top-right" />
      
      {/* Geolocation control - auto-centers on user location */}
      <GeolocateControl
        ref={geolocateRef}
        position="top-right"
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation={true}
      />

      {/* Venue markers */}
      {venues.map((venue) => (
        <Marker
          key={venue.id}
          longitude={venue.lng}
          latitude={venue.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            handleMarkerClick(venue);
          }}
        >
          <div
            className="cursor-pointer transition-transform hover:scale-110"
            style={{
              background: typeColors[venue.type] || "#3B82F6",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              border: "3px solid white",
            }}
          >
            {typeIcons[venue.type] || "📍"}
          </div>
        </Marker>
      ))}

      {/* Popup for selected venue */}
      {selectedVenue && (
        <Popup
          longitude={selectedVenue.lng}
          latitude={selectedVenue.lat}
          anchor="bottom"
          onClose={() => setSelectedVenue(null)}
          closeOnClick={false}
          offset={25}
        >
          <div className="min-w-[200px] p-1">
            <div className="font-semibold text-sm mb-1">{selectedVenue.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>⭐ {selectedVenue.rating}</span>
              <span>{selectedVenue.price}</span>
            </div>
            <button
              onClick={() => handleViewDetails(selectedVenue.id)}
              className="mt-2 w-full py-2 px-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-none rounded-lg cursor-pointer text-xs font-medium hover:opacity-90 transition-opacity"
            >
              View Details
            </button>
          </div>
        </Popup>
      )}
    </Map>
  );
}
