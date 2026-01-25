import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  MessageSquare,
  ArrowRight,
  Check,
  Star,
  Phone,
  Mail,
  Play,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Increased Visibility",
    description: "Reach 10,000+ active users in your area actively looking for gyms, libraries, and coaching centers.",
    stat: "10,000+",
    statLabel: "Active Users",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI-powered occupancy optimization helps you manage peak hours and maximize revenue.",
    stat: "40%",
    statLabel: "Better Utilization",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Real-time insights and growth metrics to track bookings, revenue, and customer behavior.",
    stat: "Real-time",
    statLabel: "Analytics",
  },
  {
    icon: Zap,
    title: "Easy Management",
    description: "Manage everything from one place - bookings, payments, staff, and customer communications.",
    stat: "One",
    statLabel: "Dashboard",
  },
  {
    icon: MessageSquare,
    title: "Customer Engagement",
    description: "Built-in messaging, reviews management, and automated reminders to keep customers engaged.",
    stat: "95%",
    statLabel: "Response Rate",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Secure payment processing with multiple options. Get paid on time, every time.",
    stat: "100%",
    statLabel: "Secure",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for small businesses just getting started",
    features: [
      "1 location",
      "50 bookings/month",
      "Basic analytics",
      "Email support",
      "Standard listing",
      "Basic scheduling",
    ],
    limitations: [
      "Limited to 50 bookings",
      "No priority support",
      "Basic features only",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Growth",
    price: "₹3,999",
    period: "month",
    description: "For growing businesses that need more power",
    features: [
      "3 locations",
      "Unlimited bookings",
      "Advanced analytics",
      "Priority support",
      "Featured listing",
      "Smart scheduling",
      "Customer insights",
      "Payment processing",
      "Staff management",
    ],
    limitations: [],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large businesses with custom needs",
    features: [
      "Unlimited locations",
      "Unlimited bookings",
      "White-label options",
      "API access",
      "Dedicated manager",
      "Custom integrations",
      "Advanced security",
      "SLA guarantee",
      "Training & onboarding",
    ],
    limitations: [],
    cta: "Contact Sales",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, FitZone Gym",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    quote: "Portal increased our bookings by 60% in just 3 months. The analytics dashboard helps us understand our customers better.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Director, Excel Coaching",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    quote: "Managing multiple batches was a nightmare before Portal. Now everything is streamlined and our students love the easy booking.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Manager, City Library",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    quote: "The occupancy tracking feature is a game-changer. We can now manage study room bookings efficiently.",
    rating: 5,
  },
];

const stats = [
  { value: "500+", label: "Partner Businesses" },
  { value: "50,000+", label: "Monthly Bookings" },
  { value: "4.8", label: "Average Rating" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default function ForBusiness() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="secondary" className="mb-4">
                  <Building2 className="h-4 w-4 mr-1" />
                  For Business Owners
                </Badge>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 sm:mb-6">
                  Grow Your Business with{" "}
                  <span className="text-primary">Portal</span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
                  Join 500+ gyms, coaching centers, and libraries that have increased their bookings 
                  and revenue with our powerful management platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link to="/signup/business" className="w-full sm:w-auto">
                    <Button variant="gradient" size="lg" className="w-full sm:w-auto h-12 touch-target">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="h-12 touch-target">
                    <Play className="h-5 w-5 mr-2" />
                    Watch Demo
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-info opacity-20 rounded-3xl blur-3xl" />
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
                  alt="Dashboard Preview"
                  className="relative rounded-3xl shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful tools designed specifically for gyms, coaching centers, and libraries.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{feature.stat}</div>
                      <div className="text-xs text-muted-foreground">{feature.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Choose the plan that fits your business. Start free, upgrade when you need more.
              </p>
              
              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-full">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === "monthly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === "yearly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Yearly
                  <Badge variant="success" className="ml-2">Save 20%</Badge>
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-card rounded-2xl sm:rounded-3xl border-2 p-6 sm:p-8 ${
                    plan.popular
                      ? "border-primary shadow-xl lg:scale-105"
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <div className="mb-6">
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {billingPeriod === "yearly" && plan.price !== "Free" && plan.price !== "Custom"
                          ? "₹3,199"
                          : plan.price}
                      </span>
                      {plan.price !== "Free" && plan.price !== "Custom" && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-success flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.name === "Enterprise" ? "/contact" : "/signup/business"}>
                    <Button
                      variant={plan.popular ? "gradient" : "outline"}
                      className="w-full"
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Success Stories
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how businesses like yours are growing with Portal.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-6 rounded-2xl border border-border"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-primary to-info">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Grow Your Business?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join 500+ businesses already using Portal. Start your free trial today - no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup/business">
                  <Button variant="hero" size="lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="hero-outline" size="lg">
                    <Phone className="h-5 w-5 mr-2" />
                    Schedule Demo
                  </Button>
                </Link>
              </div>
              <p className="text-white/60 mt-6 text-sm">
                Questions? Contact us at{" "}
                <a href="mailto:business@portal.com" className="text-white underline">
                  business@portal.com
                </a>
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
