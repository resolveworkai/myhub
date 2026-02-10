import React, { useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/usePagination";
import { usePlatformStore } from "@/store/platformStore";
import { useFavoriteStore } from "@/store/favoriteStore";
import {
  Search, MapPin, Star, Filter, Map, List, Heart, X, Shield, Loader2, ShoppingCart,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { PlatformBusiness, BusinessVertical } from "@/types/platform";

const VERTICAL_INFO: Record<BusinessVertical, { emoji: string; label: string }> = {
  coaching: { emoji: "📚", label: "Coaching" },
  gym: { emoji: "💪", label: "Gym / Yoga" },
  library: { emoji: "📖", label: "Library" },
};

export default function Explore() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | BusinessVertical>("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [minRating, setMinRating] = useState(0);

  const { getApprovedBusinesses, cart } = usePlatformStore();
  const { toggleFavorite, isFavorite } = useFavoriteStore();

  // Sync route to category
  const routePath = location.pathname.replace("/", "");
  const effectiveCategory = useMemo(() => {
    if (routePath === "gyms") return "gym" as const;
    if (routePath === "coaching") return "coaching" as const;
    if (routePath === "libraries") return "library" as const;
    return activeCategory;
  }, [routePath, activeCategory]);

  const businesses = useMemo(() => {
    let result = getApprovedBusinesses().filter(b => !b.closedToday);

    // Category
    if (effectiveCategory !== "all") {
      result = result.filter(b => b.vertical === effectiveCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.address.area.toLowerCase().includes(q) ||
        b.address.city.toLowerCase().includes(q) ||
        b.subjects?.some(s => s.name.toLowerCase().includes(q)) ||
        b.amenities.some(a => a.toLowerCase().includes(q))
      );
    }

    // Rating
    if (minRating > 0) {
      result = result.filter(b => b.rating >= minRating);
    }

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        result.sort((a, b) => getMinPrice(a) - getMinPrice(b));
        break;
      case "price-high":
        result.sort((a, b) => getMinPrice(b) - getMinPrice(a));
        break;
      case "popularity":
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        result.sort((a, b) => (b.rating * 10 + Math.log10(b.reviews + 1) * 3) - (a.rating * 10 + Math.log10(a.reviews + 1) * 3));
    }

    return result;
  }, [getApprovedBusinesses, effectiveCategory, searchQuery, minRating, sortBy]);

  const { paginatedData, currentPage, totalPages, goToPage, startIndex, endIndex, totalItems } = usePagination({
    data: businesses,
    itemsPerPage: 12,
  });

  const handleToggleFavorite = useCallback((id: string) => toggleFavorite(id), [toggleFavorite]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Search Header */}
        <div className="bg-card border-b border-border sticky top-16 lg:top-20 z-40">
          <div className="container mx-auto px-4 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 flex items-center gap-3 bg-muted rounded-xl px-4 py-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search classes, gyms, libraries..."
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto">
                {(["all", "coaching", "gym", "library"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat === "all" ? "all" : cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      effectiveCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat === "all" ? "🌐 All" : `${VERTICAL_INFO[cat].emoji} ${VERTICAL_INFO[cat].label}`}
                  </button>
                ))}
              </div>

              {/* Sort + Cart */}
              <div className="flex gap-2 items-center">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-muted border-0">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="price-low">Price: Low</SelectItem>
                    <SelectItem value="price-high">Price: High</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="relative" onClick={() => navigate("/cart")}>
                  <ShoppingCart className="h-5 w-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold">{totalItems} businesses found</h1>
              <p className="text-sm text-muted-foreground">
                {effectiveCategory !== "all" ? VERTICAL_INFO[effectiveCategory].label : "All categories"} in Dubai
              </p>
            </div>
          </div>

          {/* Results Grid */}
          {paginatedData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {paginatedData.map((biz: PlatformBusiness) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  isFav={isFavorite(biz.id)}
                  onToggleFav={() => handleToggleFavorite(biz.id)}
                  onNavigate={() => navigate(`/venue/${biz.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
                Clear Filters
              </Button>
            </div>
          )}

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
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Helper
function getMinPrice(biz: PlatformBusiness): number {
  if (biz.subjects?.length) {
    return Math.min(...biz.subjects.flatMap(s => s.pricingTiers.map(p => p.price)));
  }
  if (biz.passTemplates?.length) {
    return Math.min(...biz.passTemplates.filter(p => p.isActive).map(p => p.price));
  }
  return 0;
}

function BusinessCard({ business, isFav, onToggleFav, onNavigate }: {
  business: PlatformBusiness;
  isFav: boolean;
  onToggleFav: () => void;
  onNavigate: () => void;
}) {
  const info = VERTICAL_INFO[business.vertical];
  const minPrice = getMinPrice(business);

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer" onClick={onNavigate}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={business.image} alt={business.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(); }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isFav ? "bg-accent text-accent-foreground" : "bg-card/80 backdrop-blur-sm text-foreground hover:bg-card"}`}
        >
          <Heart className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{info.emoji} {info.label}</Badge>
        </div>
        {business.verified && (
          <Badge className="absolute top-3 left-3 gap-1 bg-success text-success-foreground text-xs">
            <Shield className="h-3 w-3" /> Verified
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
          {business.name}
        </h3>
        <div className="flex items-center gap-3 text-sm mb-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium">{business.rating}</span>
            <span className="text-muted-foreground">({business.reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {business.address.area}
          </div>
        </div>
        {/* Subjects or segments */}
        <p className="text-xs text-muted-foreground mb-3 truncate">
          {business.subjects?.map(s => s.name).join(', ') ||
           business.passTemplates?.filter(p => p.isActive).map(p => p.timeSegmentName).filter((v, i, a) => a.indexOf(v) === i).join(', ') ||
           business.description.substring(0, 60)}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="font-semibold text-primary">
            {minPrice > 0 ? `From ₹${minPrice}` : "Contact for pricing"}
          </span>
          <Button size="sm" variant="gradient" onClick={e => { e.stopPropagation(); onNavigate(); }}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
