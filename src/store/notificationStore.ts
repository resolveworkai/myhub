import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import notificationsData from '@/data/mock/notifications.json';

export type NotificationType = 
  | 'booking_confirmation' 
  | 'booking_reminder' 
  | 'booking_modification'
  | 'booking_cancellation'
  | 'review_request'
  | 'special_offer'
  | 'new_booking'
  | 'cancellation_alert'
  | 'daily_summary'
  | 'capacity_alert'
  | 'low_occupancy'
  | 'revenue_milestone'
  | 'review_alert'
  | 'negative_review'
  | 'weekly_report'
  | 'payment_alert'
  | 'system_update';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  userType: 'normal' | 'business';
  type: NotificationType;
  title: string;
  message: string;
  relatedEntity: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  scheduledFor?: string;
  deliveredAt?: string;
  deliveryChannels: ('email' | 'sms' | 'push' | 'in_app')[];
  deliveryStatus: Record<string, 'pending' | 'delivered' | 'failed'>;
}

export interface NotificationPreferences {
  email: {
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    bookingCancellation: boolean;
    specialOffers: boolean;
    reviewRequest: boolean;
    newBooking: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
    capacityAlerts: boolean;
    reviewAlerts: boolean;
    paymentAlerts: boolean;
  };
  sms: {
    bookingConfirmation: boolean;
    bookingReminder: boolean;
    urgentAlerts: boolean;
  };
  push: {
    enabled: boolean;
    bookingReminder: boolean;
    newBooking: boolean;
    urgentAlerts: boolean;
  };
  inApp: {
    soundEnabled: boolean;
    toastEnabled: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  dailyDigest: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email: {
    bookingConfirmation: true,
    bookingReminder: true,
    bookingCancellation: true,
    specialOffers: true,
    reviewRequest: true,
    newBooking: true,
    dailySummary: true,
    weeklyReport: true,
    capacityAlerts: true,
    reviewAlerts: true,
    paymentAlerts: true,
  },
  sms: {
    bookingConfirmation: true,
    bookingReminder: true,
    urgentAlerts: true,
  },
  push: {
    enabled: true,
    bookingReminder: true,
    newBooking: true,
    urgentAlerts: true,
  },
  inApp: {
    soundEnabled: true,
    toastEnabled: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  dailyDigest: false,
};

interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  
  // Actions
  fetchNotifications: (userId: string, userType: 'normal' | 'business') => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      preferences: defaultPreferences,
      unreadCount: 0,

      fetchNotifications: (userId, userType) => {
        const userNotifications = (notificationsData as Notification[])
          .filter(n => n.userId === userId || (userType === 'normal' && n.userId.startsWith('u')) || (userType === 'business' && n.userId.startsWith('bu')))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const unread = userNotifications.filter(n => !n.read).length;
        
        set({ 
          notifications: userNotifications.slice(0, 20), 
          unreadCount: unread 
        });
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const updated = state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.read).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      deleteNotification: (notificationId) => {
        set((state) => {
          const updated = state.notifications.filter(n => n.id !== notificationId);
          return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.read).length,
          };
        });
      },

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `n${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      updatePreferences: (newPrefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPrefs },
        }));
      },

      getUnreadCount: () => get().unreadCount,
    }),
    {
      name: 'portal_notifications',
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

// Notification helper functions
export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    booking_confirmation: '✅',
    booking_reminder: '⏰',
    booking_modification: '📝',
    booking_cancellation: '❌',
    review_request: '⭐',
    special_offer: '🎁',
    new_booking: '📅',
    cancellation_alert: '🚫',
    daily_summary: '📊',
    capacity_alert: '📈',
    low_occupancy: '📉',
    revenue_milestone: '🎉',
    review_alert: '💬',
    negative_review: '⚠️',
    weekly_report: '📋',
    payment_alert: '💳',
    system_update: '🔔',
  };
  return icons[type] || '🔔';
};

export const getNotificationColor = (priority: NotificationPriority): string => {
  const colors: Record<NotificationPriority, string> = {
    low: 'bg-muted',
    medium: 'bg-primary/10',
    high: 'bg-warning/10',
    urgent: 'bg-destructive/10',
  };
  return colors[priority];
};

export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
