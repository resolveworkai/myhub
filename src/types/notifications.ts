// Notification System Types

export type NotificationChannel = 'sms' | 'email' | 'whatsapp';
export type NotificationType = 'booking_confirmation' | 'booking_reminder' | 'booking_modification' | 'pass_purchase' | 'pass_expiry' | 'announcement';

export interface NotificationPreference {
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
}

export interface UserNotificationSettings {
  userId: string;
  enabled: NotificationPreference;
  // Usage tracking for rate limiting
  dailyUsage: {
    sms: number;
    email: number;
    whatsapp: number;
    date: string; // YYYY-MM-DD
  };
}

export interface BusinessNotificationSettings {
  businessId: string;
  // Whether each channel is enabled by the business
  channelsEnabled: NotificationPreference;
  // Daily cap per user for this business
  dailyCapPerUser: {
    sms: number;
    email: number;
    whatsapp: number;
  };
}

export interface AdminNotificationConfig {
  // Global default cap per user per day
  defaultDailyCapPerUser: {
    sms: number;
    email: number;
    whatsapp: number;
  };
  // Maximum cap that businesses can set
  maxAllowedCap: {
    sms: number;
    email: number;
    whatsapp: number;
  };
}

export interface NotificationLog {
  id: string;
  userId: string;
  businessId: string;
  channel: NotificationChannel;
  type: NotificationType;
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
