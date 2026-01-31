import { useMemo } from "react";
import { 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Bell, 
  Shield, 
  Zap,
  Users,
  CreditCard,
  Star,
  MessageSquare,
  BarChart3,
  Smartphone,
} from "lucide-react";
import { useEnabledCategories } from "@/hooks/useEnabledCategories";

const features = [
  {
    icon: MapPin,
    title: "Discover Nearby",
    description: "Find gyms, libraries, and coaching centers near you with our interactive map and smart filters.",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    icon: Calendar,
    title: "Easy Booking",
    description: "Book appointments in seconds. View real-time availability and never miss a slot again.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your attendance streaks, achievements, and personal growth over time.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Get timely notifications for appointments, fee dues, and important updates.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: CreditCard,
    title: "Seamless Payments",
    description: "Pay fees online, download receipts, and keep track of all your transactions.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Connect with fellow members, share experiences, and stay motivated together.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

const businessFeatures = [
  {
    icon: Users,
    title: "Member Management",
    description: "Easily manage members, track attendance, and handle fee collection all in one place.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Get insights into revenue, member retention, peak hours, and business growth.",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description: "Enterprise-grade security with GDPR compliance and role-based access control.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Manage your business on-the-go with our fully responsive mobile experience.",
  },
];

export function FeaturesSection() {
  const { categories } = useEnabledCategories();
  
  // Build description dynamically based on enabled categories
  const categoryNames = useMemo(() => {
    const names = categories.map((c) => c.namePlural.toLowerCase());
    if (names.length === 0) return "services";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }, [categories]);

  return (
    <section id="features" className="py-12 sm:py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            Features
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-2">
            Everything You Need to
            <span className="gradient-text"> Stay on Track</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4">
            Whether you're a fitness enthusiast, a bookworm, or a lifelong learner,
            Portal has the tools to help you find and book {categoryNames}.
          </p>
        </div>

        {/* User Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-24">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${feature.bgColor} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.color}`} />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-1.5 sm:mb-2">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Business Features */}
        <div className="relative">
          {/* Background Card */}
          <div className="absolute inset-0 gradient-primary rounded-2xl sm:rounded-3xl opacity-5" />
          
          <div className="relative rounded-2xl sm:rounded-3xl border border-primary/20 p-4 sm:p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              {/* Left Content */}
              <div>
                <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-accent/10 text-accent text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                  For Business Owners
                </span>
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                  Powerful Tools to Grow Your Business
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8">
                  From member management to analytics, get everything you need to run
                  and scale your gym, library, or coaching center.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {businessFeatures.map((feature) => (
                    <div key={feature.title} className="flex gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">
                          {feature.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative">
                <div className="aspect-square rounded-2xl gradient-primary p-8 flex items-center justify-center">
                  <div className="w-full h-full bg-card/90 rounded-xl shadow-xl p-6 space-y-4">
                    {/* Mock Dashboard Preview */}
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-8 bg-primary/20 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-lg">
                          <div className="h-3 w-12 bg-muted rounded mb-2" />
                          <div className="h-6 w-16 bg-primary/20 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="h-32 bg-gradient-to-t from-primary/10 to-transparent rounded-lg" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-muted rounded-full" />
                          <div className="flex-1 h-3 bg-muted rounded" />
                          <div className="h-6 w-16 bg-success/20 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent rounded-2xl shadow-lg flex items-center justify-center animate-float">
                  <TrendingUp className="h-10 w-10 text-accent-foreground" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-success rounded-2xl shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: "-2s" }}>
                  <Star className="h-8 w-8 text-success-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
