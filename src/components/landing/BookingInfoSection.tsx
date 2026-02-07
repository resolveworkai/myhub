import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CreditCard,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Shield,
} from 'lucide-react';

export function BookingInfoSection() {
  const passTypes = [
    {
      emoji: '🆓',
      name: 'Free Daily Booking',
      description: '1 booking per day, Morning/Evening shift',
      price: 'FREE',
      features: ['1-4 hour sessions', 'Morning or Evening', 'No payment required'],
    },
    {
      emoji: '📅',
      name: 'Weekly Pass',
      description: '7 days of access',
      price: 'From ₹1,499',
      badge: 'POPULAR',
      features: ['1 session per day', 'Choose your shift', 'Lock in your duration'],
    },
    {
      emoji: '🗓️',
      name: 'Monthly Pass',
      description: '30 days of access',
      price: 'From ₹4,999',
      badge: 'BEST VALUE',
      features: ['1 session per day', 'Full day option', 'Maximum savings'],
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            How Booking Works
          </Badge>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Simple, Flexible Access
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a free booking or unlock unlimited access with our pass options
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {passTypes.map((pass) => (
            <div
              key={pass.name}
              className="relative bg-card rounded-2xl border-2 border-border p-6 hover:border-primary/50 transition-all"
            >
              {pass.badge && (
                <Badge 
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                    pass.badge === 'BEST VALUE' 
                      ? 'bg-gradient-to-r from-warning to-primary' 
                      : 'bg-primary'
                  }`}
                >
                  {pass.badge}
                </Badge>
              )}
              <div className="text-4xl mb-4">{pass.emoji}</div>
              <h3 className="font-semibold text-lg mb-1">{pass.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{pass.description}</p>
              <div className="text-2xl font-bold text-primary mb-4">{pass.price}</div>
              <ul className="space-y-2">
                {pass.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg" variant="gradient">
            <Link to="/explore">
              Start Booking Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            Secure Payments via Paytm
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Passes activate on first booking
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-info" />
            Modify bookings up to 1hr before
          </div>
        </div>
      </div>
    </section>
  );
}
