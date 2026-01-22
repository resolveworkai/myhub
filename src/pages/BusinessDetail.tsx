import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Heart,
  Share2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Wifi,
  Car,
  Snowflake,
  ShowerHead,
  MessageSquare,
  X,
  Check,
  Navigation,
} from "lucide-react";

const businessData = {
  id: 1,
  name: "FitZone Premium Gym",
  type: "gym",
  tagline: "Transform Your Body, Transform Your Life",
  description: "FitZone Premium Gym is a state-of-the-art fitness facility offering a comprehensive range of workout options. Our 10,000 sq ft space features the latest cardio and strength training equipment, dedicated zones for functional training, and peaceful yoga studios. Whether you're a beginner or a seasoned athlete, our certified trainers are here to help you achieve your fitness goals.",
  rating: 4.8,
  reviewCount: 156,
  verified: true,
  status: "open",
  occupancy: 45,
  capacity: 100,
  images: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=600&fit=crop",
  ],
  address: "123 Fitness Street, Downtown, New York, NY 10001",
  phone: "+1 (555) 123-4567",
  email: "info@fitzonegym.com",
  website: "https://fitzonegym.com",
  hours: [
    { day: "Monday", open: "5:00 AM", close: "11:00 PM" },
    { day: "Tuesday", open: "5:00 AM", close: "11:00 PM" },
    { day: "Wednesday", open: "5:00 AM", close: "11:00 PM" },
    { day: "Thursday", open: "5:00 AM", close: "11:00 PM" },
    { day: "Friday", open: "5:00 AM", close: "10:00 PM" },
    { day: "Saturday", open: "6:00 AM", close: "8:00 PM" },
    { day: "Sunday", open: "7:00 AM", close: "6:00 PM" },
  ],
  amenities: [
    { id: "wifi", name: "Free WiFi", icon: Wifi },
    { id: "parking", name: "Parking", icon: Car },
    { id: "ac", name: "Air Conditioning", icon: Snowflake },
    { id: "shower", name: "Showers & Lockers", icon: ShowerHead },
    { id: "trainer", name: "Personal Trainers", icon: Users },
  ],
  pricing: [
    {
      name: "Basic",
      price: "₹1,500",
      duration: "month",
      features: ["Access to gym floor", "Cardio equipment", "Basic locker access", "Water fountain access"],
      popular: false,
    },
    {
      name: "Premium",
      price: "₹2,500",
      duration: "month",
      features: ["All Basic features", "Group classes", "Steam room access", "Towel service", "1 PT session/month"],
      popular: true,
    },
    {
      name: "VIP",
      price: "₹5,000",
      duration: "month",
      features: ["All Premium features", "Priority booking", "4 PT sessions/month", "Nutrition consultation", "Guest passes (2/month)"],
      popular: false,
    },
  ],
  reviewsList: [
    {
      id: 1,
      user: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      date: "2 weeks ago",
      comment: "Absolutely love this gym! The equipment is always clean and well-maintained. The trainers are super helpful and motivating.",
      helpful: 24,
    },
    {
      id: 2,
      user: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 4,
      date: "1 month ago",
      comment: "Great gym with excellent facilities. Can get crowded during peak hours but overall a fantastic experience.",
      helpful: 18,
    },
    {
      id: 3,
      user: "Emily Watson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      date: "1 month ago",
      comment: "The yoga classes here are amazing! Instructors are knowledgeable and the studio has a great atmosphere.",
      helpful: 12,
    },
  ],
  schedule: [
    { time: "6:00 AM", slots: 15, booked: 8 },
    { time: "7:00 AM", slots: 15, booked: 14 },
    { time: "8:00 AM", slots: 15, booked: 12 },
    { time: "9:00 AM", slots: 15, booked: 6 },
    { time: "10:00 AM", slots: 15, booked: 4 },
    { time: "5:00 PM", slots: 15, booked: 15 },
    { time: "6:00 PM", slots: 15, booked: 13 },
    { time: "7:00 PM", slots: 15, booked: 10 },
    { time: "8:00 PM", slots: 15, booked: 7 },
  ],
};

