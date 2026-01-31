import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Star,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useEnabledCategories } from "@/hooks/useEnabledCategories";

const stats = [
  { label: "Venues", value: "2,500+", icon: Users },
  { label: "Happy Users", value: "50,000+", icon: Star },
  { label: "Bookings Made", value: "1M+", icon: Calendar },
];

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const navigate = useNavigate();
  const { categories } = useEnabledCategories();

  // Build categories dynamically based on enabled config
  const quickCategories = useMemo(() => {
    return categories.map((cat) => ({
      name: cat.namePlural,
      icon: cat.icon,
      href: cat.route,
      color: cat.heroColor,
    }));
  }, [categories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-25" />
      
      {/* Animated Background Elements - Hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden hidden sm:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />

      <div className="container relative mx-auto px-4 lg:px-8 pt-20 sm:pt-24 lg:pt-32 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-6 sm:mb-8 animate-fade-in">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
            <span className="text-primary-foreground/90 text-xs sm:text-sm font-medium">
              Trusted by 50,000+ users across UAE
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-4 sm:mb-6 tracking-tight animate-slide-up leading-tight px-2">
            Your Gateway to
            <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
              Fitness & Learning
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-primary-foreground/80 mb-8 sm:mb-10 max-w-2xl mx-auto animate-slide-up px-4" style={{ animationDelay: "0.1s" }}>
            Discover and book gyms, coaching centers, and libraries near you.
            Real-time availability, instant booking, and progress tracking.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6 sm:mb-8 animate-slide-up px-2" style={{ animationDelay: "0.2s" }}>
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center bg-primary-foreground/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-primary-foreground/20 p-2 shadow-xl">
              <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 bg-primary-foreground/5 sm:bg-transparent rounded-lg sm:rounded-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Search gyms, coaching..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 outline-none text-sm sm:text-base py-2.5 sm:py-2 min-w-0"
                />
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 sm:border-l border-primary-foreground/20 bg-primary-foreground/5 sm:bg-transparent rounded-lg sm:rounded-none">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Location"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="flex-1 sm:w-28 md:w-32 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 outline-none text-sm sm:text-base py-2.5 sm:py-2 min-w-0"
                />
              </div>
              <Button type="submit" variant="accent" size="lg" className="rounded-lg sm:rounded-xl w-full sm:w-auto h-11 sm:h-auto touch-target">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                <span className="sm:inline">Search</span>
              </Button>
            </div>
          </form>

          {/* Quick Categories */}
          <div className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 animate-slide-up px-4 overflow-x-auto scrollbar-hide pb-2" style={{ animationDelay: "0.25s" }}>
            {quickCategories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full ${cat.color} text-xs sm:text-sm font-medium hover:scale-105 transition-transform touch-target`}
              >
                <cat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {cat.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 animate-slide-up px-4" style={{ animationDelay: "0.3s" }}>
            <Link to="/explore" className="w-full sm:w-auto">
              <Button variant="hero" size="lg" className="w-full sm:w-auto h-12 sm:h-14 text-sm sm:text-base touch-target">
                Explore Venues
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/for-business" className="w-full sm:w-auto">
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto h-12 sm:h-14 text-sm sm:text-base touch-target">
                List Your Business
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 max-w-xl mx-auto animate-fade-in px-2" style={{ animationDelay: "0.4s" }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-1 sm:mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  </div>
                </div>
                <div className="font-display text-lg sm:text-xl md:text-3xl font-bold text-primary-foreground">
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow hidden md:block">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-primary-foreground/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
