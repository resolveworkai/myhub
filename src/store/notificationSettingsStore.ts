import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import type {
  NotificationChannel,
  NotificationType,
  UserNotificationSettings,
  BusinessNotificationSettings,
  AdminNotificationConfig,
  NotificationLog,
} from '@/types/notifications';

interface NotificationSettingsStore {
  // Admin config
  adminConfig: AdminNotificationConfig;
  
  // Business settings
  businessSettings: BusinessNotificationSettings[];
  
  // User settings
  userSettings: UserNotificationSettings[];
  
  // Notification logs
  notificationLogs: NotificationLog[];

  // Admin actions
  updateAdminConfig: (config: Partial<AdminNotificationConfig>) => void;
  
  // Business actions
  getBusinessSettings: (businessId: string) => BusinessNotificationSettings;
  updateBusinessSettings: (businessId: string, settings: Partial<BusinessNotificationSettings>) => void;
  toggleBusinessChannel: (businessId: string, channel: NotificationChannel, enabled: boolean) => void;
  setBusinessDailyCap: (businessId: string, channel: NotificationChannel, cap: number) => void;
  
  // User actions
  getUserSettings: (userId: string) => UserNotificationSettings;
  updateUserSettings: (userId: string, settings: Partial<UserNotificationSettings>) => void;
  toggleUserChannel: (userId: string, channel: NotificationChannel, enabled: boolean) => void;
  
