import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePlatformStore } from "@/store/platformStore";
import { useAuthStore } from "@/store/authStore";
import { differenceInDays, parseISO, format } from "date-fns";
import {
  Calendar, CreditCard, ChevronRight, Flame, Clock,
  MapPin, TrendingUp, ExternalLink, HelpCircle, Wallet, Sparkles,
  AlertTriangle, Users,
} from "lucide-react";
import { PaymentMethodsModal } from "@/components/payments/PaymentMethodsModal";
import { SupportModal } from "@/components/support/SupportModal";
import type { DayOfWeek } from "@/types/platform";

const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};
const formatTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${(m || 0).toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

interface DashboardHomeProps {
  userName: string;
}

export default function DashboardHome({ userName }: DashboardHomeProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getUserPasses, getActivePasses, getTransactions } = usePlatformStore();
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const allPasses = useMemo(() => user ? getUserPasses(user.id) : [], [user, getUserPasses]);
  const activePasses = useMemo(() => user ? getActivePasses(user.id) : [], [user, getActivePasses]);
  const transactions = useMemo(() => user ? getTransactions(user.id) : [], [user, getTransactions]);
  const totalSpent = transactions.reduce((s, t) => s + t.totalAmount, 0);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/dashboard/passes" className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{activePasses.length}</div>
          <div className="text-sm text-muted-foreground">Active Passes</div>
        </Link>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <Flame className="h-6 w-6 text-warning mb-3" />
          <div className="text-2xl font-bold">{allPasses.length}</div>
          <div className="text-sm text-muted-foreground">Total Passes</div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <TrendingUp className="h-6 w-6 text-success mb-3" />
          <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Spent</div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border">
          <Calendar className="h-6 w-6 text-info mb-3" />
          <div className="text-2xl font-bold">{activePasses.filter(p => p.autoRenew).length}</div>
          <div className="text-sm text-muted-foreground">Auto-Renewing</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Passes Preview */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> My Active Passes
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/passes')}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {activePasses.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No active passes yet</p>
                <Button variant="gradient" onClick={() => navigate('/explore')}>Browse Venues</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activePasses.slice(0, 3).map(pass => {
                  const daysLeft = differenceInDays(parseISO(pass.endDate), new Date());
                  const progress = (pass.completedDays / pass.totalOperatingDays) * 100;
                  return (
                    <div key={pass.id} className={`p-4 rounded-xl border-2 ${daysLeft <= 3 ? 'border-warning bg-warning/5' : 'border-success/30 bg-success/5'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold truncate">
                              {pass.subjectName ? `${pass.subjectName} Classes` : `${pass.timeSegmentName} Access`}
                            </span>
                            <Badge variant="success" className="text-xs shrink-0">Active</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{pass.businessName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {pass.scheduleDays && (
                              <span>{pass.scheduleDays.map(d => DAY_SHORT[d]).join('/')}</span>
                            )}
                            {pass.slotStartTime && (
                              <span>{formatTime(pass.slotStartTime)}-{formatTime(pass.slotEndTime || '')}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-lg font-bold ${daysLeft <= 3 ? 'text-warning' : 'text-success'}`}>{Math.max(0, daysLeft)}</div>
                          <div className="text-xs text-muted-foreground">days left</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={progress} className="h-1.5" />
                      </div>
                      {daysLeft <= 3 && daysLeft > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-warning">
                          <AlertTriangle className="h-3 w-3" /> Expiring soon
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Recent Payments</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/fees')}>View All <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map(txn => (
                  <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <span className="font-medium text-sm">{txn.orderId}</span>
                      <p className="text-xs text-muted-foreground">{txn.items.map(i => i.description).join(', ').substring(0, 50)}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-success">₹{txn.totalAmount}</span>
                      <Badge variant="success" className="ml-2 text-xs">{txn.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/explore')}>
                <MapPin className="h-4 w-4 mr-2" /> Find Classes
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/passes')}>
                <CreditCard className="h-4 w-4 mr-2" /> My Passes
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/fees')}>
                <Wallet className="h-4 w-4 mr-2" /> Payments
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setPaymentMethodsOpen(true)}>
                <CreditCard className="h-4 w-4 mr-2" /> Payment Methods
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setSupportOpen(true)}>
                <HelpCircle className="h-4 w-4 mr-2" /> Get Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PaymentMethodsModal open={paymentMethodsOpen} onOpenChange={setPaymentMethodsOpen} />
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  );
}
