import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePlatformStore } from "@/store/platformStore";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, DollarSign,
  Users, TrendingUp, Ban, Eye, MessageSquare, Ticket, CheckCircle2,
} from "lucide-react";
import type { PlatformBusiness, CommissionTier } from "@/types/platform";

interface AdminBusinessDetailProps {
  business: PlatformBusiness;
  onBack: () => void;
}

export default function AdminBusinessDetail({ business, onBack }: AdminBusinessDetailProps) {
  const {
    studentPasses, transactions, adminSettings,
    pauseBusiness, unpauseBusiness, updateBusinessConfig,
  } = usePlatformStore();

  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [showPassesDialog, setShowPassesDialog] = useState(false);
  const [showPaymentsDialog, setShowPaymentsDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<CommissionTier>(business.commissionTier);
  const [editingRate, setEditingRate] = useState<number>(business.commissionRate);

  const bizPasses = studentPasses.filter(p => p.businessId === business.id);
  const activePasses = bizPasses.filter(p => p.status === 'active');
  const autoRenewPasses = activePasses.filter(p => p.autoRenew);
  const renewalRate = activePasses.length > 0
    ? Math.round((autoRenewPasses.length / activePasses.length) * 100)
    : 0;

  const bizTransactions = transactions.filter(t =>
    t.items.some(i => i.description.includes(business.name))
  );
  const totalRevenue = bizTransactions.reduce((s, t) => s + t.totalAmount, 0);
  const thisMonthRevenue = bizTransactions
    .filter(t => new Date(t.createdAt).getMonth() === new Date().getMonth())
    .reduce((s, t) => s + t.totalAmount, 0);

  const handlePause = () => {
    if (!pauseReason.trim()) {
      toast.error("Please provide a reason for pausing");
      return;
    }
    pauseBusiness(business.id);
    toast.success(`${business.name} has been paused`);
    setShowPauseDialog(false);
    setPauseReason("");
  };

  const handleUnpause = () => {
    unpauseBusiness(business.id);
    toast.success(`${business.name} has been resumed`);
  };

  const handleTierChange = (tier: CommissionTier) => {
    setEditingTier(tier);
    setEditingRate(adminSettings.commissionRates[tier]);
  };

  const handleSaveTier = () => {
    updateBusinessConfig(business.id, {
      commissionTier: editingTier,
      commissionRate: editingRate,
      subscriptionFee: adminSettings.subscriptionFees[editingTier],
    });
    toast.success("Tier & commission updated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{business.name}</h1>
          <p className="text-sm text-muted-foreground">Business ID: {business.id}</p>
        </div>
        <Badge
          variant={
            business.status === 'approved' ? 'success'
            : business.status === 'paused' ? 'warning'
            : business.status === 'pending' ? 'outline'
            : 'destructive'
          }
          className="capitalize text-sm px-3 py-1"
        >
          {business.status === 'approved' ? '🟢' : business.status === 'paused' ? '🟡' : '🔴'} {business.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Status & Tier + Contact */}
        <div className="space-y-6">
          {/* Status & Tier Card */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Status & Tier</h2>

            <div>
              <p className="text-sm font-medium mb-1.5">Commission Tier</p>
              <Select value={editingTier} onValueChange={v => handleTierChange(v as CommissionTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (15% commission)</SelectItem>
                  <SelectItem value="premium">Premium (8% commission)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (0% commission)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-sm font-medium mb-1.5">Commission Rate (override)</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  value={editingRate}
                  onChange={e => setEditingRate(+e.target.value)}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Subscription Fee</p>
                <p className="text-sm text-muted-foreground">
                  ₹{adminSettings.subscriptionFees[editingTier].toLocaleString()}/month
                </p>
              </div>
            </div>

            <Button className="w-full" onClick={handleSaveTier}>Save Tier & Commission</Button>
          </div>

          {/* Contact Card */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Contact</h2>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{business.contactPerson}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{business.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{business.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{business.address.street}, {business.address.area}, {business.address.city}</span>
            </div>
          </div>
        </div>

        {/* Middle Column: Performance */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Performance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-muted/50">
                <DollarSign className="h-4 w-4 text-success mb-1" />
                <p className="text-lg font-bold">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <TrendingUp className="h-4 w-4 text-primary mb-1" />
                <p className="text-lg font-bold">₹{thisMonthRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <Ticket className="h-4 w-4 text-info mb-1" />
                <p className="text-lg font-bold">{activePasses.length}</p>
                <p className="text-xs text-muted-foreground">Active Passes</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <CheckCircle2 className="h-4 w-4 text-warning mb-1" />
                <p className="text-lg font-bold">{renewalRate}%</p>
                <p className="text-xs text-muted-foreground">Renewal Rate</p>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Business Info</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="secondary" className="capitalize">{business.vertical}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rating</span>
              <span className="text-sm font-medium">⭐ {business.rating} ({business.reviews} reviews)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Verified</span>
              <Badge variant={business.verified ? 'success' : 'outline'}>
                {business.verified ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Registered</span>
              <span className="text-sm">{new Date(business.createdAt).toLocaleDateString()}</span>
            </div>
            {business.vertical === 'coaching' && business.subjects && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subjects</span>
                <span className="text-sm font-medium">{business.subjects.length}</span>
              </div>
            )}
            {business.vertical !== 'coaching' && business.passTemplates && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pass Templates</span>
                <span className="text-sm font-medium">{business.passTemplates.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">Actions</h2>

            {business.status === 'approved' && (
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => setShowPauseDialog(true)}
              >
                <Ban className="h-4 w-4 mr-2" /> Pause Business
              </Button>
            )}
            {business.status === 'paused' && (
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={handleUnpause}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Unpause Business
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowPassesDialog(true)}
            >
              <Eye className="h-4 w-4 mr-2" /> View All Passes ({activePasses.length} active)
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowPaymentsDialog(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" /> View Payment History
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => toast.info("Message sent to business owner (simulated)")}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Send Message to Owner
            </Button>
          </div>
        </div>
      </div>

      {/* Pause Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Business: {business.name}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <p className="text-sm font-medium text-warning">
                ⚠️ WARNING: {activePasses.length} active student passes
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Reason for pausing (required)</p>
              <Textarea
                placeholder="e.g., Multiple complaints about misleading pricing..."
                value={pauseReason}
                onChange={e => setPauseReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>When you pause:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Business hidden from student searches</li>
                <li>Existing passes remain valid</li>
                <li>No new bookings allowed</li>
                <li>Owner notified immediately</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handlePause}>Confirm Pause</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passes Dialog */}
      <Dialog open={showPassesDialog} onOpenChange={setShowPassesDialog}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Passes — {business.name} ({bizPasses.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {bizPasses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No passes found</p>
            ) : bizPasses.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{p.userName}</p>
                  <p className="text-xs text-muted-foreground">{p.userEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.subjectName || p.timeSegmentName} • {p.startDate} → {p.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={p.status === 'active' ? 'success' : 'outline'} className="capitalize text-xs">
                    {p.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-renew: {p.autoRenew ? '✅' : '❌'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payments Dialog */}
      <Dialog open={showPaymentsDialog} onOpenChange={setShowPaymentsDialog}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment History — {business.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {bizTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions found</p>
            ) : bizTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{t.orderId}</p>
                  <p className="text-xs text-muted-foreground">{t.userEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">₹{t.totalAmount.toLocaleString()}</p>
                  <Badge variant={t.status === 'success' ? 'success' : 'destructive'} className="capitalize text-xs">
                    {t.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
