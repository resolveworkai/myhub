import { Search, CalendarCheck, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Discover",
    description: "Browse nearby gyms, libraries, and coaching centers. Filter by location, price, amenities, and ratings to find your perfect match.",
    color: "from-info to-primary",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Book",
    description: "View real-time availability and book your appointments instantly. Get confirmation and reminders automatically.",
    color: "from-primary to-accent",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Track & Grow",
    description: "Monitor your attendance streaks, unlock achievements, and track your progress over time. Stay motivated with challenges.",
    color: "from-accent to-warning",
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
            <span className="gradient-text"> 3 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're looking to join a gym, find a quiet library, or get coaching,
            we make it easy to find and book what you need.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-info via-primary to-accent -translate-y-1/2 opacity-20" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Card */}
                <div className="relative bg-card rounded-2xl p-8 border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                  {/* Step Number */}
                  <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-display font-bold text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow for Desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                      <div className="w-12 h-12 rounded-full bg-card border-2 border-border flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
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
