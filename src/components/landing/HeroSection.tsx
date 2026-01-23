import { useState } from "react";
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
  Dumbbell,
  BookOpen,
  GraduationCap,
} from "lucide-react";

const stats = [
  { label: "Venues", value: "2,500+", icon: Users },
  { label: "Happy Users", value: "50,000+", icon: Star },
  { label: "Bookings Made", value: "1M+", icon: Calendar },
];

const categories = [
  { name: "Gyms", icon: Dumbbell, href: "/gyms", color: "bg-blue-500/20 text-blue-400" },
  { name: "Coaching", icon: GraduationCap, href: "/coaching", color: "bg-purple-500/20 text-purple-400" },
  { name: "Libraries", icon: BookOpen, href: "/libraries", color: "bg-green-500/20 text-green-400" },
];

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30" />

      <div className="container relative mx-auto px-4 lg:px-8 pt-24 lg:pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-primary-foreground/90 text-sm font-medium">
              Trusted by 50,000+ users across UAE
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-6 tracking-tight animate-slide-up">
            Your Gateway to
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-accent via-warning to-accent">
              Fitness & Learning
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Discover and book gyms, coaching centers, and libraries near you.
            Real-time availability, instant booking, and progress tracking.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-primary-foreground/10 backdrop-blur-md rounded-2xl border border-primary-foreground/20 p-2 shadow-xl gap-2 md:gap-0">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="h-5 w-5 text-primary-foreground/60" />
                <input
                  type="text"
                  placeholder="Search gyms, coaching, libraries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 outline-none text-base py-2 md:py-0"
                />
              </div>
              <div className="flex items-center gap-2 px-4 md:border-l border-primary-foreground/20">
                <MapPin className="h-5 w-5 text-primary-foreground/60" />
                <input
                  type="text"
                  placeholder="Location"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="w-full md:w-32 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 outline-none text-base py-2 md:py-0"
                />
              </div>
              <Button type="submit" variant="accent" size="lg" className="rounded-xl w-full md:w-auto">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Quick Categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full ${cat.color} text-sm font-medium hover:scale-105 transition-transform`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/explore">
              <Button variant="hero" size="xl">
                Explore Venues
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/for-business">
              <Button variant="hero-outline" size="xl">
                List Your Business
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <div className="font-display text-xl md:text-3xl font-bold text-primary-foreground">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow hidden md:block">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-primary-foreground/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
