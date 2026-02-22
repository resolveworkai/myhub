import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, addDays } from 'date-fns';

export type PlanTier = 'starter' | 'growth' | 'enterprise';

export interface PlanDetails {
  id: PlanTier;
  name: string;
  price: number; // monthly in ₹
  period: string;
  features: string[];
}

export const PLAN_CATALOG: PlanDetails[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    period: 'forever',
    features: ['1 location', '50 bookings/month', 'Basic analytics', 'Email support'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 3999,
    period: 'month',
    features: ['3 locations', 'Unlimited bookings', 'Advanced analytics', 'Priority support', 'Smart scheduling', 'Payment processing'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9999,
    period: 'month',
    features: ['Unlimited locations', 'Unlimited bookings', 'White-label options', 'Dedicated manager', 'API access', 'Custom integrations', 'SLA guarantee'],
  },
];

const PLAN_ORDER: Record<PlanTier, number> = { starter: 0, growth: 1, enterprise: 2 };

export interface BusinessSubscription {
  id: string;
  businessId: string;
  businessName: string;
  currentPlan: PlanTier;
  status: 'active' | 'trial' | 'expired';
  startDate: string;
  endDate: string; // current billing cycle end
  scheduledDowngrade?: {
    toPlan: PlanTier;
    effectiveDate: string; // = current endDate
    requestedAt: string;
  };
}

export interface SubscriptionTransaction {
  id: string;
  businessId: string;
  businessName: string;
  type: 'upgrade' | 'downgrade' | 'renewal' | 'new';
  fromPlan: PlanTier;
  toPlan: PlanTier;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  paymentMethod: string;
  orderId: string;
  createdAt: string;
  description: string;
}

interface BusinessSubscriptionState {
  subscriptions: BusinessSubscription[];
  transactions: SubscriptionTransaction[];

  // Queries
  getSubscription: (businessId: string) => BusinessSubscription | undefined;
  getTransactions: (businessId: string) => SubscriptionTransaction[];
  getAllTransactions: () => SubscriptionTransaction[];

  // Actions
  initSubscription: (businessId: string, businessName: string, plan: PlanTier) => void;
  upgradePlan: (businessId: string, toPlan: PlanTier, paymentMethod: string) => SubscriptionTransaction;
  scheduleDowngrade: (businessId: string, toPlan: PlanTier) => SubscriptionTransaction;
  cancelScheduledDowngrade: (businessId: string) => void;
}

export const useBusinessSubscriptionStore = create<BusinessSubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      transactions: [],

      getSubscription: (businessId) =>
        get().subscriptions.find((s) => s.businessId === businessId),

      getTransactions: (businessId) =>
        get().transactions.filter((t) => t.businessId === businessId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      getAllTransactions: () =>
        [...get().transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      initSubscription: (businessId, businessName, plan) => {
        const existing = get().getSubscription(businessId);
        if (existing) return;

        const now = new Date();
        const sub: BusinessSubscription = {
          id: `bsub_${Date.now()}`,
          businessId,
          businessName,
          currentPlan: plan,
          status: 'active',
          startDate: format(now, 'yyyy-MM-dd'),
          endDate: format(addDays(now, 30), 'yyyy-MM-dd'),
        };

        set((state) => ({
          subscriptions: [...state.subscriptions, sub],
        }));
      },

      upgradePlan: (businessId, toPlan, paymentMethod) => {
        const sub = get().getSubscription(businessId);
        const planDetails = PLAN_CATALOG.find((p) => p.id === toPlan)!;
        const fromPlan = sub?.currentPlan || 'starter';
        const businessName = sub?.businessName || '';

        const txn: SubscriptionTransaction = {
          id: `bstxn_${Date.now()}`,
          businessId,
          businessName,
          type: 'upgrade',
          fromPlan,
          toPlan,
          amount: planDetails.price,
          status: 'success',
          paymentMethod,
          orderId: `BORD-${Date.now()}`,
          createdAt: new Date().toISOString(),
          description: `Upgraded from ${fromPlan.charAt(0).toUpperCase() + fromPlan.slice(1)} to ${toPlan.charAt(0).toUpperCase() + toPlan.slice(1)} plan`,
        };

        const now = new Date();
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.businessId === businessId
              ? {
                  ...s,
                  currentPlan: toPlan,
                  status: 'active' as const,
                  startDate: format(now, 'yyyy-MM-dd'),
                  endDate: format(addDays(now, 30), 'yyyy-MM-dd'),
                  scheduledDowngrade: undefined,
                }
              : s
          ),
          transactions: [...state.transactions, txn],
        }));

        return txn;
      },

      scheduleDowngrade: (businessId, toPlan) => {
        const sub = get().getSubscription(businessId)!;
        const fromPlan = sub.currentPlan;

        const txn: SubscriptionTransaction = {
          id: `bstxn_${Date.now()}`,
          businessId,
          businessName: sub.businessName,
          type: 'downgrade',
          fromPlan,
          toPlan,
          amount: 0,
          status: 'pending',
          paymentMethod: 'N/A',
          orderId: `BORD-${Date.now()}`,
          createdAt: new Date().toISOString(),
          description: `Scheduled downgrade from ${fromPlan.charAt(0).toUpperCase() + fromPlan.slice(1)} to ${toPlan.charAt(0).toUpperCase() + toPlan.slice(1)} — effective ${sub.endDate}`,
        };

        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.businessId === businessId
              ? {
                  ...s,
                  scheduledDowngrade: {
                    toPlan,
                    effectiveDate: s.endDate,
                    requestedAt: new Date().toISOString(),
                  },
                }
              : s
          ),
          transactions: [...state.transactions, txn],
        }));

        return txn;
      },

      cancelScheduledDowngrade: (businessId) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.businessId === businessId
              ? { ...s, scheduledDowngrade: undefined }
              : s
          ),
        }));
      },
    }),
    { name: 'business_subscription_store' }
  )
);

export const isPlanUpgrade = (from: PlanTier, to: PlanTier) => PLAN_ORDER[to] > PLAN_ORDER[from];
export const isPlanDowngrade = (from: PlanTier, to: PlanTier) => PLAN_ORDER[to] < PLAN_ORDER[from];
export const getPlanDetails = (tier: PlanTier) => PLAN_CATALOG.find((p) => p.id === tier)!;
