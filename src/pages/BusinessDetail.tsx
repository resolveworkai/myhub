import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingModal } from "@/components/booking/BookingModal";
import { MembershipPaymentModal } from "@/components/payments/MembershipPaymentModal";
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
  Check,
  Navigation,
  ArrowLeft,
  Loader2,
  CreditCard,
} from "lucide-react";

import gymsData from "@/data/mock/gyms.json";
import coachingData from "@/data/mock/coaching.json";
import librariesData from "@/data/mock/libraries.json";
import businessUsersData from "@/data/mock/businessUsers.json";

// Combine all venue data
const allVenues = [
  ...gymsData.map((g) => ({ ...g, type: "gym" as const })),
  ...coachingData.map((c) => ({ ...c, type: "coaching" as const })),
  ...librariesData.map((l) => ({ ...l, type: "library" as const })),
];

// Create a mapping from business user ID to their venue locations
const businessUserVenueMap: Record<string, string[]> = {};
businessUsersData.forEach((bu: any) => {
  businessUserVenueMap[bu.id] = bu.locations || [];
});

// Icon mapping for amenities
const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  ac: Snowflake,
  shower: ShowerHead,
  lockers: Users,
  trainer: Users,
};

// Default mock schedule
const defaultSchedule = [
  { time: "06:00 AM", slots: 15, booked: 8 },
  { time: "07:00 AM", slots: 15, booked: 14 },
  { time: "08:00 AM", slots: 15, booked: 12 },
  { time: "09:00 AM", slots: 15, booked: 6 },
  { time: "10:00 AM", slots: 15, booked: 4 },
  { time: "05:00 PM", slots: 15, booked: 15 },
  { time: "06:00 PM", slots: 15, booked: 13 },
  { time: "07:00 PM", slots: 15, booked: 10 },
  { time: "08:00 PM", slots: 15, booked: 7 },
];

// Default operating hours
const defaultHours = [
  { day: "Monday", open: "6:00 AM", close: "10:00 PM" },
  { day: "Tuesday", open: "6:00 AM", close: "10:00 PM" },
  { day: "Wednesday", open: "6:00 AM", close: "10:00 PM" },
  { day: "Thursday", open: "6:00 AM", close: "10:00 PM" },
  { day: "Friday", open: "6:00 AM", close: "9:00 PM" },
  { day: "Saturday", open: "7:00 AM", close: "8:00 PM" },
  { day: "Sunday", open: "8:00 AM", close: "6:00 PM" },
];

// Default pricing tiers
const getDefaultPricing = (price: number) => [
  {
    name: "Basic",
    price: `₹${Math.round(price * 0.6).toLocaleString()}`,
    duration: "month",
    features: ["Access to facility", "Standard equipment", "Basic locker access", "Water fountain"],
    popular: false,
  },
  {
    name: "Premium",
    price: `₹${price.toLocaleString()}`,
    duration: "month",
    features: ["All Basic features", "Group classes", "Premium amenities", "Towel service", "1 session/month"],
    popular: true,
  },
  {
    name: "VIP",
    price: `₹${Math.round(price * 2).toLocaleString()}`,
    duration: "month",
    features: ["All Premium features", "Priority booking", "4 sessions/month", "Consultation", "Guest passes"],
    popular: false,
  },
];

// Default reviews
const defaultReviews = [
  {
    id: 1,
    user: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    date: "2 weeks ago",
    comment: "Absolutely love this place! The facilities are always clean and well-maintained. Highly recommend!",
    helpful: 24,
  },
  {
    id: 2,
    user: "Mike Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    date: "1 month ago",
    comment: "Great facility with excellent amenities. Can get crowded during peak hours but overall a fantastic experience.",
    helpful: 18,
  },
  {
    id: 3,
    user: "Emily Watson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    date: "1 month ago",
    comment: "The staff here is amazing! Very knowledgeable and the atmosphere is great.",
    helpful: 12,
  },
];

// Additional images based on type
const getAdditionalImages = (type: string, mainImage: string) => {
  const typeImages: Record<string, string[]> = {
    gym: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=800&h=600&fit=crop",
    ],
    coaching: [
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop",
    ],
    library: [
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1568667256549-094345857637?w=800&h=600&fit=crop",
    ],
  };
  return [mainImage, ...(typeImages[type] || typeImages.gym)];
};

