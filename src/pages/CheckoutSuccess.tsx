import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlatformStore } from '@/store/platformStore';
import { useAuthStore } from '@/store/authStore';
import type { DayOfWeek } from '@/types/platform';
import {
  Check, Calendar, MapPin, Users, Download, Clock,
  ArrowRight, PartyPopper,
} from 'lucide-react';

const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${(m || 0).toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const txnId = searchParams.get('txn');
  const { getTransactions, getActivePasses } = usePlatformStore();
  const { user } = useAuthStore();

  const transaction = getTransactions(user?.id).find(t => t.id === txnId);
  const activePasses = user ? getActivePasses(user.id) : [];

  // Get newly created passes (match by transaction ID)
  const newPasses = activePasses.filter(p => p.transactionId === txnId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto px-4 lg:px-8 py-12 max-w-2xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="h-10 w-10 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">
              🎉 You're all set{user && 'name' in user ? `, ${user.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-muted-foreground">Your booking has been confirmed.</p>
            {transaction && (
              <Badge variant="outline" className="mt-2">
                Transaction: {transaction.orderId}
              </Badge>
            )}
          </div>

          {/* Passes */}
          <div className="space-y-4 mb-8">
            {newPasses.map((pass, idx) => (
              <div key={pass.id} className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="capitalize">{pass.businessVertical}</Badge>
                  <Badge className="bg-success text-success-foreground gap-1">
                    <Check className="h-3 w-3" /> Active
                  </Badge>
                </div>

                <h3 className="font-display text-lg font-semibold">
                  {pass.subjectName ? `${pass.subjectName} Classes` : `${pass.timeSegmentName} Access`}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {pass.businessName}
                </p>

                <div className="space-y-2 text-sm">
                  {pass.scheduleDays && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {pass.scheduleDays.map(d => DAY_SHORT[d]).join('/')}
                      {pass.slotStartTime && ` • ${formatTime(pass.slotStartTime)}-${formatTime(pass.slotEndTime || '')}`}
                    </div>
                  )}
                  {pass.instructorName && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Instructor: {pass.instructorName}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Valid: {pass.startDate} → {pass.endDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {pass.businessName}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold mb-3">💡 What to Bring</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Notebook & pen (for coaching)</li>
              <li>• Water bottle</li>
              <li>• Arrive 5 minutes early</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" onClick={() => navigate('/dashboard')}>
              View My Passes <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/explore')}>
              Browse More Classes
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
