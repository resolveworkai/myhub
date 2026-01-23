import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { MapView } from "@/components/map/MapView";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { BookingModal } from "@/components/booking/BookingModal";
import { usePagination } from "@/hooks/usePagination";
import {
  Search,
  MapPin,
  Star,
  Filter,
  Map,
  List,
  Heart,
  X,
  Wifi,
  Car,
  Snowflake,
  ShowerHead,
  Shield,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import gymsData from "@/data/mock/gyms.json";
import coachingData from "@/data/mock/coaching.json";
import librariesData from "@/data/mock/libraries.json";

const categories = [
  { id: "gym", name: "Gym", icon: "🏋️", color: "bg-info/10 text-info" },
  { id: "library", name: "Library", icon: "📚", color: "bg-success/10 text-success" },
  { id: "coaching", name: "Coaching", icon: "📖", color: "bg-purple-100 text-purple-700" },
];

const amenities = [
  { id: "wifi", name: "WiFi", icon: Wifi },
  { id: "parking", name: "Parking", icon: Car },
  { id: "ac", name: "AC", icon: Snowflake },
  { id: "shower", name: "Shower", icon: ShowerHead },
  { id: "lockers", name: "Lockers", icon: Shield },
];

// Combine all data
const allBusinesses = [
  ...gymsData.map(g => ({ ...g, type: "gym" })),
  ...coachingData.map(c => ({ ...c, type: "coaching" })),
  ...librariesData.map(l => ({ ...l, type: "library" })),
];

interface FilterContentProps {
  selectedCategories: string[];
  toggleCategory: (id: string) => void;
  selectedAmenities: string[];
  toggleAmenity: (id: string) => void;
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  ratingFilter: number;
  setRatingFilter: (value: number) => void;
}

function FilterContent({
  selectedCategories,
  toggleCategory,
  selectedAmenities,
  toggleAmenity,
  priceRange,
  setPriceRange,
  ratingFilter,
  setRatingFilter,
}: FilterContentProps) {
  return (
    <>
      <div>
        <h3 className="font-semibold text-foreground mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
              <Checkbox checked={selectedCategories.includes(cat.id)} onCheckedChange={() => toggleCategory(cat.id)} />
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
        <div className="px-2">
          <Slider value={priceRange} onValueChange={setPriceRange} max={50000} step={500} className="mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Minimum Rating</h3>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((rating) => (
            <button
              key={rating}
              onClick={() => setRatingFilter(rating)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                ratingFilter === rating ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {rating === 0 ? "All" : `${rating}+`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Amenities</h3>
        <div className="space-y-2">
          {amenities.map((amenity) => (
            <label key={amenity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
              <Checkbox checked={selectedAmenities.includes(amenity.id)} onCheckedChange={() => toggleAmenity(amenity.id)} />
              <amenity.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{amenity.name}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Explore() {
  const location = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [bookingVenue, setBookingVenue] = useState<any>(null);

  // Auto-select category based on route
  const routePath = location.pathname.replace("/", "");
  const routeCategory = routePath === "gyms" ? "gym" : routePath === "coaching" ? "coaching" : routePath === "libraries" ? "library" : null;
  
  const effectiveCategories = routeCategory ? [routeCategory] : selectedCategories;

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedAmenities([]);
    setPriceRange([0, 50000]);
    setRatingFilter(0);
    setSearchQuery("");
  };

  // Filter businesses
  const filteredBusinesses = useMemo(() => {
    return allBusinesses.filter((business) => {
      const matchesCategory = effectiveCategories.length === 0 || effectiveCategories.includes(business.type);
      const matchesSearch = searchQuery === "" || business.name.toLowerCase().includes(searchQuery.toLowerCase()) || business.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating = business.rating >= ratingFilter;
      const matchesAmenities = selectedAmenities.length === 0 || selectedAmenities.every((a) => business.amenities?.includes(a));
      const matchesPrice = business.price >= priceRange[0] && business.price <= priceRange[1];
      
      return matchesCategory && matchesSearch && matchesRating && matchesAmenities && matchesPrice;
    });
  }, [effectiveCategories, searchQuery, ratingFilter, selectedAmenities, priceRange]);

  // Sort businesses
  const sortedBusinesses = useMemo(() => {
    return [...filteredBusinesses].sort((a, b) => {
      switch (sortBy) {
        case "rating": return b.rating - a.rating;
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        default: return 0;
      }
    });
  }, [filteredBusinesses, sortBy]);

  // Pagination
  const { paginatedData, currentPage, totalPages, goToPage, startIndex, endIndex, totalItems } = usePagination({
    data: sortedBusinesses,
    itemsPerPage: 12,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available": return <Badge variant="available">Available</Badge>;
      case "filling": return <Badge variant="filling">Filling Up</Badge>;
      case "full": return <Badge variant="full">Full</Badge>;
      default: return null;
    }
  };

  const activeFiltersCount = selectedCategories.length + selectedAmenities.length + (ratingFilter > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Search Header */}
        <div className="bg-card border-b border-border sticky top-16 lg:top-20 z-40">
          <div className="container mx-auto px-4 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
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

              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-2 lg:w-64">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <input type="text" placeholder="Location" defaultValue="Mumbai, India" className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground" />
              </div>

              <div className="flex gap-2">
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
                      <SheetTitle className="flex items-center justify-between">
                        Filters
                        {activeFiltersCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear All</Button>}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      <FilterContent
                        selectedCategories={selectedCategories}
                        toggleCategory={toggleCategory}
                        selectedAmenities={selectedAmenities}
                        toggleAmenity={toggleAmenity}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        ratingFilter={ratingFilter}
                        setRatingFilter={setRatingFilter}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button onClick={() => setViewMode("list")} className={`p-2.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                    <List className="h-5 w-5" />
                  </button>
                  <button onClick={() => setViewMode("map")} className={`p-2.5 transition-colors ${viewMode === "map" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                    <Map className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategories.includes(cat.id) || (routeCategory === cat.id) ? "bg-primary text-primary-foreground" : `${cat.color} hover:opacity-80`
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-44 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Filters</h3>
                  {activeFiltersCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear All</Button>}
                </div>
                <FilterContent
                  selectedCategories={selectedCategories}
                  toggleCategory={toggleCategory}
                  selectedAmenities={selectedAmenities}
                  toggleAmenity={toggleAmenity}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  ratingFilter={ratingFilter}
                  setRatingFilter={setRatingFilter}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">{totalItems} Businesses Found</h1>
                  <p className="text-muted-foreground">Near your location</p>
                </div>
                <select className="bg-muted border-0 rounded-lg px-4 py-2 text-sm font-medium text-foreground" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="relevance">Sort by: Relevance</option>
                  <option value="rating">Rating</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {viewMode === "list" ? (
                <>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedData.map((business: any) => (
                      <div key={business.id} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img src={business.image} alt={business.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <button
                            onClick={() => toggleFavorite(business.id)}
                            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${favorites.includes(business.id) ? "bg-accent text-accent-foreground" : "bg-card/80 backdrop-blur-sm text-foreground hover:bg-card"}`}
                          >
                            <Heart className={`h-5 w-5 ${favorites.includes(business.id) ? "fill-current" : ""}`} />
                          </button>
                          <div className="absolute bottom-3 left-3">{getStatusBadge(business.status)}</div>
                          {business.verified && (
                            <div className="absolute top-3 left-3">
                              <Badge variant="verified" className="gap-1"><Shield className="h-3 w-3" />Verified</Badge>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">{categories.find((c) => c.id === business.type)?.icon}</span>
                            <span className="text-xs text-muted-foreground capitalize">{business.type}</span>
                          </div>
                          <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">{business.name}</h3>
                          <div className="flex items-center gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              <span className="font-medium text-foreground">{business.rating}</span>
                              <span className="text-muted-foreground">({business.reviews})</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {business.location?.city}
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Occupancy</span>
                              <span className="font-medium text-foreground">{business.occupancy}/{business.capacity}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${business.occupancy / business.capacity < 0.6 ? "bg-success" : business.occupancy / business.capacity < 0.85 ? "bg-warning" : "bg-destructive"}`}
                                style={{ width: `${(business.occupancy / business.capacity) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="font-semibold text-primary">{business.priceLabel}</span>
                            <Button size="sm" variant="gradient" onClick={() => setBookingVenue(business)}>Book Now</Button>
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
                  <MapView venues={sortedBusinesses.map((b: any) => ({ id: b.id, name: b.name, type: b.type, lat: b.location?.lat, lng: b.location?.lng, rating: b.rating, price: b.priceLabel }))} />
                </div>
              )}

              {sortedBusinesses.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
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
          venue={{ id: bookingVenue.id, name: bookingVenue.name, type: bookingVenue.type, rating: bookingVenue.rating, price: bookingVenue.priceLabel }}
        />
      )}
    </div>
  );
}
