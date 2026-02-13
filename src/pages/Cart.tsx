import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { usePlatformStore } from '@/store/platformStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import type { DayOfWeek } from '@/types/platform';
import { validateCart } from '@/lib/conflictDetection';
import {
  ShoppingCart, Trash2, Calendar, Clock, Users,
  CreditCard, Timer, AlertTriangle, Check, XCircle, Info,
} from 'lucide-react';

const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
};

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cart, removeFromCart, clearCart, updateCartItemStartDate,
    updateCartItemAutoRenew, getCartTotal, getRemainingReservationTime,
    checkout, getBusinessById, studentPasses,
  } = usePlatformStore();
  const { user, isAuthenticated } = useAuthStore();
  const [remainingTime, setRemainingTime] = useState(getRemainingReservationTime());
  const [isProcessing, setIsProcessing] = useState(false);

  // Stage 3: Validate entire cart
  const cartValidation = useMemo(() => {
    const activePasses = studentPasses.filter(p => p.status === 'active' || p.status === 'reserved');
    return validateCart(cart, activePasses);
  }, [cart, studentPasses]);

  useEffect(() => {
    const interval = setInterval(() => {
      const time = getRemainingReservationTime();
      setRemainingTime(time);
      if (time <= 0 && cart.length > 0) {
        clearCart();
        toast.error('Reservation expired', { description: 'Your cart has been cleared.' });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cart.length]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Weekly schedule preview for coaching items
  const schedulePreview = () => {
    const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const coachingItems = cart.filter(i => i.businessVertical === 'coaching' && i.scheduleDays);
    if (coachingItems.length === 0) return null;

    return (
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <h3 className="font-display text-lg font-semibold mb-4">📅 Weekly Schedule Preview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 text-muted-foreground">Time</th>
                {days.map(d => (
                  <th key={d} className="text-center py-2 px-2 text-muted-foreground">{DAY_SHORT[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coachingItems.map(item => {
                const isConflicting = cartValidation.conflictingItemIds.has(item.id);
                return (
                  <tr key={item.id} className={`border-t border-border ${isConflicting ? 'bg-destructive/5' : ''}`}>
                    <td className="py-2 px-2 font-medium whitespace-nowrap">
                      {item.slotTime?.split('-').map(formatTime).join('-')}
                      {isConflicting && <XCircle className="h-3 w-3 text-destructive inline ml-1" />}
                    </td>
                    {days.map(d => (
                      <td key={d} className="py-2 px-2 text-center">
                        {item.scheduleDays?.includes(d) ? (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            isConflicting ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                          }`}>
                            {item.subjectName?.substring(0, 4)}
                          </span>
                        ) : '--'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleCheckout = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please log in');
      navigate('/login');
      return;
    }

    // Final conflict check
    if (cartValidation.hasConflicts) {
      toast.error('Cannot proceed — resolve schedule conflicts first');
      return;
    }

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));

    const userName = user && 'name' in user ? user.name : (user as any).businessName || '';
    const userEmail = user.email;
    const userPhone = user.phone;
    const transaction = checkout(user.id, userName, userEmail, userPhone);
    if (transaction) {
      toast.success('🎉 Payment Successful!');
      navigate(`/checkout/success?txn=${transaction.id}`);
    } else {
      toast.error('Payment failed');
    }
    setIsProcessing(false);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-6">Browse businesses and add classes or passes to get started.</p>
            <Button onClick={() => navigate('/explore')}>Browse Classes</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-32">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold">Your Cart ({cart.length})</h1>
              <p className="text-muted-foreground">Review your selections before payment</p>
            </div>
            {remainingTime > 0 && (
              <Badge variant={remainingTime < 120 ? 'destructive' : 'secondary'} className="text-sm gap-1">
                <Timer className="h-4 w-4" />
                {formatTimer(remainingTime)} remaining
              </Badge>
            )}
          </div>

          {/* Conflict Banner (Stage 3) */}
          {cartValidation.hasConflicts ? (
            <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive mb-2">
                    ⚠️ Your cart contains conflicting schedules
                  </h3>
                  <p className="text-sm text-destructive/80 mb-3">
                    Please remove conflicting items before proceeding to checkout.
                  </p>
                  <div className="space-y-2">
                    {cartValidation.cartPairConflicts.map((pair, i) => (
                      <div key={i} className="text-sm text-destructive bg-destructive/5 p-2 rounded-lg">
                        <strong>{pair.itemA.subjectName}</strong> conflicts with <strong>{pair.itemB.subjectName}</strong>
                        {pair.detail.overlapDays.length > 0 && (
                          <span> on {pair.detail.overlapDays.map(d => DAY_SHORT[d]).join(', ')}</span>
                        )}
                        {pair.detail.overlapTimeRange && <span> ({pair.detail.overlapTimeRange})</span>}
                      </div>
                    ))}
                    {cartValidation.enrollmentConflicts.map((ec, i) => (
                      <div key={`e-${i}`} className="text-sm text-destructive bg-destructive/5 p-2 rounded-lg">
                        <strong>{ec.cartItem.subjectName || ec.cartItem.timeSegmentName}</strong> conflicts with active enrollment: {ec.detail.conflictingItem.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-success/10 border border-success/30">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-success" />
                <span className="font-medium text-success">✓ All schedules are compatible. You can proceed to checkout.</span>
              </div>
            </div>
          )}

          {/* Info Messages */}
          {cartValidation.infoMessages.length > 0 && (
            <div className="mb-6 space-y-2">
              {cartValidation.infoMessages.map((msg, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Schedule Preview */}
          {schedulePreview()}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const isConflicting = cartValidation.conflictingItemIds.has(item.id);
                return (
                  <div key={item.id} className={`bg-card rounded-2xl border p-6 ${
                    isConflicting
                      ? 'border-destructive ring-1 ring-destructive/20 bg-destructive/5'
                      : 'border-border'
                  }`}>
                    {isConflicting && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/10">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="text-xs text-destructive font-medium">
                          Schedule Conflict — remove this item or the conflicting item to proceed
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <Badge variant="secondary" className="capitalize mb-2">{item.businessVertical}</Badge>
                        <h3 className="font-semibold text-lg">
                          {item.subjectName ? `${item.subjectName} - ${item.batchName}` : `${item.timeSegmentName} Pass`}
                        </h3>
                        <p className="text-sm text-muted-foreground">{item.businessName}</p>

                        {item.scheduleDays && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {item.scheduleDays.map(d => DAY_SHORT[d]).join('/')}
                            {item.slotTime && ` • ${item.slotTime.split('-').map(formatTime).join(' - ')}`}
                          </div>
                        )}
                        {item.instructorName && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" /> {item.instructorName}
                          </div>
                        )}
                        {item.timeSegmentName && !item.subjectName && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> {item.timeSegmentName} access
                          </div>
                        )}

                        {/* Start Date */}
                        <div className="mt-3">
                          <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                          <input
                            type="date"
                            value={item.startDate}
                            min={format(addDays(new Date(), 0), 'yyyy-MM-dd')}
                            max={format(addDays(new Date(), 60), 'yyyy-MM-dd')}
                            onChange={e => updateCartItemStartDate(item.id, e.target.value)}
                            className="block mt-1 px-3 py-1.5 rounded-lg border border-input bg-background text-sm"
                          />
                        </div>

                        {/* Auto-Renew */}
                        <div className="flex items-center gap-2 mt-3">
                          <Switch
                            checked={item.autoRenew}
                            onCheckedChange={v => updateCartItemAutoRenew(item.id, v)}
                          />
                          <span className="text-sm">Auto-renew monthly</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">₹{item.price}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                <h3 className="font-display text-lg font-semibold mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className={`truncate mr-2 ${
                        cartValidation.conflictingItemIds.has(item.id) ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {cartValidation.conflictingItemIds.has(item.id) && '⚠️ '}
                        {item.subjectName || item.timeSegmentName}
                      </span>
                      <span className="font-medium">₹{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 mb-6">
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{getCartTotal().toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessing || cartValidation.hasConflicts}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : cartValidation.hasConflicts ? (
                    <><AlertTriangle className="h-4 w-4 mr-2" /> Resolve Conflicts First</>
                  ) : (
                    <><CreditCard className="h-4 w-4 mr-2" /> Pay ₹{getCartTotal().toLocaleString()} with Paytm</>
                  )}
                </Button>

                {cartValidation.hasConflicts && (
                  <p className="text-xs text-destructive text-center mt-3">
                    Remove conflicting items to enable checkout
                  </p>
                )}
                {!cartValidation.hasConflicts && remainingTime > 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Your slots are reserved for {formatTimer(remainingTime)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
