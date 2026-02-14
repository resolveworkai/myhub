import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatformStore } from '@/store/platformStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import type { Batch, PricingTier, Subject, PassTemplate, DayOfWeek } from '@/types/platform';
import {
  Star, MapPin, Clock, Phone, Mail, Heart, Share2, Shield,
  ChevronLeft, ChevronRight, Users, Calendar, ArrowLeft,
  Loader2, Lock, AlertTriangle, ShoppingCart, Check, Info,
  XCircle,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { checkBatchConflict, type ConflictCheckResult, DAY_SHORT_MAP, minutesToTime } from '@/lib/conflictDetection';
import StudentClassBrowser from '@/components/business/StudentClassBrowser';

const DAY_SHORT: Record<DayOfWeek, string> = DAY_SHORT_MAP;

const SCHEDULE_DAYS: Record<string, DayOfWeek[]> = {
  mwf: ['mon', 'wed', 'fri'],
  tts: ['tue', 'thu', 'sat'],
  daily: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
};

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBusinessById, addToCart, cart, hasActivePass, studentPasses } = usePlatformStore();
  const { user, isAuthenticated } = useAuthStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [showConflict, setShowConflict] = useState(false);
  const [conflictMessages, setConflictMessages] = useState<string[]>([]);

  const business = useMemo(() => getBusinessById(id || ''), [id, getBusinessById]);

  // Build conflict map for all batches (Stage 1: browse-time indicators)
  const batchConflictMap = useMemo(() => {
    if (!business?.subjects) return new Map<string, ConflictCheckResult>();
    const map = new Map<string, ConflictCheckResult>();
    const activePasses = studentPasses.filter(p => p.status === 'active' || p.status === 'reserved');
    for (const subject of business.subjects) {
      for (const batch of subject.batches) {
        const result = checkBatchConflict(
          batch, subject.id, subject.name,
          business.id, business.name,
          cart, activePasses,
        );
        map.set(batch.id, result);
      }
    }
    return map;
  }, [business, cart, studentPasses]);

  // Check conflict for the currently selected batch in the dialog
  const selectedBatchConflict = useMemo(() => {
    if (!selectedBatch || !selectedSubject || !business) return null;
    const activePasses = studentPasses.filter(p => p.status === 'active' || p.status === 'reserved');
    return checkBatchConflict(
      selectedBatch, selectedSubject.id, selectedSubject.name,
      business.id, business.name,
      cart, activePasses,
    );
  }, [selectedBatch, selectedSubject, business, cart, studentPasses]);

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h1 className="font-display text-2xl font-bold mb-2">Business Not Found</h1>
            <Button onClick={() => navigate('/explore')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Explore
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = [business.image, ...business.galleryImages];
  const isCoaching = business.vertical === 'coaching';
  const isGymOrLibrary = business.vertical === 'gym' || business.vertical === 'library';
  const verticalEmoji = business.vertical === 'coaching' ? '📚' : business.vertical === 'gym' ? '💪' : '📖';

  const handleAddCoachingToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to book');
      navigate('/login');
      return;
    }
    if (!selectedBatch || !selectedSubject) return;

    // Pre-check conflict before attempting
    if (selectedBatchConflict?.hasConflict) {
      setConflictMessages(selectedBatchConflict.conflicts.map(c => c.message));
      setShowConflict(true);
      return;
    }

    const pricing = selectedBatch.customPricing || selectedSubject.pricingTiers;
    const tier = pricing.find(p => p.durationHours === selectedDuration);
    if (!tier) return;

    const days = SCHEDULE_DAYS[selectedBatch.schedulePattern] || [];

    const conflict = addToCart({
      businessId: business.id,
      businessName: business.name,
      businessVertical: 'coaching',
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      batchId: selectedBatch.id,
      batchName: selectedBatch.name,
      schedulePattern: selectedBatch.schedulePattern,
      scheduleDays: days,
      slotTime: `${selectedBatch.startTime}-${selectedBatch.endTime}`,
      instructorName: selectedBatch.instructorName,
      durationHours: selectedDuration,
      price: tier.price,
      startDate,
      autoRenew: false,
    });

    if (conflict) {
      const fullResult = (conflict as any)._conflictResult;
      if (fullResult?.conflicts?.length) {
        setConflictMessages(fullResult.conflicts.map((c: any) => c.message));
      } else {
        setConflictMessages([`Schedule conflict detected on ${conflict.conflictDays.map(d => DAY_SHORT[d]).join(', ')}`]);
      }
      setShowConflict(true);
    } else {
      // Show info messages if any
      if (selectedBatchConflict?.infoMessages?.length) {
        for (const msg of selectedBatchConflict.infoMessages) {
          toast.info(msg, { duration: 6000 });
        }
      }
      toast.success('Added to cart!', { description: `${selectedSubject.name} - ${selectedBatch.name}` });
      setSelectedBatch(null);
    }
  };

  const handleAddPassToCart = (template: PassTemplate) => {
    if (!isAuthenticated) {
      toast.error('Please log in to book');
      navigate('/login');
      return;
    }

    const conflict = addToCart({
      businessId: business.id,
      businessName: business.name,
      businessVertical: business.vertical,
      passTemplateId: template.id,
      timeSegmentName: template.timeSegmentName,
      price: template.price,
      startDate,
      autoRenew: false,
    });

    if (conflict) {
      setConflictMessages(['You already have an active pass or cart item for this business.']);
      setShowConflict(true);
    } else {
      toast.success('Added to cart!', { description: `${template.name} - ₹${template.price}` });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 lg:pt-20">
        {/* Hero Image */}
        <div className="relative h-[40vh] lg:h-[50vh] bg-muted">
          <img src={images[currentImage]} alt={business.name} className="w-full h-full object-cover" />
          {images.length > 1 && (
            <>
              <button onClick={() => setCurrentImage(p => (p - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={() => setCurrentImage(p => (p + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <button onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full bg-card/80 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" /> <span className="text-sm font-medium">Back</span>
          </button>
          {business.verified && (
            <Badge className="absolute top-4 right-4 gap-1 bg-success text-success-foreground">
              <Shield className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{verticalEmoji}</span>
                  <Badge variant="secondary" className="capitalize">{business.vertical}</Badge>
                  {business.closedToday ? (
                    <Badge variant="destructive">Closed Today</Badge>
                  ) : (
                    <Badge className="bg-success text-success-foreground">Open</Badge>
                  )}
                </div>
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">{business.name}</h1>
                <p className="text-lg text-muted-foreground mb-4">{business.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    <span className="font-semibold">{business.rating}</span>
                    <span className="text-muted-foreground">({business.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {business.address.street}, {business.address.area}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue={isCoaching ? 'classes' : 'passes'} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  {isCoaching && (
                    <TabsTrigger value="classes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                      📅 Classes
                    </TabsTrigger>
                  )}
                  {isCoaching && (
                    <TabsTrigger value="subjects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                      📚 Subjects
                    </TabsTrigger>
                  )}
                  {isGymOrLibrary && (
                    <TabsTrigger value="passes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                      🎫 Passes
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="hours" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                    🕐 Hours
                  </TabsTrigger>
                  <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
                    ℹ️ About
                  </TabsTrigger>
                </TabsList>

                {/* COACHING: New Class Scheduling System */}
                {isCoaching && (
                  <TabsContent value="classes" className="mt-6">
                    <StudentClassBrowser businessId={business.id} businessName={business.name} />
                  </TabsContent>
                )}

                {/* COACHING: Subjects & Batches */}
                {isCoaching && (
                  <TabsContent value="subjects" className="mt-6 space-y-6">
                    {business.subjects?.map(subject => (
                      <div key={subject.id} className="bg-card rounded-2xl border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-display text-xl font-semibold flex items-center gap-2">
                              {subject.icon} {subject.name}
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-4 w-4 fill-warning text-warning" />
                                {subject.rating}
                              </div>
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>
                          </div>
                        </div>
                        {/* Pricing */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {subject.pricingTiers.map(tier => (
                            <Badge key={tier.durationHours} variant="outline" className="text-sm">
                              {tier.durationHours}hr ₹{tier.price}
                            </Badge>
                          ))}
                        </div>
                        {/* Batches */}
                        <div className="space-y-3">
                          {subject.batches.map(batch => {
                            const isFull = batch.enrolled >= batch.capacity;
                            const days = SCHEDULE_DAYS[batch.schedulePattern] || batch.customDays || [];
                            const spotsLeft = batch.capacity - batch.enrolled;
                            const conflictResult = batchConflictMap.get(batch.id);
                            const hasConflict = conflictResult?.hasConflict ?? false;
                            const conflictMsg = conflictResult?.conflicts?.[0]?.message || '';

                            return (
                              <div key={batch.id} className={`p-4 rounded-xl border transition-all ${
                                hasConflict
                                  ? 'border-destructive bg-destructive/5 ring-1 ring-destructive/20'
                                  : isFull
                                    ? 'border-destructive/30 bg-destructive/5'
                                    : 'border-border hover:border-primary/30'
                              }`}>
                                {/* Conflict Badge */}
                                {hasConflict && (
                                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-destructive/10">
                                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                                    <span className="text-xs text-destructive font-medium">Schedule Conflict</span>
                                  </div>
                                )}

                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">{batch.name}</span>
                                      {hasConflict && (
                                        <Badge variant="destructive" className="text-xs">Conflict</Badge>
                                      )}
                                      {!hasConflict && spotsLeft <= 3 && spotsLeft > 0 && (
                                        <Badge variant="destructive" className="text-xs">
                                          {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} left!
                                        </Badge>
                                      )}
                                      {isFull && <Badge variant="destructive">FULL</Badge>}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {days.map(d => DAY_SHORT[d]).join('/')} {formatTime(batch.startTime)}-{formatTime(batch.endTime)}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5" />
                                        {batch.instructorName}
                                        {batch.instructorRating && (
                                          <span className="flex items-center gap-0.5">
                                            <Star className="h-3 w-3 fill-warning text-warning" /> {batch.instructorRating}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5" />
                                        {batch.enrolled}/{batch.capacity} enrolled
                                      </div>
                                    </div>

                                    {/* Conflict explanation */}
                                    {hasConflict && conflictMsg && (
                                      <p className="text-xs text-destructive mt-2 leading-relaxed">{conflictMsg}</p>
                                    )}

                                    {/* Info messages (back-to-back, different locations) */}
                                    {!hasConflict && conflictResult?.infoMessages?.map((msg, i) => (
                                      <p key={i} className="text-xs text-muted-foreground mt-2 leading-relaxed">{msg}</p>
                                    ))}
                                  </div>

                                  {/* Action buttons */}
                                  {!isFull && !hasConflict && (
                                    <div className="flex flex-col gap-2">
                                      {(batch.customPricing || subject.pricingTiers).map(tier => (
                                        <Button
                                          key={tier.durationHours}
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedSubject(subject);
                                            setSelectedBatch(batch);
                                            setSelectedDuration(tier.durationHours);
                                          }}
                                        >
                                          {tier.durationHours}hr ₹{tier.price}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                  {hasConflict && (
                                    <Button size="sm" variant="ghost" disabled className="text-destructive opacity-50">
                                      <XCircle className="h-3.5 w-3.5 mr-1" /> Blocked
                                    </Button>
                                  )}
                                  {isFull && !hasConflict && (
                                    <Button size="sm" variant="ghost" className="text-muted-foreground">
                                      Show Alternatives
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                )}

                {/* GYM/LIBRARY: Pass Templates */}
                {isGymOrLibrary && (
                  <TabsContent value="passes" className="mt-6 space-y-6">
                    {(['daily', 'weekly', 'monthly', 'quarterly'] as const).map(dur => {
                      const templates = business.passTemplates?.filter(pt => pt.duration === dur && pt.isActive) || [];
                      if (templates.length === 0) return null;
                      return (
                        <div key={dur} className="bg-card rounded-2xl border border-border p-6">
                          <h3 className="font-display text-lg font-semibold capitalize mb-4 flex items-center gap-2">
                            {dur === 'daily' && '📅'} {dur === 'weekly' && '📅'} {dur === 'monthly' && '📆'} {dur === 'quarterly' && '📆'}
                            {dur} Access
                          </h3>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map(template => {
                              const alreadyHas = user?.id ? hasActivePass(user.id, business.id) : false;
                              return (
                                <div key={template.id} className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all">
                                  <div className="font-semibold mb-1">{template.timeSegmentName}</div>
                                  <div className="text-sm text-muted-foreground mb-2">
                                    {template.validityDays} operating day{template.validityDays > 1 ? 's' : ''}
                                  </div>
                                  <div className="text-2xl font-bold text-primary mb-3">₹{template.price}</div>
                                  <Button
                                    className="w-full"
                                    size="sm"
                                    disabled={alreadyHas}
                                    onClick={() => handleAddPassToCart(template)}
                                  >
                                    {alreadyHas ? (
                                      <><Lock className="h-3.5 w-3.5 mr-1" /> Active Pass</>
                                    ) : (
                                      <><ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add to Cart</>
                                    )}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>
                )}

                {/* Hours */}
                <TabsContent value="hours" className="mt-6">
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-display text-lg font-semibold mb-4">Operating Hours</h3>
                    <div className="space-y-2">
                      {business.operatingDays.map(day => (
                        <div key={day.day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="font-medium capitalize">{day.day}</span>
                          {day.isOpen ? (
                            <span className="text-sm">{formatTime(day.openTime)} - {formatTime(day.closeTime)}</span>
                          ) : (
                            <Badge variant="secondary">Closed</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    {business.timeSegments.length > 0 && (
                      <>
                        <h4 className="font-semibold mt-6 mb-3">Time Segments</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {business.timeSegments.map(seg => (
                            <div key={seg.id} className="p-3 rounded-xl bg-muted/50">
                              <div className="font-medium">{seg.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* About */}
                <TabsContent value="about" className="mt-6">
                  <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold mb-3">About</h3>
                      <p className="text-muted-foreground">{business.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Contact</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {business.phone}</div>
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {business.email}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {business.address.street}, {business.address.area}, {business.address.city}</div>
                      </div>
                    </div>
                    {business.amenities.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {business.amenities.map(a => (
                            <Badge key={a} variant="outline" className="capitalize">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="bg-card rounded-2xl border border-primary/30 p-6">
                  <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Cart ({cart.length})
                  </h3>
                  <div className="space-y-2 mb-4">
                    {cart.slice(0, 3).map(item => (
                      <div key={item.id} className="text-sm p-2 rounded-lg bg-muted/50">
                        <div className="font-medium">{item.subjectName || item.timeSegmentName}</div>
                        <div className="text-muted-foreground">₹{item.price}</div>
                      </div>
                    ))}
                    {cart.length > 3 && (
                      <div className="text-sm text-muted-foreground">+{cart.length - 3} more</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between font-semibold mb-4">
                    <span>Total</span>
                    <span className="text-primary">₹{cart.reduce((s, i) => s + i.price, 0).toLocaleString()}</span>
                  </div>
                  <Button className="w-full" onClick={() => navigate('/cart')}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Go to Cart
                  </Button>
                </div>
              )}

              {/* Quick Info */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-display text-lg font-semibold">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {business.address.area}, {business.address.city}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {business.operatingDays.filter(d => d.isOpen).length} days/week
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    {business.rating} ({business.reviews} reviews)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Coaching: Add to Cart Dialog */}
      <Dialog open={!!selectedBatch} onOpenChange={(open) => { if (!open) setSelectedBatch(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
          </DialogHeader>
          {selectedBatch && selectedSubject && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="font-semibold">{selectedSubject.name} - {selectedBatch.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {SCHEDULE_DAYS[selectedBatch.schedulePattern]?.map(d => DAY_SHORT[d]).join('/')} {formatTime(selectedBatch.startTime)}-{formatTime(selectedBatch.endTime)}
                </div>
                <div className="text-sm text-muted-foreground">Instructor: {selectedBatch.instructorName}</div>
              </div>

              {/* Conflict warning in dialog */}
              {selectedBatchConflict?.hasConflict && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-destructive space-y-1">
                      {selectedBatchConflict.conflicts.map((c, i) => (
                        <p key={i}>{c.message}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Compatibility message */}
              {selectedBatchConflict && !selectedBatchConflict.hasConflict && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-xs text-success font-medium">✓ This batch is compatible with your current schedule</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium block mb-2">Duration</label>
                <Select value={selectedDuration.toString()} onValueChange={v => setSelectedDuration(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(selectedBatch.customPricing || selectedSubject.pricingTiers).map(t => (
                      <SelectItem key={t.durationHours} value={t.durationHours.toString()}>
                        {t.durationHours} hour{t.durationHours > 1 ? 's' : ''} - ₹{t.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  max={format(addDays(new Date(), 60), 'yyyy-MM-dd')}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valid for 30 consecutive operating days from start date
                </p>
              </div>

              <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-info mt-0.5" />
                  <div className="text-xs text-info">
                    Slots are reserved for your batch schedule for the entire validity period. No cancellations allowed.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-semibold">
                  ₹{(selectedBatch.customPricing || selectedSubject.pricingTiers).find(t => t.durationHours === selectedDuration)?.price || 0}
                </span>
                <Button
                  onClick={handleAddCoachingToCart}
                  disabled={selectedBatchConflict?.hasConflict}
                >
                  {selectedBatchConflict?.hasConflict ? (
                    <><XCircle className="h-4 w-4 mr-2" /> Cannot Add</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog */}
      <Dialog open={showConflict} onOpenChange={setShowConflict}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Schedule Conflict
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {conflictMessages.map((msg, i) => (
              <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-sm text-foreground leading-relaxed">{msg}</p>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setShowConflict(false)}>OK, I understand</Button>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
