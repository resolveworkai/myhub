import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  Star,
  ArrowRight,
  MapPin,
  Clock,
  Shield,
  Smartphone,
  Bell,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Discover",
    description: "Browse through hundreds of gyms, coaching centers, and libraries near you. Use our smart filters to find the perfect match.",
    icon: Search,
    features: ["Location-based search", "Category filters", "Real-time availability", "Verified reviews"],
    color: "from-primary to-info",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
  },
  {
    number: "02",
    title: "Compare",
    description: "Compare pricing, amenities, and reviews side by side. Find the best value that fits your budget and preferences.",
    icon: Filter,
    features: ["Price comparison", "Amenity checklist", "User ratings", "Distance calculator"],
    color: "from-info to-success",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=400&fit=crop",
  },
  {
    number: "03",
    title: "Book",
    description: "Reserve your spot instantly with real-time availability. Get instant confirmation and never miss a session.",
    icon: Calendar,
    features: ["Instant booking", "Flexible scheduling", "Easy cancellation", "QR check-in"],
    color: "from-success to-warning",
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=400&fit=crop",
  },
  {
    number: "04",
    title: "Experience",
    description: "Enjoy your session and track your progress. Share your experience and help others find great places.",
    icon: Star,
    features: ["Progress tracking", "Achievement badges", "Community reviews", "Referral rewards"],
    color: "from-warning to-accent",
    image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&h=400&fit=crop",
  },
];

const benefits = [
  {
    icon: MapPin,
    title: "Find Nearby Venues",
    description: "Discover the best fitness centers, libraries, and coaching institutes within your preferred distance.",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "No more calling or visiting venues. Book instantly online and manage everything from your phone.",
  },
  {
    icon: Shield,
    title: "Verified Businesses",
    description: "All businesses are verified for quality and safety. Read genuine reviews from real users.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Access Portal from any device. Book, manage, and track your activities on the go.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Never miss a session with automated reminders and real-time occupancy updates.",
  },
  {
    icon: CheckCircle2,
    title: "Easy Check-in",
    description: "Quick QR code check-in at venues. Track your attendance and maintain your streak.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-6">
                How <span className="text-primary">Portal</span> Works
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Finding and booking your perfect gym, coaching center, or library has never been easier. 
                Follow these simple steps to get started on your journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/explore">
                  <Button variant="gradient" size="lg">
                    Start Exploring
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" size="lg">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-24"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  className={`flex flex-col lg:flex-row gap-12 items-center ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Image */}
                  <div className="flex-1 w-full">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-20 rounded-3xl blur-3xl`} />
                      <img
                        src={step.image}
                        alt={step.title}
                        className="relative w-full aspect-[4/3] object-cover rounded-3xl shadow-xl"
                      />
                      <div className={`absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <span className="text-2xl font-bold text-white">{step.number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center`}>
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                      {step.title}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {step.description}
                    </p>
                    <ul className="grid grid-cols-2 gap-3">
                      {step.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-foreground">
                          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Why Choose Portal?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We've built Portal to make your fitness and learning journey seamless.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit.title}
                  variants={itemVariants}
                  className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-info p-8 lg:p-16 text-center"
            >
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative z-10">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  Join thousands of users who have already discovered their perfect fitness and learning destinations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/signup">
                    <Button variant="hero" size="lg">
                      Create Free Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/explore">
                    <Button variant="hero-outline" size="lg">
                      Browse Venues
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
