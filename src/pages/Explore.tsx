import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { MapView } from "@/components/map/MapView";
import {
  Search,
  MapPin,
  Star,
  Users,
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

const categories = [
  { id: "gym", name: "Gym", icon: "🏋️", color: "bg-info/10 text-info" },
  { id: "library", name: "Library", icon: "📚", color: "bg-success/10 text-success" },
  { id: "coaching", name: "Coaching", icon: "📖", color: "bg-purple-100 text-purple-700" },
  { id: "yoga", name: "Yoga", icon: "🧘", color: "bg-accent/10 text-accent" },
  { id: "dance", name: "Dance", icon: "💃", color: "bg-pink-100 text-pink-700" },
  { id: "sports", name: "Sports", icon: "⚽", color: "bg-warning/10 text-warning" },
];

const amenities = [
  { id: "wifi", name: "WiFi", icon: Wifi },
  { id: "parking", name: "Parking", icon: Car },
  { id: "ac", name: "AC", icon: Snowflake },
  { id: "shower", name: "Shower", icon: ShowerHead },
  { id: "lockers", name: "Lockers", icon: Shield },
];

const mockBusinesses = [
  {
    id: 1,
    name: "FitZone Premium Gym",
    type: "gym",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    rating: 4.8,
    reviews: 156,
    distance: "0.5 km",
    price: "₹2,500/month",
    status: "available",
    occupancy: 45,
    capacity: 100,
    verified: true,
    amenities: ["wifi", "parking", "ac", "shower", "lockers"],
    lat: 19.076,
    lng: 72.8777,
  },
  {
    id: 2,
    name: "Central Public Library",
    type: "library",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 234,
    distance: "1.2 km",
    price: "Free",
    status: "filling",
    occupancy: 78,
    capacity: 100,
    verified: true,
    amenities: ["wifi", "ac"],
    lat: 19.082,
    lng: 72.881,
  },
  {
    id: 3,
    name: "Elite Coaching Center",
    type: "coaching",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop",
    rating: 4.7,
    reviews: 89,
    distance: "2.0 km",
    price: "₹5,000/month",
    status: "available",
    occupancy: 30,
    capacity: 50,
    verified: true,
    amenities: ["wifi", "ac", "parking"],
    lat: 19.089,
    lng: 72.865,
  },
  {
    id: 4,
    name: "Zen Yoga Studio",
    type: "yoga",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 178,
    distance: "0.8 km",
    price: "₹3,000/month",
    status: "available",
    occupancy: 12,
    capacity: 20,
    verified: true,
    amenities: ["ac", "shower"],
    lat: 19.072,
    lng: 72.883,
  },
  {
    id: 5,
    name: "Rhythm Dance Academy",
    type: "dance",
    image: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400&h=300&fit=crop",
    rating: 4.6,
    reviews: 67,
    distance: "1.5 km",
    price: "₹2,000/month",
    status: "filling",
    occupancy: 85,
    capacity: 100,
    verified: false,
    amenities: ["ac", "parking"],
    lat: 19.068,
    lng: 72.871,
  },
  {
    id: 6,
    name: "Sports Arena",
    type: "sports",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
    rating: 4.5,
    reviews: 112,
    distance: "3.0 km",
    price: "₹500/session",
    status: "available",
    occupancy: 20,
    capacity: 200,
    verified: true,
    amenities: ["parking", "shower", "lockers"],
    lat: 19.095,
    lng: 72.890,
  },
];

interface FilterContentProps {
  categories: typeof categories;
  selectedCategories: string[];
  toggleCategory: (id: string) => void;
  amenities: typeof amenities;
  selectedAmenities: string[];
  toggleAmenity: (id: string) => void;
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  ratingFilter: number;
  setRatingFilter: (value: number) => void;
}

function FilterContent({
  categories,
  selectedCategories,
  toggleCategory,
  amenities,
  selectedAmenities,
  toggleAmenity,
  priceRange,
  setPriceRange,
  ratingFilter,
  setRatingFilter,
}: FilterContentProps) {
  return (
    <>
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={10000}
            step={500}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Minimum Rating</h3>
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((rating) => (
            <button
              key={rating}
              onClick={() => setRatingFilter(rating)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                ratingFilter === rating
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {rating === 0 ? "All" : `${rating}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Amenities</h3>
        <div className="space-y-2">
          {amenities.map((amenity) => (
            <label
              key={amenity.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selectedAmenities.includes(amenity.id)}
                onCheckedChange={() => toggleAmenity(amenity.id)}
              />
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
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  // Auto-select category based on route
  const routeCategory = location.pathname.replace("/", "");
  const effectiveCategories = routeCategory && ["gyms", "coaching", "libraries"].includes(routeCategory)
    ? [routeCategory.replace("s", "")]
    : selectedCategories;

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedAmenities([]);
    setPriceRange([0, 10000]);
    setRatingFilter(0);
    setSearchQuery("");
  };

  // Filter businesses
  const filteredBusinesses = mockBusinesses.filter((business) => {
    const matchesCategory = effectiveCategories.length === 0 || effectiveCategories.includes(business.type);
    const matchesSearch = searchQuery === "" || 
      business.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = business.rating >= ratingFilter;
    const matchesAmenities = selectedAmenities.length === 0 ||
      selectedAmenities.every((a) => business.amenities.includes(a));
    
    return matchesCategory && matchesSearch && matchesRating && matchesAmenities;
  });

  // Sort businesses
  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "price-low":
        return parseInt(a.price.replace(/\D/g, "") || "0") - parseInt(b.price.replace(/\D/g, "") || "0");
      case "price-high":
        return parseInt(b.price.replace(/\D/g, "") || "0") - parseInt(a.price.replace(/\D/g, "") || "0");
      default:
        return 0;
    }
  });

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

  const activeFiltersCount = selectedCategories.length + selectedAmenities.length + 
    (ratingFilter > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Search Header */}
        <div className="bg-card border-b border-border sticky top-16 lg:top-20 z-40">
          <div className="container mx-auto px-4 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
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

              {/* Location */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-2 lg:w-64">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Location"
                  defaultValue="Mumbai, India"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Actions */}
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
                        {activeFiltersCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear All
                          </Button>
                        )}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      <FilterContent
                        categories={categories}
                        selectedCategories={selectedCategories}
                        toggleCategory={toggleCategory}
                        amenities={amenities}
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

            {/* Category Pills */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategories.includes(cat.id)
                      ? "bg-primary text-primary-foreground"
                      : `${cat.color} hover:opacity-80`
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedCategories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="gap-1">
                    {categories.find((c) => c.id === cat)?.name}
                    <button onClick={() => toggleCategory(cat)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedAmenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="gap-1">
                    {amenities.find((a) => a.id === amenity)?.name}
                    <button onClick={() => toggleAmenity(amenity)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {ratingFilter > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {ratingFilter}+ Rating
                    <button onClick={() => setRatingFilter(0)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive">
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-44 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
                <FilterContent
                  categories={categories}
                  selectedCategories={selectedCategories}
                  toggleCategory={toggleCategory}
                  amenities={amenities}
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
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    {sortedBusinesses.length} Businesses Found
                  </h1>
                  <p className="text-muted-foreground">Near your location</p>
                </div>
                <select 
                  className="bg-muted border-0 rounded-lg px-4 py-2 text-sm font-medium text-foreground"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Sort by: Relevance</option>
                  <option value="distance">Distance</option>
                  <option value="rating">Rating</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              {/* Business Cards Grid or Map */}
              {viewMode === "list" ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedBusinesses.map((business) => (
                    <Link
                      key={business.id}
                      to={`/business/${business.id}`}
                      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={business.image}
                          alt={business.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(business.id);
                          }}
                          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            favorites.includes(business.id)
                              ? "bg-accent text-accent-foreground"
                              : "bg-card/80 backdrop-blur-sm text-foreground hover:bg-card"
                          }`}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              favorites.includes(business.id) ? "fill-current" : ""
                            }`}
                          />
                        </button>
                        {/* Status Badge */}
                        <div className="absolute bottom-3 left-3">
                          {getStatusBadge(business.status)}
                        </div>
                        {/* Verified Badge */}
                        {business.verified && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="verified" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Verified
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Category */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">
                            {categories.find((c) => c.id === business.type)?.icon}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {business.type}
                          </span>
                        </div>

                        {/* Name */}
                        <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                          {business.name}
                        </h3>

                        {/* Rating & Distance */}
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
                            {business.distance}
                          </div>
                        </div>

                        {/* Occupancy Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Occupancy</span>
                            <span className="font-medium text-foreground">
                              {business.occupancy}/{business.capacity}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                business.occupancy / business.capacity < 0.6
                                  ? "bg-success"
                                  : business.occupancy / business.capacity < 0.85
                                  ? "bg-warning"
                                  : "bg-destructive"
                              }`}
                              style={{
                                width: `${(business.occupancy / business.capacity) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <span className="font-semibold text-primary">
                            {business.price}
                          </span>
                          <div className="flex gap-1">
                            {business.amenities.slice(0, 3).map((a) => {
                              const amenity = amenities.find((am) => am.id === a);
                              return amenity ? (
                                <div
                                  key={a}
                                  className="w-6 h-6 rounded bg-muted flex items-center justify-center"
                                  title={amenity.name}
                                >
                                  <amenity.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              ) : null;
                            })}
                            {business.amenities.length > 3 && (
                              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                +{business.amenities.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="h-[600px] rounded-2xl overflow-hidden border border-border">
                  <MapView
                    venues={sortedBusinesses.map((b) => ({
                      id: b.id,
                      name: b.name,
                      type: b.type,
                      lat: b.lat,
                      lng: b.lng,
                      rating: b.rating,
                      price: b.price,
                    }))}
                  />
                </div>
              )}

              {sortedBusinesses.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
