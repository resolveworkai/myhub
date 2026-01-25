import React, { useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavoriteStore } from "@/store/favoriteStore";
import { Heart, Star, MapPin, Trash2, ExternalLink, Loader2 } from "lucide-react";

import { getUserFavorites, removeFavorite as removeFavoriteApi } from "@/lib/apiService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

const getTypeEmoji = (type: string) => {
  switch (type) {
    case "gym": return "🏋️";
    case "library": return "📚";
    case "coaching": return "📖";
    default: return "📍";
  }
};

// Memoized venue card for performance
const FavoriteCard = memo(({ venue, onRemove }: { venue: Venue; onRemove: (id: string) => void }) => (
  <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
    <div className="relative aspect-[4/3] overflow-hidden">
      <img
        src={venue.image}
        alt={venue.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <button
        onClick={() => onRemove(venue.id)}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove from favorites"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {venue.verified && (
        <Badge variant="verified" className="absolute top-3 left-3">
          Verified
        </Badge>
      )}
    </div>
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <span>{getTypeEmoji(venue.type)}</span>
        <span className="text-xs text-muted-foreground capitalize">{venue.type}</span>
      </div>
      <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
        {venue.name}
      </h3>
      <div className="flex items-center gap-4 text-sm mb-3">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-warning text-warning" />
          <span className="font-medium">{venue.rating}</span>
          <span className="text-muted-foreground">({venue.reviews})</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {venue.location?.city}
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="font-semibold text-primary">{venue.priceLabel}</span>
        <Link to={`/venue/${venue.id}`}>
          <Button size="sm" variant="outline">
            View
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  </div>
));

FavoriteCard.displayName = "FavoriteCard";

export default function Favorites() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Fetch favorites from API
  const { data: favoriteVenues = [], isLoading, error } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: getUserFavorites,
    enabled: !!user && user.accountType === 'normal',
  });
  
  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (venueId: string) => removeFavoriteApi(venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    },
  });
  
  const handleRemoveFavorite = (venueId: string) => {
    removeFavoriteMutation.mutate(venueId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Heart className="h-8 w-8 text-accent fill-accent" />
              My Favorites
            </h1>
            <p className="text-muted-foreground mt-2">
              {favoriteVenues.length} saved {favoriteVenues.length === 1 ? "venue" : "venues"}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading favorites...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">Failed to load favorites</p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['user-favorites'] })}>
                Retry
              </Button>
            </div>
          ) : favoriteVenues.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteVenues.map((venue) => (
                <FavoriteCard 
                  key={venue.id} 
                  venue={{
                    id: venue.id,
                    name: venue.name,
                    type: venue.category,
                    rating: venue.rating,
                    reviews: venue.reviews,
                    image: venue.image,
                    location: { city: venue.location.city },
                    priceLabel: venue.priceLabel,
                    verified: venue.verified,
                  }} 
                  onRemove={handleRemoveFavorite} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">
                No favorites yet
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start exploring and save your favorite gyms, libraries, and coaching centers to access them quickly.
              </p>
              <Link to="/explore">
                <Button variant="gradient">
                  Explore Venues
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