const getTypeEmoji = (type: string) => {
  switch (type) {
    case "gym": return "🏋️";
    case "coaching": return "📚";
    case "library": return "📖";
    default: return "🏢";
  }
};

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);

  // Membership plans for the venue
  const membershipPlans = [
    {
      id: "monthly",
      name: "Monthly",
      duration: "1 Month",
      price: 2499,
      features: ["Full access", "Locker included", "Free parking"],
    },
    {
      id: "quarterly",
      name: "Quarterly",
      duration: "3 Months",
      price: 5999,
      originalPrice: 7497,
      popular: true,
      features: ["Full access", "Locker included", "Free parking", "1 PT session"],
    },
    {
      id: "annual",
      name: "Annual",
      duration: "12 Months",
      price: 19999,
      originalPrice: 29988,
      features: ["Full access", "Locker included", "Free parking", "4 PT sessions", "Diet consultation"],
    },
  ];

  // Find the venue by ID from combined data
  // First check if ID is a venue ID, then check if it's a business user ID
  const venue = useMemo(() => {
    // Direct venue ID match
    let foundVenue = allVenues.find((v) => v.id === id);
    
    // If not found, check if it's a business user ID
    if (!foundVenue && id) {
      const venueIds = businessUserVenueMap[id];
      if (venueIds && venueIds.length > 0) {
        // Get the first venue associated with this business user
        foundVenue = allVenues.find((v) => venueIds.includes(v.id));
      }
    }
    
    return foundVenue;
  }, [id]);

  if (!venue) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-4">
              Venue Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The venue you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/explore")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Derived data
  const images = getAdditionalImages(venue.type, venue.image);
  const pricing = getDefaultPricing(venue.price);
  const amenities = (venue.amenities || []).map((a: string) => ({
    id: a,
    name: a.charAt(0).toUpperCase() + a.slice(1),
    icon: amenityIcons[a] || Wifi,
  }));

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 lg:pt-20">
        {/* Hero Image Gallery */}
        <div className="relative h-[50vh] lg:h-[60vh] bg-muted">
          <img
            src={images[currentImage]}
            alt={venue.name}
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
            {images.slice(0, 5).map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImage ? "border-primary scale-110" : "border-transparent opacity-70"
                }`}
              >
                <img
                  src={img}
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

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Verified Badge */}
          {venue.verified && (
            <div className="absolute top-16 left-4">
              <Badge variant="default" className="gap-1 px-3 py-1.5 bg-success text-success-foreground">
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
                  <span className="text-2xl">{getTypeEmoji(venue.type)}</span>
                  <Badge variant="default" className="capitalize">{venue.type}</Badge>
                  <Badge 
                    variant={venue.status === "available" ? "default" : venue.status === "filling" ? "secondary" : "destructive"}
                    className={venue.status === "available" ? "bg-success text-success-foreground" : ""}
                  >
                    {venue.openNow ? "Open Now" : "Closed"}
                  </Badge>
                </div>
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {venue.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">{venue.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    <span className="font-semibold text-foreground">{venue.rating}</span>
                    <span className="text-muted-foreground">({venue.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {venue.location?.address}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Occupancy:</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (venue.occupancy / venue.capacity) > 0.8 ? "bg-destructive" :
                          (venue.occupancy / venue.capacity) > 0.5 ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${(venue.occupancy / venue.capacity) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{venue.occupancy}/{venue.capacity}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  {["overview", "pricing", "schedule", "reviews"].map((tab) => (
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
                    <p className="text-muted-foreground leading-relaxed">{venue.description}</p>
                  </div>

                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div>
                      <h3 className="font-display text-xl font-semibold mb-4">Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {amenities.map((amenity: any) => (
                          <div
                            key={amenity.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <amenity.icon className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium capitalize">{amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hours */}
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-4">Operating Hours</h3>
                    <div className="grid gap-2">
                      {defaultHours.map((hour) => (
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
                      {venue.location?.address}, {venue.location?.city}
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="mt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {pricing.map((plan) => (
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
                          variant={plan.popular ? "default" : "outline"}
                          className="w-full"
                          onClick={() => setIsBookingOpen(true)}
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
                      {defaultSchedule.map((slot) => {
                        const availability = slot.slots - slot.booked;
                        const isFull = availability === 0;
                        return (
                          <div
                            key={slot.time}
                            className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-lg font-semibold w-24">{slot.time}</div>
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
                              onClick={() => setIsBookingOpen(true)}
                            >
                              {isFull ? "Full" : "Book"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold">Customer Reviews</h3>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Write Review
                    </Button>
                  </div>

                  {/* Rating Summary */}
                  <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/50">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-foreground">{venue.rating}</div>
                      <div className="flex items-center gap-1 justify-center my-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(venue.rating)
                                ? "fill-warning text-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">{venue.reviews} reviews</div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {defaultReviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl border border-border">
                        <div className="flex items-start gap-4">
                          <img
                            src={review.avatar}
                            alt={review.user}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-foreground">{review.user}</h4>
                              <span className="text-sm text-muted-foreground">{review.date}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? "fill-warning text-warning"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-muted-foreground">{review.comment}</p>
                            <div className="mt-3">
                              <Button variant="ghost" size="sm" className="text-xs">
                                👍 Helpful ({review.helpful})
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Quick Actions */}
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-primary">{venue.priceLabel}</div>
                  </div>
                  <Button 
                    variant="default" 
                    className="w-full mb-3 bg-primary hover:bg-primary/90"
                    size="lg"
                    onClick={() => setIsBookingOpen(true)}
                  >
                    Book Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full mb-3"
                    onClick={() => setIsMembershipOpen(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy Membership
                  </Button>
                  <Button variant="ghost" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </div>

                {/* Contact Info */}
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <h3 className="font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{venue.location?.address}, {venue.location?.city}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>+91 98765 43210</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>info@{venue.name.toLowerCase().replace(/\s+/g, '')}.com</span>
                    </div>
                  </div>
                </div>

                {/* Live Occupancy */}
                <div className="p-6 rounded-2xl border border-border bg-card">
                  <h3 className="font-semibold mb-4">Live Occupancy</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-foreground mb-2">
                      {venue.occupancy}/{venue.capacity}
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (venue.occupancy / venue.capacity) > 0.8 ? "bg-destructive" :
                          (venue.occupancy / venue.capacity) > 0.5 ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${(venue.occupancy / venue.capacity) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {venue.capacity - venue.occupancy} spots available
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        venue={{
          id: venue.id,
          name: venue.name,
          type: venue.type,
          rating: venue.rating,
          price: venue.priceLabel,
          image: venue.image,
        }}
      />

      <MembershipPaymentModal
        open={isMembershipOpen}
        onOpenChange={setIsMembershipOpen}
        venueName={venue.name}
        venueImage={(venue as any).images?.[0]}
        plans={membershipPlans}
        onSuccess={(planId) => {
          console.log("Membership purchased:", planId);
        }}
      />

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border lg:hidden z-50">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setIsMembershipOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Join
          </Button>
          <Button 
            variant="default" 
            className="flex-1 bg-primary"
            onClick={() => setIsBookingOpen(true)}
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}
