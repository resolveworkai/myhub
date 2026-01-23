import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target,
  Heart,
  Users,
  Globe,
  ArrowRight,
  Linkedin,
  Twitter,
} from "lucide-react";

const team = [
  {
    name: "Arjun Mehta",
    role: "CEO & Co-Founder",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    bio: "Former fitness enthusiast turned entrepreneur. 10+ years in tech.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Priya Singh",
    role: "CTO & Co-Founder",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face",
    bio: "Ex-Google engineer. Passionate about building products that matter.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Rahul Sharma",
    role: "Head of Product",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    bio: "Product leader with experience at multiple startups.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Neha Kapoor",
    role: "Head of Marketing",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    bio: "Marketing strategist helping businesses grow.",
    linkedin: "#",
    twitter: "#",
  },
];

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We're on a mission to make fitness and learning accessible to everyone.",
  },
  {
    icon: Heart,
    title: "Customer First",
    description: "Every decision we make starts with our users in mind.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We believe in building strong communities around shared goals.",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Making quality facilities discoverable for everyone, everywhere.",
  },
];

const milestones = [
  { year: "2022", event: "Portal founded in Mumbai" },
  { year: "2023", event: "Launched in 5 major cities" },
  { year: "2023", event: "500+ partner businesses" },
  { year: "2024", event: "50,000+ monthly bookings" },
  { year: "2024", event: "Series A funding secured" },
];

export default function About() {
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
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-6">
                About <span className="text-primary">Portal</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                We're building the future of fitness and learning discovery. Our platform 
                connects people with the best gyms, coaching centers, and libraries in their neighborhood.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Portal was born out of frustration. As fitness enthusiasts, we struggled to find 
                    reliable information about gyms, their availability, and pricing. The same problem 
                    existed for students looking for coaching centers and libraries.
                  </p>
                  <p>
                    We realized that while these facilities existed, discovering them was nearly 
                    impossible. Information was scattered, outdated, or simply unavailable. Booking 
                    required phone calls, and tracking progress was manual.
                  </p>
                  <p>
                    That's when we decided to build Portal - a unified platform that brings together 
                    all fitness and learning facilities, making them easily discoverable, bookable, 
                    and manageable.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                  alt="Team collaboration"
                  className="rounded-3xl shadow-xl"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Our Values
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do at Portal.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-6 rounded-2xl border border-border text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Our Journey
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6 pb-8 last:pb-0"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {milestone.year}
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>
                  <div className="pb-8">
                    <p className="text-lg text-foreground">{milestone.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The passionate people behind Portal.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden text-center"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-primary text-sm mb-2">{member.role}</p>
                    <p className="text-muted-foreground text-sm mb-4">
                      {member.bio}
                    </p>
                    <div className="flex justify-center gap-3">
                      <a
                        href={member.linkedin}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                      >
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <a
                        href={member.twitter}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                      >
                        <Twitter className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
              <div className="relative z-10">
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
                  Join Us on This Journey
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  We're always looking for passionate people to join our team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/careers">
                    <Button variant="hero" size="lg">
                      View Open Positions
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="hero-outline" size="lg">
                      Contact Us
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
