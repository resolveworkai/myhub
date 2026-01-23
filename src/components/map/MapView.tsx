import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Venue {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  rating: number;
  price: string;
}

interface MapViewProps {
  venues: Venue[];
  onVenueClick?: (id: number) => void;
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

export function MapView({ venues, onVenueClick }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on Mumbai
    mapRef.current = L.map(mapContainerRef.current).setView([19.076, 72.8777], 12);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });

    // Add markers for venues
    venues.forEach((venue) => {
      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background: ${typeColors[venue.type] || "#3B82F6"};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
            cursor: pointer;
          ">
            ${typeIcons[venue.type] || "📍"}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([venue.lat, venue.lng], { icon }).addTo(mapRef.current!);

      const popupContent = `
        <div style="min-width: 200px; padding: 4px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${venue.name}</div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #666;">
            <span>⭐ ${venue.rating}</span>
            <span>${venue.price}</span>
          </div>
          <button 
            onclick="window.location.href='/business/${venue.id}'"
            style="
              margin-top: 8px;
              width: 100%;
              padding: 8px;
              background: linear-gradient(135deg, #2563EB, #0EA5E9);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
            "
          >
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        if (onVenueClick) {
          onVenueClick(venue.id);
        }
      });
    });
  }, [venues, onVenueClick]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: "400px" }}
    />
  );
}
