import React, { useState, useMemo, useEffect, memo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapView } from "@/components/map/MapView";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { BookingModal } from "@/components/booking/BookingModal";
import { usePagination } from "@/hooks/usePagination";
import { FilterPanel } from "@/components/explore/FilterPanel";
import { ActiveFilters } from "@/components/explore/ActiveFilters";
import { SavedSearches } from "@/components/explore/SavedSearches";
import { useFilterStore, VenueCategory } from "@/store/filterStore";
import { useFavoriteStore } from "@/store/favoriteStore";
import { useVenueStore } from "@/store/venueStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFilterDebounce } from "@/hooks/useDebounce";
import { filterVenues, sortVenues, Venue } from "@/lib/filterEngine";
import { sortOptions, categories } from "@/lib/filterDefinitions";
import {
  Search,
  MapPin,
  Star,
  Filter,
  Map,
  List,
  Heart,
  X,
  Shield,
  Loader2,
  Navigation,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Explore() {
  const location = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [bookingVenue, setBookingVenue] = useState<Venue | null>(null);

  // Use persisted favorites store instead of local state
  const { favorites, toggleFavorite, isFavorite } = useFavoriteStore();

  // Use venue store to get all venues (mock + registered)
  const { getAllVenues } = useVenueStore();
  const allBusinesses = useMemo(() => getAllVenues(), [getAllVenues]);

  // Filter store
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    userLocation,
    getActiveFilterCount,
    priceRange,
    minRating,
    radiusKm,
    availability,
    selectedAmenities,
    gymEquipment,
    gymClassTypes,
    coachingSubjects,
    libraryFacilities,
  } = useFilterStore();

  // Geolocation hook
  const { location: geoLocation, loading: geoLoading, requestLocation, setManualLocation, availableCities } = useGeolocation();

  // Auto-select category based on route
  const routePath = location.pathname.replace("/", "");
  const routeCategory: VenueCategory | null =
    routePath === "gyms"
      ? "gym"
      : routePath === "coaching"
      ? "coaching"
      : routePath === "libraries"
      ? "library"
      : null;

  // Sync route category with store
  useEffect(() => {
    if (routeCategory && routeCategory !== activeCategory) {
      setActiveCategory(routeCategory);
    } else if (!routeCategory && activeCategory !== "all") {
      // On /explore, show all
      setActiveCategory("all");
    }
  }, [routePath, routeCategory, activeCategory, setActiveCategory]);

  // Create filter state object for debouncing
  const currentFilters = useMemo(
    () => ({
      activeCategory: routeCategory || activeCategory,
      searchQuery,
      priceRange,
      minRating,
      radiusKm,
      availability,
      selectedAmenities,
      userLocation,
      gymEquipment,
      gymClassTypes,
      coachingSubjects,
      libraryFacilities,
    }),
    [
      routeCategory,
      activeCategory,
      searchQuery,
      priceRange,
      minRating,
      radiusKm,
      availability,
      selectedAmenities,
      userLocation,
      gymEquipment,
      gymClassTypes,
      coachingSubjects,
      libraryFacilities,
    ]
  );

  // Debounce filter changes (300ms delay)
  const { debouncedFilters, isPending } = useFilterDebounce(currentFilters, 300);

  // Filter businesses with debounced filters
  const filteredBusinesses = useMemo(() => {
    return filterVenues(allBusinesses, debouncedFilters);
  }, [debouncedFilters]);

  // Sort businesses
  const sortedBusinesses = useMemo(() => {
    return sortVenues(filteredBusinesses, sortBy, userLocation);
  }, [filteredBusinesses, sortBy, userLocation]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({
    data: sortedBusinesses,
    itemsPerPage: 12,
  });

  // Memoized toggle handler
  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="available">Available</Badge>;
      case "filling":
        return <Badge variant="filling">Filling Up</Badge>;
      case "full":
        return <Badge variant="full">Full</Badge>;
      default:
        return null;
    }
  };

  const activeFiltersCount = getActiveFilterCount();
  const effectiveCategory = routeCategory || activeCategory;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Search Header */}
        <div className="bg-card border-b border-border sticky top-16 lg:top-20 z-40">
          <div className="container mx-auto px-4 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 flex items-center gap-3 bg-muted rounded-xl px-4 py-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for gyms, libraries, coaching centers..."
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Location Selector */}
              <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2 lg:w-64">
                {geoLoading ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                ) : (
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                )}
                <Select
                  value={userLocation?.city || "Mumbai"}
                  onValueChange={setManualLocation}
                >
                  <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={requestLocation}
                  className="p-1 hover:bg-background rounded"
                  title="Use current location"
                >
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden relative">
                      <Filter className="h-5 w-5 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel activeCategory={effectiveCategory} />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* View Mode Toggle */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 transition-colors ${
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`p-2.5 transition-colors ${
                      viewMode === "map"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Map className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-44 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                <FilterPanel activeCategory={effectiveCategory} />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Active Filters Chips */}
              <ActiveFilters />

              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                    {isPending && (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
                    )}
                    {totalItems} Businesses Found
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {userLocation
                      ? `Near ${userLocation.city}`
                      : "Across all locations"}
                    {userLocation?.source === "gps" && (
                      <span className="text-xs ml-2 text-success">
                        (GPS)
                      </span>
                    )}
                  </p>
                </div>

                {/* Saved Searches + Sort */}
                <div className="flex items-center gap-2">
                  <SavedSearches currentFilters={currentFilters} />
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-full sm:w-48 bg-muted border-0">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results */}
              {viewMode === "list" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {paginatedData.map((business: Venue) => (
                      <div
                        key={business.id}
                        className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={business.image}
                            alt={business.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <button
                            onClick={() => handleToggleFavorite(business.id)}
                            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                              isFavorite(business.id)
                                ? "bg-accent text-accent-foreground"
                                : "bg-card/80 backdrop-blur-sm text-foreground hover:bg-card"
                            }`}
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                isFavorite(business.id)
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                          </button>
                          <div className="absolute bottom-3 left-3">
                            {getStatusBadge(business.status)}
                          </div>
                          {business.verified && (
                            <div className="absolute top-3 left-3">
                              <Badge variant="verified" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Verified
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">
                              {categories.find((c) => c.id === (business.type || business.category))?.icon}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {business.type || business.category}
                            </span>
                            {business.distance !== undefined && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                {business.distance < 1
                                  ? `${Math.round(business.distance * 1000)}m`
                                  : `${business.distance.toFixed(1)} km`}
                              </span>
                            )}
                          </div>
                          <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                            {business.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              <span className="font-medium text-foreground">
                                {business.rating}
                              </span>
                              <span className="text-muted-foreground">
                                ({business.reviews})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {business.location?.city}
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">
                                Occupancy
                              </span>
                              <span className="font-medium text-foreground">
                                {business.occupancy}/{business.capacity}
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  business.occupancy / business.capacity < 0.6
                                    ? "bg-success"
                                    : business.occupancy / business.capacity <
                                      0.85
                                    ? "bg-warning"
                                    : "bg-destructive"
                                }`}
                                style={{
                                  width: `${(business.occupancy / business.capacity) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="font-semibold text-primary">
                              {business.priceLabel}
                            </span>
                            <Button
                              size="sm"
                              variant="gradient"
                              onClick={() => setBookingVenue(business)}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      startIndex={startIndex}
                      endIndex={endIndex}
                      totalItems={totalItems}
                      className="mt-8"
                    />
                  )}
                </>
              ) : (
                <div className="h-[600px] rounded-2xl overflow-hidden border border-border">
                  <MapView
                    venues={sortedBusinesses.map((b: Venue) => ({
                      id: b.id,
                      name: b.name,
                      type: b.type || b.category,
                      lat: b.location?.lat,
                      lng: b.location?.lng,
                      rating: b.rating,
                      price: b.priceLabel,
                    }))}
                  />
                </div>
              )}

              {/* No Results */}
              {sortedBusinesses.length === 0 && !isPending && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No results found
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    No venues match your current filters. Try:
                  </p>
                  <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                    <li>• Increasing the distance radius</li>
                    <li>• Adjusting the price range</li>
                    <li>• Removing some filters</li>
                  </ul>
                  <Button
                    variant="outline"
                    onClick={() => useFilterStore.getState().clearAllFilters()}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Booking Modal */}
      {bookingVenue && (
        <BookingModal
          isOpen={!!bookingVenue}
          onClose={() => setBookingVenue(null)}
          venue={{
            id: bookingVenue.id,
            name: bookingVenue.name,
            type: (bookingVenue.type || bookingVenue.category) as "gym" | "library" | "coaching",
            rating: bookingVenue.rating,
            price: bookingVenue.priceLabel,
          }}
        />
      )}
    </div>
  );
}
