import { useMemo } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Calendar,
  Clock,
  Sunrise,
  Sunset,
  Sun,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import type { UserPass, ShiftType } from '@/types/booking';

const shiftIcons: Record<ShiftType, React.ReactNode> = {
  morning: <Sunrise className="h-4 w-4" />,
  evening: <Sunset className="h-4 w-4" />,
  fullday: <Sun className="h-4 w-4" />,
};

const shiftLabels: Record<ShiftType, string> = {
  morning: 'Morning',
  evening: 'Evening',
  fullday: 'Full Day',
};

interface UserPassesCardProps {
  showAllLink?: boolean;
  limit?: number;
}

export function UserPassesCard({ showAllLink = true, limit = 3 }: UserPassesCardProps) {
  const { user } = useAuthStore();
  const { getUserPasses, getUserBookings } = useBookingStore();

  const passes = useMemo(() => {
    if (!user) return [];
    const allPasses = getUserPasses(user.id);
    // Sort by status (active first) then by expiry
    return allPasses
      .sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        if (a.expiresAt && b.expiresAt) {
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        }
        return 0;
      })
      .slice(0, limit);
  }, [user, getUserPasses, limit]);

  const bookings = useMemo(() => {
    if (!user) return [];
    return getUserBookings(user.id);
  }, [user, getUserBookings]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            My Passes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Please log in to view your passes.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (passes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            My Passes
          </CardTitle>
          <CardDescription>You don't have any passes yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get unlimited access to your favorite venues with a pass
            </p>
            <Button asChild variant="gradient">
              <Link to="/explore">Browse Venues</Link>
            </Button>
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
            <CreditCard className="h-5 w-5 text-primary" />
            My Passes
          </CardTitle>
          <CardDescription>{passes.length} active pass(es)</CardDescription>
        </div>
        {showAllLink && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/passes">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {passes.map((pass) => (
          <PassCard key={pass.id} pass={pass} />
        ))}
      </CardContent>
    </Card>
  );
}

function PassCard({ pass }: { pass: UserPass }) {
  const daysRemaining = pass.expiresAt
    ? differenceInDays(parseISO(pass.expiresAt), new Date())
    : pass.totalDays;

  const usagePercent = (pass.usedDays / pass.totalDays) * 100;
  const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;
  const isExpired = pass.status === 'expired' || (pass.expiresAt && daysRemaining <= 0);
  const isInactive = pass.status === 'inactive';

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        isExpired
          ? 'border-muted bg-muted/30'
          : isExpiringSoon
          ? 'border-warning bg-warning/5'
          : isInactive
          ? 'border-dashed border-primary/50 bg-primary/5'
          : 'border-success/30 bg-success/5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold truncate">{pass.businessName}</span>
            <Badge
              variant={isExpired ? 'outline' : isInactive ? 'secondary' : 'success'}
              className="text-xs shrink-0"
            >
              {isExpired ? 'Expired' : isInactive ? 'Inactive' : 'Active'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="capitalize font-medium">
              {pass.passType} Pass
            </span>
            <span className="flex items-center gap-1">
              {shiftIcons[pass.shift]}
              {shiftLabels[pass.shift]}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pass.sessionDuration / 60}hr
            </span>
          </div>
        </div>

        {!isExpired && !isInactive && (
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-success">{daysRemaining}</div>
            <div className="text-xs text-muted-foreground">days left</div>
          </div>
        )}
      </div>

      {/* Usage Progress */}
      {!isInactive && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Used: {pass.usedDays} of {pass.totalDays} days</span>
            {pass.daysExtended > 0 && (
              <span className="text-success">+{pass.daysExtended} extended</span>
            )}
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>
      )}

      {/* Warnings */}
      {isExpiringSoon && !isExpired && (
        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-warning/10 text-warning text-xs">
          <AlertTriangle className="h-4 w-4" />
          <span>Expires on {format(parseISO(pass.expiresAt!), 'MMM d, yyyy')}</span>
        </div>
      )}

      {isInactive && (
        <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-info/10 text-info text-xs">
          <Calendar className="h-4 w-4" />
          <span>Activates when you make your first booking</span>
        </div>
      )}

      {/* Validity info */}
      {pass.expiresAt && !isExpired && !isInactive && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Valid until {format(parseISO(pass.expiresAt), 'MMM d, yyyy')}</span>
        </div>
      )}
    </div>
  );
}