export default function BusinessDetail() {
  const { id } = useParams();
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const business = businessData;

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % business.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + business.images.length) % business.images.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 lg:pt-20">
        {/* Hero Image Gallery */}
        <div className="relative h-[50vh] lg:h-[60vh] bg-muted">
          <img
            src={business.images[currentImage]}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          
          {/* Navigation Arrows */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {business.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImage ? "border-primary scale-110" : "border-transparent opacity-70"
                }`}
              >
                <img
                  src={business.images[index]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isFavorite ? "bg-accent text-accent-foreground" : "bg-card/80 backdrop-blur-sm"
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </button>
            <button className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Verified Badge */}
          {business.verified && (
            <div className="absolute top-4 left-4">
              <Badge variant="verified" className="gap-1 px-3 py-1.5">
                <Shield className="h-4 w-4" />
                Verified Business
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏋️</span>
                  <Badge variant="gym">Gym</Badge>
                  <Badge variant="available" className="ml-2">
                    Open Now
                  </Badge>
                </div>
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {business.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">{business.tagline}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    <span className="font-semibold text-foreground">{business.rating}</span>
                    <span className="text-muted-foreground">({business.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    2.5 km away
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Occupancy:</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{ width: `${(business.occupancy / business.capacity) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{business.occupancy}/{business.capacity}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  {["overview", "pricing", "schedule", "reviews", "community"].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-8">
                  {/* Description */}
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-3">About</h3>
                    <p className="text-muted-foreground leading-relaxed">{business.description}</p>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {business.amenities.map((amenity) => (
                        <div
                          key={amenity.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <amenity.icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hours */}
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-4">Operating Hours</h3>
                    <div className="grid gap-2">
                      {business.hours.map((hour) => (
                        <div
                          key={hour.day}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <span className="font-medium">{hour.day}</span>
                          <span className="text-muted-foreground">
                            {hour.open} - {hour.close}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-4">Location</h3>
                    <div className="aspect-video bg-muted rounded-xl flex items-center justify-center mb-4">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Interactive map</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground flex items-start gap-2">
                      <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      {business.address}
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="mt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {business.pricing.map((plan) => (
                      <div
                        key={plan.name}
                        className={`relative p-6 rounded-2xl border-2 transition-all ${
                          plan.popular
                            ? "border-primary bg-primary/5 shadow-lg"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {plan.popular && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                            Most Popular
                          </Badge>
                        )}
                        <h3 className="font-display text-xl font-semibold mb-2">{plan.name}</h3>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-primary">{plan.price}</span>
                          <span className="text-muted-foreground">/{plan.duration}</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Check className="h-5 w-5 text-success flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          variant={plan.popular ? "gradient" : "outline"}
                          className="w-full"
                        >
                          Choose {plan.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display text-xl font-semibold">Today's Schedule</h3>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Full Calendar
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {business.schedule.map((slot) => {
                        const availability = slot.slots - slot.booked;
                        const isFull = availability === 0;
                        return (
                          <div
                            key={slot.time}
                            className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-lg font-semibold w-20">{slot.time}</div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isFull ? "bg-destructive" : availability < 5 ? "bg-warning" : "bg-success"
                                    }`}
                                    style={{ width: `${(slot.booked / slot.slots) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {slot.booked}/{slot.slots} booked
                                </span>
                              </div>
                            </div>
                            <Button
                              variant={isFull ? "outline" : "default"}
                              size="sm"
                              disabled={isFull}
                            >
                              {isFull ? "Full" : "Book"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-6">
                    {/* Rating Summary */}
                    <div className="flex items-center gap-8 p-6 rounded-2xl bg-muted/50">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-foreground">{business.rating}</div>
                        <div className="flex gap-1 my-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= Math.round(business.rating)
                                  ? "fill-warning text-warning"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">{business.reviewCount} reviews</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm w-3">{rating}</span>
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-warning rounded-full"
                                style={{ width: `${rating === 5 ? 70 : rating === 4 ? 20 : 10}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {business.reviewsList.map((review) => (
                        <div key={review.id} className="p-4 rounded-xl border border-border">
                          <div className="flex items-start gap-4">
                            <img
                              src={review.avatar}
                              alt={review.user}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold">{review.user}</h4>
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                              <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? "fill-warning text-warning"
                                        : "text-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-muted-foreground">{review.comment}</p>
                              <button className="text-sm text-primary mt-2 hover:underline">
                                Helpful ({review.helpful})
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full">
                      Load More Reviews
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="community" className="mt-6">
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-xl font-semibold mb-2">Community Section</h3>
                    <p className="text-muted-foreground mb-4">
                      Join the conversation with fellow members
                    </p>
                    <Link to="/signup">
                      <Button variant="gradient">Sign Up to Participate</Button>
                    </Link>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="sticky top-24 space-y-6">
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <div className="text-center mb-6">
                    <div className="text-sm text-muted-foreground mb-1">Starting from</div>
                    <div className="text-3xl font-bold text-primary">₹1,500<span className="text-base font-normal text-muted-foreground">/month</span></div>
                  </div>
                  
                  <div className="space-y-3">
                    <Link to="/signup">
                      <Button variant="gradient" className="w-full" size="lg">
                        Enroll Now
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" size="lg">
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Trial Session
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    <a
                      href={`tel:${business.phone}`}
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">Call Us</div>
                        <div className="text-muted-foreground">{business.phone}</div>
                      </div>
                    </a>
                    <a
                      href={`mailto:${business.email}`}
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">Email Us</div>
                        <div className="text-muted-foreground">{business.email}</div>
                      </div>
                    </a>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">Website</div>
                        <div className="text-muted-foreground">fitzonegym.com</div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Live Occupancy */}
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Live Occupancy
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold">{business.occupancy}</span>
                    <span className="text-muted-foreground">/ {business.capacity}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-success rounded-full transition-all"
                      style={{ width: `${(business.occupancy / business.capacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usually busy at this time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border lg:hidden">
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" className="flex-1">
            <Mail className="h-5 w-5" />
          </Button>
          <Link to="/signup" className="flex-[2]">
            <Button variant="gradient" size="lg" className="w-full">
              Enroll Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
