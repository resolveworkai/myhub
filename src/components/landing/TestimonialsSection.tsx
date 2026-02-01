import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Fitness Enthusiast",
    location: "Mumbai, Maharashtra",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    content: "Portal has completely transformed how I manage my fitness routine. I can easily book classes at my favorite gyms across Mumbai, track my streaks, and stay motivated!",
    rating: 5,
    type: "user",
  },
  {
    name: "Rajesh Patel",
    role: "Gym Owner - FitZone",
    location: "Ahmedabad, Gujarat",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: "As a gym owner, Portal has streamlined our operations incredibly. Member management, fee collection, and analytics are all in one place. Revenue is up 45%!",
    rating: 5,
    type: "business",
  },
  {
    name: "Ananya Reddy",
    role: "Engineering Student",
    location: "Hyderabad, Telangana",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content: "Finding a quiet study spot used to be a nightmare. With Portal, I can see real-time availability at libraries across Hyderabad and book my favorite desk in advance.",
    rating: 5,
    type: "user",
  },
  {
    name: "Vikram Singh",
    role: "Yoga Studio Owner",
    location: "Jaipur, Rajasthan",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content: "The booking system is seamless, and our members love the progress tracking features. The analytics help us understand peak hours and optimize our class schedule.",
    rating: 5,
    type: "business",
  },
  {
    name: "Kavitha Nair",
    role: "Coaching Center Director",
    location: "Kochi, Kerala",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
    content: "We've been able to grow our student base by 60% since listing on Portal. The platform makes it easy for new students to discover us and sign up for classes.",
    rating: 5,
    type: "business",
  },
  {
    name: "Arjun Mehta",
    role: "IT Professional",
    location: "Bangalore, Karnataka",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    content: "I love the streak feature! Seeing my 45-day streak keeps me accountable. The reminders ensure I never miss a session at my local gym in Koramangala.",
    rating: 5,
    type: "user",
  },
];

export function TestimonialsSection() {
  const { t } = useTranslation();

  const stats = useMemo(() => [
    { label: t("testimonials.stats.averageRating"), value: "4.9/5" },
    { label: t("testimonials.stats.userSatisfaction"), value: "98%" },
    { label: t("testimonials.stats.businessGrowth"), value: "+45%" },
    { label: t("testimonials.stats.citiesCovered"), value: "50+" },
  ], [t]);

  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            {t("testimonials.badge")}
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t("testimonials.title")}
            <span className="gradient-text"> {t("testimonials.titleHighlight")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("testimonials.subtitle")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="h-10 w-10 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-warning text-warning"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-primary">
                    📍 {testimonial.location}
                  </p>
                </div>
                {testimonial.type === "business" && (
                  <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    {t("testimonials.business")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 p-8 rounded-2xl gradient-primary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/70">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}