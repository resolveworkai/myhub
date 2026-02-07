import { useMemo } from 'react';
import { format, parseISO, isToday, isFuture, isPast, addMinutes } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Edit,
  AlertTriangle,
} from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import type { Booking } from '@/types/booking';

interface UserBookingsCardProps {
  showAllLink?: boolean;
  limit?: number;
  filter?: 'upcoming' | 'past' | 'all';
}

export function UserBookingsCard({ 
  showAllLink = true, 
  limit = 5,
  filter = 'upcoming'
}: UserBookingsCardProps) {
  const { user } = useAuthStore();
  const { getUserBookings, canModifyBooking } = useBookingStore();

  const bookings = useMemo(() => {
    if (!user) return [];
    const allBookings = getUserBookings(user.id);
    const now = new Date();
    
    let filtered = allBookings;
    if (filter === 'upcoming') {
      filtered = allBookings.filter(b => {
        const bookingDate = parseISO(`${b.date}T${b.startTime}`);
        return (isFuture(bookingDate) || isToday(bookingDate)) && b.status === 'confirmed';
      });
    } else if (filter === 'past') {
      filtered = allBookings.filter(b => {
        const bookingDate = parseISO(`${b.date}T${b.endTime}`);
        return isPast(bookingDate) || b.status === 'completed';
      });
    }
    
    // Sort by date (upcoming first for upcoming, newest first for past)
    return filtered
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`);
        const dateB = new Date(`${b.date}T${b.startTime}`);
        return filter === 'past' 
          ? dateB.getTime() - dateA.getTime()
          : dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);
  }, [user, getUserBookings, filter, limit]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {filter === 'upcoming' ? 'Upcoming Bookings' : 'Booking History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Please log in to view your bookings.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {filter === 'upcoming' ? 'Upcoming Bookings' : 'Booking History'}
          </CardTitle>
          <CardDescription>
            {filter === 'upcoming' 
              ? 'No upcoming bookings'
              : 'No past bookings'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              {filter === 'upcoming'
                ? 'Book a session to get started!'
                : 'Your booking history will appear here'
              }
            </p>
            {filter === 'upcoming' && (
              <Button asChild variant="gradient">
                <Link to="/explore">Book Now</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {filter === 'upcoming' ? 'Upcoming Bookings' : 'Booking History'}
          </CardTitle>
          <CardDescription>
            {bookings.length} {filter === 'upcoming' ? 'upcoming' : 'past'} booking(s)
          </CardDescription>
        </div>
        {showAllLink && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/appointments">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {bookings.map((booking) => (
          <BookingCard 
            key={booking.id} 
            booking={booking} 
            canModify={canModifyBooking(booking.id).canModify}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function BookingCard({ booking, canModify }: { booking: Booking; canModify: boolean }) {
  const bookingDate = parseISO(booking.date);
  const isTodayBooking = isToday(bookingDate);
  const isPastBooking = isPast(parseISO(`${booking.date}T${booking.endTime}`));

  const statusIcon = {
    confirmed: <CheckCircle2 className="h-4 w-4 text-success" />,
    completed: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
    cancelled: <XCircle className="h-4 w-4 text-destructive" />,
    'no-show': <XCircle className="h-4 w-4 text-warning" />,
  };

  const statusColors = {
    confirmed: 'success',
    completed: 'secondary',
    cancelled: 'destructive',
    'no-show': 'warning',
  } as const;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isTodayBooking && booking.status === 'confirmed'
          ? 'border-primary bg-primary/5'
          : isPastBooking
          ? 'border-muted bg-muted/30'
          : 'border-border hover:border-primary/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold truncate">{booking.businessName}</span>
            <Badge variant={statusColors[booking.status]} className="text-xs shrink-0">
              {booking.status}
            </Badge>
            {booking.isFreeBooking && (
              <Badge variant="outline" className="text-xs shrink-0">
                Free
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isTodayBooking ? 'Today' : format(bookingDate, 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {booking.startTime} - {booking.endTime}
            </span>
            <span className="capitalize text-xs px-2 py-0.5 bg-muted rounded">
              {booking.shift}
            </span>
          </div>
        </div>

        {canModify && !isPastBooking && (
          <Button variant="ghost" size="sm" className="shrink-0">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Today's booking highlight */}
      {isTodayBooking && booking.status === 'confirmed' && (
        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-primary/10 text-primary text-xs">
          <AlertTriangle className="h-4 w-4" />
          <span>Your session is today!</span>
        </div>
      )}
    </div>
  );
}
