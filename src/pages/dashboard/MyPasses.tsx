import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { usePlatformStore } from '@/store/platformStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { format, parseISO, differenceInDays } from 'date-fns';
import type { StudentPass, DayOfWeek, Batch } from '@/types/platform';
import {
  CreditCard, Calendar, Clock, Users, Star, ChevronRight,
  AlertTriangle, Repeat, ArrowLeftRight, MapPin, Sparkles,
  CheckCircle2, XCircle,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const formatTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${(m || 0).toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function MyPasses() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getUserPasses, toggleAutoRenew, switchBatch, getBusinessById } = usePlatformStore();
  const [switchPassId, setSwitchPassId] = useState<string | null>(null);
  const [selectedNewBatch, setSelectedNewBatch] = useState<Batch | null>(null);
  const [schedulePassId, setSchedulePassId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  const passes = useMemo(() => {
    if (!user) return [];
    let all = getUserPasses(user.id);
    if (filter === 'active') all = all.filter(p => p.status === 'active' || p.status === 'reserved');
    if (filter === 'expired') all = all.filter(p => p.status === 'expired' || p.status === 'cancelled');
    return all.sort((a, b) => {
      const order = { active: 0, reserved: 1, paused: 2, expired: 3, cancelled: 4 };
      return (order[a.status] || 5) - (order[b.status] || 5);
    });
  }, [user, getUserPasses, filter]);

  const switchPass = passes.find(p => p.id === switchPassId);
  const switchBusiness = switchPass ? getBusinessById(switchPass.businessId) : null;
  const availableBatches = useMemo(() => {
    if (!switchPass || !switchBusiness?.subjects) return [];
    const subject = switchBusiness.subjects.find(s => s.id === switchPass.subjectId);
    if (!subject) return [];
    return subject.batches.filter(b => b.id !== switchPass.batchId && b.enrolled < b.capacity && !b.isPaused);
  }, [switchPass, switchBusiness]);

  const schedulePass = passes.find(p => p.id === schedulePassId);

  const handleSwitch = () => {
    if (!switchPassId || !selectedNewBatch) return;
    const success = switchBatch(
      switchPassId,
      selectedNewBatch.id,
      selectedNewBatch.name,
      selectedNewBatch.startTime,
      selectedNewBatch.endTime,
      selectedNewBatch.instructorName
    );
    if (success) {
      toast.success('Batch switched successfully!');
      setSwitchPassId(null);
      setSelectedNewBatch(null);
    } else {
      toast.error('Cannot switch batch', { description: 'Must be 7+ days before start date.' });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Please log in</h2>
        <Button onClick={() => navigate('/login')}>Log In</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">My Passes</h1>
          <p className="text-sm text-muted-foreground">{passes.length} pass(es)</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'expired'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {passes.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No passes yet</h2>
          <p className="text-muted-foreground mb-4">Browse venues and get your first pass!</p>
          <Button onClick={() => navigate('/explore')}>Browse Venues</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {passes.map(pass => {
            const isActive = pass.status === 'active' || pass.status === 'reserved';
            const isExpired = pass.status === 'expired' || pass.status === 'cancelled';
            const daysLeft = differenceInDays(parseISO(pass.endDate), new Date());
            const isExpiringSoon = isActive && daysLeft <= 3 && daysLeft > 0;
            const progress = (pass.completedDays / pass.totalOperatingDays) * 100;
            const canSwitch = isActive && !pass.switchUsed && pass.batchId && differenceInDays(parseISO(pass.startDate), new Date()) >= 7;

            return (
              <div key={pass.id} className={`bg-card rounded-2xl border-2 p-6 transition-all ${
                isExpired ? 'border-muted' : isExpiringSoon ? 'border-warning' : 'border-success/30'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{pass.businessVertical === 'coaching' ? '📚' : pass.businessVertical === 'gym' ? '💪' : '📖'}</span>
                      <span className="font-display font-semibold text-lg truncate">
                        {pass.subjectName ? `${pass.subjectName} Classes` : `${pass.timeSegmentName} Access`}
                      </span>
                      <Badge variant={isExpired ? 'outline' : 'success'} className="text-xs shrink-0 capitalize">
                        {pass.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <MapPin className="inline h-3.5 w-3.5 mr-1" />
                      {pass.businessName}
                    </p>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {pass.scheduleDays && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {pass.scheduleDays.map(d => DAY_SHORT[d]).join('/')}
                        </span>
                      )}
                      {pass.slotStartTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(pass.slotStartTime)}-{formatTime(pass.slotEndTime || '')}
                        </span>
                      )}
                      {pass.instructorName && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {pass.instructorName}
                        </span>
                      )}
                      {pass.timeSegmentName && !pass.subjectName && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {pass.timeSegmentName} ({formatTime(pass.timeSegmentStart || '')}-{formatTime(pass.timeSegmentEnd || '')})
                        </span>
                      )}
                    </div>
                  </div>

                  {isActive && (
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-bold ${daysLeft <= 3 ? 'text-warning' : 'text-success'}`}>{Math.max(0, daysLeft)}</div>
                      <div className="text-xs text-muted-foreground">days left</div>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{pass.completedDays} of {pass.totalOperatingDays} days completed</span>
                    <span>{pass.startDate} → {pass.endDate}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Warnings */}
                {isExpiringSoon && (
                  <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-warning/10 text-warning text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    Expires on {format(parseISO(pass.endDate), 'MMM d, yyyy')} — {pass.autoRenew ? 'Auto-renewal enabled' : 'Enable auto-renewal to keep your slot'}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border">
                  {isActive && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={pass.autoRenew}
                        onCheckedChange={() => {
                          toggleAutoRenew(pass.id);
                          toast.success(pass.autoRenew ? 'Auto-renewal disabled' : 'Auto-renewal enabled');
                        }}
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Repeat className="h-3.5 w-3.5" /> Auto-renew
                      </span>
                    </div>
                  )}

                  {canSwitch && (
                    <Button size="sm" variant="outline" onClick={() => setSwitchPassId(pass.id)}>
                      <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> Switch Batch
                    </Button>
                  )}

                  {pass.scheduleDays && (
                    <Button size="sm" variant="ghost" onClick={() => setSchedulePassId(pass.id)}>
                      <Calendar className="h-3.5 w-3.5 mr-1" /> View Schedule
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Switch Batch Dialog */}
      <Dialog open={!!switchPassId} onOpenChange={open => !open && setSwitchPassId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to a Different Batch</DialogTitle>
          </DialogHeader>
          {switchPass && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="font-medium">Current: {switchPass.batchName}</p>
                <p className="text-muted-foreground">
                  {switchPass.scheduleDays?.map(d => DAY_SHORT[d]).join('/')} {formatTime(switchPass.slotStartTime || '')}-{formatTime(switchPass.slotEndTime || '')}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Available alternatives:</p>
                {availableBatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alternative batches available.</p>
                ) : (
                  availableBatches.map(batch => {
                    const days = batch.schedulePattern === 'mwf' ? ['mon', 'wed', 'fri'] : batch.schedulePattern === 'tts' ? ['tue', 'thu', 'sat'] : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                    return (
                      <button
                        key={batch.id}
                        onClick={() => setSelectedNewBatch(batch)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${selectedNewBatch?.id === batch.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                      >
                        <div className="font-medium">{batch.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {days.map(d => DAY_SHORT[d as DayOfWeek]).join('/')} {formatTime(batch.startTime)}-{formatTime(batch.endTime)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {batch.instructorName} • {batch.enrolled}/{batch.capacity} enrolled
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-3 rounded-lg bg-warning/10 text-warning text-xs">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                This is a ONE-TIME switch. No further changes allowed after switching.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchPassId(null)}>Cancel</Button>
            <Button onClick={handleSwitch} disabled={!selectedNewBatch}>Confirm Switch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={!!schedulePassId} onOpenChange={open => !open && setSchedulePassId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{schedulePass?.subjectName} - Full Schedule</DialogTitle>
          </DialogHeader>
          {schedulePass && (
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {generateScheduleDates(schedulePass).map((entry, i) => {
                const isPast = new Date(entry.date) < new Date();
                return (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${isPast ? 'bg-muted/50' : ''}`}>
                    {isPast ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Calendar className="h-4 w-4 text-primary shrink-0" />}
                    <span className="text-sm flex-1">{format(parseISO(entry.date), 'EEE, MMM d')}</span>
                    <span className="text-sm text-muted-foreground">{formatTime(schedulePass.slotStartTime || '')}</span>
                    <Badge variant={isPast ? 'outline' : 'secondary'} className="text-xs">
                      {isPast ? 'Done' : 'Upcoming'}
                    </Badge>
                  </div>
                );
              })}
              <p className="text-sm text-muted-foreground mt-2">
                Total: {schedulePass.totalOperatingDays} classes ({schedulePass.completedDays} completed)
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function generateScheduleDates(pass: StudentPass): { date: string }[] {
  if (!pass.scheduleDays) return [];
  const dayIndexMap: Record<DayOfWeek, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const indexDayMap: Record<number, DayOfWeek> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
  const dates: { date: string }[] = [];
  let current = parseISO(pass.startDate);
  const end = parseISO(pass.endDate);
  while (current <= end && dates.length < 100) {
    const dayName = indexDayMap[current.getDay()];
    if (pass.scheduleDays.includes(dayName)) {
      dates.push({ date: format(current, 'yyyy-MM-dd') });
    }
    current = new Date(current.getTime() + 86400000);
  }
  return dates;
}
