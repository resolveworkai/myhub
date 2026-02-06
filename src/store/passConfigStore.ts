import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import passConfigData from '@/data/mock/passConfig.json';

export interface PassConfig {
  businessId: string;
  dailyPassEnabled: boolean;
  weeklyPassEnabled: boolean;
  monthlyPassEnabled: boolean;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  dailyAdminApproved: boolean;
  weeklyAdminApproved: boolean;
  monthlyAdminApproved: boolean;
  pendingApproval: boolean;
}

interface PassConfigStore {
  configs: Record<string, PassConfig>;
  
  // Getters
  getConfig: (businessId: string) => PassConfig;
  isPassTypeActive: (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => boolean;
  hasPendingApproval: (businessId: string) => boolean;
  getAllPendingApprovals: () => PassConfig[];
  
  // Business owner actions
  updatePassConfig: (businessId: string, updates: Partial<PassConfig>) => void;
  requestPassApproval: (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => void;
  
  // Admin actions
  approvePass: (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => void;
  rejectPass: (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => void;
  approveAllPending: (businessId: string) => void;
  rejectAllPending: (businessId: string) => void;
}

// Default config for new businesses
const getDefaultConfig = (businessId: string): PassConfig => ({
  businessId,
  dailyPassEnabled: false,
  weeklyPassEnabled: false,
  monthlyPassEnabled: false,
  dailyPrice: 299,
  weeklyPrice: 1499,
  monthlyPrice: 4999,
  dailyAdminApproved: false,
  weeklyAdminApproved: false,
  monthlyAdminApproved: false,
  pendingApproval: false,
});

export const usePassConfigStore = create<PassConfigStore>()(
  persist(
    (set, get) => ({
      configs: passConfigData as Record<string, PassConfig>,

      getConfig: (businessId: string) => {
        const { configs } = get();
        return configs[businessId] || getDefaultConfig(businessId);
      },

      isPassTypeActive: (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => {
        const config = get().getConfig(businessId);
        switch (passType) {
          case 'daily':
            return config.dailyPassEnabled && config.dailyAdminApproved;
          case 'weekly':
            return config.weeklyPassEnabled && config.weeklyAdminApproved;
          case 'monthly':
            return config.monthlyPassEnabled && config.monthlyAdminApproved;
          default:
            return false;
        }
      },

      hasPendingApproval: (businessId: string) => {
        const config = get().getConfig(businessId);
        return config.pendingApproval;
      },

      getAllPendingApprovals: () => {
        const { configs } = get();
        return Object.values(configs).filter(c => c.pendingApproval);
      },

      updatePassConfig: (businessId: string, updates: Partial<PassConfig>) => {
        set((state) => ({
          configs: {
            ...state.configs,
            [businessId]: {
              ...get().getConfig(businessId),
              ...updates,
            },
          },
        }));
      },

      requestPassApproval: (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => {
        const config = get().getConfig(businessId);
        const updates: Partial<PassConfig> = { pendingApproval: true };
        
        switch (passType) {
          case 'daily':
            updates.dailyPassEnabled = true;
            break;
          case 'weekly':
            updates.weeklyPassEnabled = true;
            break;
          case 'monthly':
            updates.monthlyPassEnabled = true;
            break;
        }
        
        set((state) => ({
          configs: {
            ...state.configs,
            [businessId]: { ...config, ...updates },
          },
        }));
      },

      approvePass: (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => {
        const config = get().getConfig(businessId);
        const updates: Partial<PassConfig> = {};
        
        switch (passType) {
          case 'daily':
            updates.dailyAdminApproved = true;
            break;
          case 'weekly':
            updates.weeklyAdminApproved = true;
            break;
          case 'monthly':
            updates.monthlyAdminApproved = true;
            break;
        }
        
        // Check if all pending passes are now approved
        const updatedConfig = { ...config, ...updates };
        const allApproved = 
          (!updatedConfig.dailyPassEnabled || updatedConfig.dailyAdminApproved) &&
          (!updatedConfig.weeklyPassEnabled || updatedConfig.weeklyAdminApproved) &&
          (!updatedConfig.monthlyPassEnabled || updatedConfig.monthlyAdminApproved);
        
        if (allApproved) {
          updates.pendingApproval = false;
        }
        
        set((state) => ({
          configs: {
            ...state.configs,
            [businessId]: { ...config, ...updates },
          },
        }));
      },

      rejectPass: (businessId: string, passType: 'daily' | 'weekly' | 'monthly') => {
        const config = get().getConfig(businessId);
        const updates: Partial<PassConfig> = {};
        
        switch (passType) {
          case 'daily':
            updates.dailyPassEnabled = false;
            updates.dailyAdminApproved = false;
            break;
          case 'weekly':
            updates.weeklyPassEnabled = false;
            updates.weeklyAdminApproved = false;
            break;
          case 'monthly':
            updates.monthlyPassEnabled = false;
            updates.monthlyAdminApproved = false;
            break;
        }
        
        // Check if no more pending passes
        const updatedConfig = { ...config, ...updates };
        const anyPending = 
          (updatedConfig.dailyPassEnabled && !updatedConfig.dailyAdminApproved) ||
          (updatedConfig.weeklyPassEnabled && !updatedConfig.weeklyAdminApproved) ||
          (updatedConfig.monthlyPassEnabled && !updatedConfig.monthlyAdminApproved);
        
        if (!anyPending) {
          updates.pendingApproval = false;
        }
        
        set((state) => ({
          configs: {
            ...state.configs,
            [businessId]: { ...config, ...updates },
          },
        }));
      },

      approveAllPending: (businessId: string) => {
        const config = get().getConfig(businessId);
        set((state) => ({
          configs: {
            ...state.configs,
            [businessId]: {
              ...config,
              dailyAdminApproved: config.dailyPassEnabled,
              weeklyAdminApproved: config.weeklyPassEnabled,
              monthlyAdminApproved: config.monthlyPassEnabled,
              pendingApproval: false,
            },
          },
        }));
      },

      rejectAllPending: (businessId: string) => {
        const config = get().getConfig(businessId);
        set((state) => ({
          configs: {
            ...state.configs,
            [businessId]: {
              ...config,
              dailyPassEnabled: config.dailyAdminApproved,
              weeklyPassEnabled: config.weeklyAdminApproved,
              monthlyPassEnabled: config.monthlyAdminApproved,
              pendingApproval: false,
            },
          },
        }));
      },
    }),
    {
      name: 'pass-config-store',
    }
  )
);