  // Notification actions
  canSendNotification: (userId: string, businessId: string, channel: NotificationChannel) => boolean;
  sendNotification: (data: {
    userId: string;
    businessId: string;
    channel: NotificationChannel;
    type: NotificationType;
    subject?: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) => NotificationLog | null;
  
  getNotificationLogs: (userId?: string, businessId?: string) => NotificationLog[];
}

const DEFAULT_ADMIN_CONFIG: AdminNotificationConfig = {
  defaultDailyCapPerUser: {
    sms: 5,
    email: 5,
    whatsapp: 5,
  },
  maxAllowedCap: {
    sms: 20,
    email: 50,
    whatsapp: 20,
  },
};

const DEFAULT_BUSINESS_SETTINGS: Omit<BusinessNotificationSettings, 'businessId'> = {
  channelsEnabled: {
    sms: true,
    email: true,
    whatsapp: true,
  },
  dailyCapPerUser: {
    sms: 5,
    email: 5,
    whatsapp: 5,
  },
};

const DEFAULT_USER_SETTINGS: Omit<UserNotificationSettings, 'userId'> = {
  enabled: {
    sms: true,
    email: true,
    whatsapp: true,
  },
  dailyUsage: {
    sms: 0,
    email: 0,
    whatsapp: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
  },
};

export const useNotificationSettingsStore = create<NotificationSettingsStore>()(
  persist(
    (set, get) => ({
      adminConfig: DEFAULT_ADMIN_CONFIG,
      businessSettings: [],
      userSettings: [],
      notificationLogs: [],

      // Admin actions
      updateAdminConfig: (config) => {
        set(state => ({
          adminConfig: { ...state.adminConfig, ...config },
        }));
      },

      // Business actions
      getBusinessSettings: (businessId) => {
        const existing = get().businessSettings.find(s => s.businessId === businessId);
        if (existing) return existing;
        
        // Return default settings
        return {
          businessId,
          ...DEFAULT_BUSINESS_SETTINGS,
        };
      },

      updateBusinessSettings: (businessId, settings) => {
        set(state => {
          const exists = state.businessSettings.some(s => s.businessId === businessId);
          if (exists) {
            return {
              businessSettings: state.businessSettings.map(s =>
                s.businessId === businessId ? { ...s, ...settings } : s
              ),
            };
          }
          return {
            businessSettings: [
              ...state.businessSettings,
              { businessId, ...DEFAULT_BUSINESS_SETTINGS, ...settings },
            ],
          };
        });
      },

      toggleBusinessChannel: (businessId, channel, enabled) => {
        const settings = get().getBusinessSettings(businessId);
        get().updateBusinessSettings(businessId, {
          channelsEnabled: {
            ...settings.channelsEnabled,
            [channel]: enabled,
          },
        });
      },

      setBusinessDailyCap: (businessId, channel, cap) => {
        const settings = get().getBusinessSettings(businessId);
        const maxCap = get().adminConfig.maxAllowedCap[channel];
        const clampedCap = Math.min(cap, maxCap);
        
        get().updateBusinessSettings(businessId, {
          dailyCapPerUser: {
            ...settings.dailyCapPerUser,
            [channel]: clampedCap,
          },
        });
      },

      // User actions
      getUserSettings: (userId) => {
        const existing = get().userSettings.find(s => s.userId === userId);
        const today = format(new Date(), 'yyyy-MM-dd');
        
        if (existing) {
          // Reset usage if new day
          if (existing.dailyUsage.date !== today) {
            const updatedSettings = {
              ...existing,
              dailyUsage: {
                sms: 0,
                email: 0,
                whatsapp: 0,
                date: today,
              },
            };
            set(state => ({
              userSettings: state.userSettings.map(s =>
                s.userId === userId ? updatedSettings : s
              ),
            }));
            return updatedSettings;
          }
          return existing;
        }
        
        // Return default settings
        return {
          userId,
          ...DEFAULT_USER_SETTINGS,
          dailyUsage: { ...DEFAULT_USER_SETTINGS.dailyUsage, date: today },
        };
      },

      updateUserSettings: (userId, settings) => {
        set(state => {
          const exists = state.userSettings.some(s => s.userId === userId);
          if (exists) {
            return {
              userSettings: state.userSettings.map(s =>
                s.userId === userId ? { ...s, ...settings } : s
              ),
            };
          }
          return {
            userSettings: [
              ...state.userSettings,
              { userId, ...DEFAULT_USER_SETTINGS, ...settings },
            ],
          };
        });
      },

      toggleUserChannel: (userId, channel, enabled) => {
        const settings = get().getUserSettings(userId);
        get().updateUserSettings(userId, {
          enabled: {
            ...settings.enabled,
            [channel]: enabled,
          },
        });
      },

      // Notification actions
      canSendNotification: (userId, businessId, channel) => {
        const userSettings = get().getUserSettings(userId);
        const businessSettings = get().getBusinessSettings(businessId);
        
        // Check if user has enabled this channel
        if (!userSettings.enabled[channel]) return false;
        
        // Check if business has enabled this channel
        if (!businessSettings.channelsEnabled[channel]) return false;
        
        // Check daily cap
        const dailyCap = businessSettings.dailyCapPerUser[channel];
        const currentUsage = userSettings.dailyUsage[channel];
        
        return currentUsage < dailyCap;
      },

      sendNotification: (data) => {
        const { userId, businessId, channel, type, subject, message, metadata } = data;
        
        // Check if we can send
        if (!get().canSendNotification(userId, businessId, channel)) {
          return null;
        }
        
        // Create notification log
        const log: NotificationLog = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          businessId,
          channel,
          type,
          subject,
          message,
          status: 'sent', // In real implementation, this would be 'pending' until actually sent
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          metadata,
        };
        
        // Update user's daily usage
        const userSettings = get().getUserSettings(userId);
        get().updateUserSettings(userId, {
          dailyUsage: {
            ...userSettings.dailyUsage,
            [channel]: userSettings.dailyUsage[channel] + 1,
          },
        });
        
        // Add to logs
        set(state => ({
          notificationLogs: [log, ...state.notificationLogs].slice(0, 1000), // Keep last 1000 logs
        }));
        
        return log;
      },

      getNotificationLogs: (userId, businessId) => {
        let logs = get().notificationLogs;
        if (userId) {
          logs = logs.filter(l => l.userId === userId);
        }
        if (businessId) {
          logs = logs.filter(l => l.businessId === businessId);
        }
        return logs;
      },
    }),
    {
      name: 'notification-settings-store',
    }
  )
);
