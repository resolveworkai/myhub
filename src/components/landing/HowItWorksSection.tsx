import { Search, Filter, CalendarCheck, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Discover",
    description: "Browse categories, view venues on an interactive map, and read real reviews from other users.",
    color: "from-info to-primary",
    details: ["Search by location", "Filter by category", "Read reviews"],
  },
  {
    number: "02",
    icon: Filter,
    title: "Compare",
    description: "Filter by price, amenities, location, and availability. Find the perfect match for your needs.",
    color: "from-primary to-accent",
    details: ["Price range filter", "Amenity selection", "Rating comparison"],
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Book",
    description: "Select your time slot, check real-time availability, and get instant confirmation.",
    color: "from-accent to-warning",
    details: ["Real-time slots", "Instant booking", "Email confirmation"],
  },
  {
    number: "04",
    icon: Star,
    title: "Experience",
    description: "Check-in at the venue, enjoy your session, and leave a review to help others.",
    color: "from-warning to-success",
    details: ["Easy check-in", "Track progress", "Leave reviews"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Get Started in
            <span className="gradient-text"> 4 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're looking to join a gym, find a quiet library, or get coaching,
            Portal makes it easy to discover and book what you need.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-info via-primary via-accent to-success -translate-y-1/2 opacity-20" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Card */}
                <div className="relative bg-card rounded-2xl p-6 lg:p-8 border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 h-full">
                  {/* Step Number */}
                  <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-display font-bold text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6 mt-4 group-hover:bg-primary/10 transition-colors">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow for Desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to="/signup">
            <Button variant="gradient" size="xl">
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Free forever for basic features
          </p>
        </div>
      </div>
    </section>
  );
}
