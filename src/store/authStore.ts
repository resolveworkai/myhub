import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar: string;
  joinDate: string;
  location: UserLocation;
  favorites: string[];
  bookings: string[];
  preferences: {
    categories: string[];
    priceRange: string;
  };
  accountType: 'normal';
  emailVerified: boolean;
  phoneVerified: boolean;
  marketingConsent: boolean;
  lastLogin: string | null;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  failedLoginAttempts: number;
  lockedUntil: string | null;
}

export interface BusinessUser {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  phone: string;
  website?: string;
  businessType: 'gym' | 'coaching' | 'library';
  registrationNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    lat: number;
    lng: number;
  };
  yearsInOperation: string;
  numberOfLocations: string;
  totalCapacity: number;
  operatingHours: Record<string, { open: string; close: string; closed: boolean }>;
  serviceAreas: string;
  accountManagerEmail?: string;
  avatar: string;
  accountType: 'business';
  subscriptionTier: 'starter' | 'growth' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  joinDate: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  businessVerified: boolean;
  lastLogin: string | null;
  accountStatus: 'active' | 'pending_verification' | 'suspended';
  locations: string[];
  staffMembers: string[];
  totalRevenue: number;
  failedLoginAttempts: number;
  lockedUntil: string | null;
}

export type AuthUser = User | BusinessUser;

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accountType: 'normal' | 'business' | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  
  // Verification state
  pendingVerificationEmail: string | null;
  verificationOTP: string | null;
  otpExpiresAt: string | null;
  
  // Inactivity tracking
  lastActivityTime: number;
  
  // Actions
  login: (user: AuthUser, token: string, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPendingVerification: (email: string, otp: string) => void;
  clearPendingVerification: () => void;
  updateLastActivity: () => void;
  checkInactivity: () => boolean;
  checkAndRestoreSession: () => boolean;
}

// Token utilities
const generateToken = (user: AuthUser, expirationDays: number = 1): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    accountType: user.accountType,
    exp: Date.now() + expirationDays * 24 * 60 * 60 * 1000,
  };
  return btoa(JSON.stringify(payload));
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token));
    return Date.now() > payload.exp;
  } catch {
    return true;
  }
};

const INACTIVITY_TIMEOUT_NORMAL = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_TIMEOUT_BUSINESS = 60 * 60 * 1000; // 60 minutes

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accountType: null,
      token: null,
      loading: false,
      error: null,
      pendingVerificationEmail: null,
      verificationOTP: null,
      otpExpiresAt: null,
      lastActivityTime: Date.now(),

      login: (user, token, rememberMe = false) => {
        const expirationDays = rememberMe ? 30 : 1;
        const newToken = token || generateToken(user, expirationDays);
        
        set({
          isAuthenticated: true,
          user,
          accountType: user.accountType,
          token: newToken,
          loading: false,
          error: null,
          lastActivityTime: Date.now(),
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          accountType: null,
          token: null,
          loading: false,
          error: null,
          pendingVerificationEmail: null,
          verificationOTP: null,
          otpExpiresAt: null,
        });
        
        // Clear session storage
        sessionStorage.clear();
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } as AuthUser });
        }
      },

      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),

      setPendingVerification: (email, otp) => {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        set({
          pendingVerificationEmail: email,
          verificationOTP: otp,
          otpExpiresAt: expiresAt,
        });
      },

      clearPendingVerification: () => {
        set({
          pendingVerificationEmail: null,
          verificationOTP: null,
          otpExpiresAt: null,
        });
      },

      updateLastActivity: () => {
        set({ lastActivityTime: Date.now() });
      },

      checkInactivity: () => {
        const { lastActivityTime, accountType, isAuthenticated } = get();
        if (!isAuthenticated) return false;
        
        const timeout = accountType === 'business' 
          ? INACTIVITY_TIMEOUT_BUSINESS 
          : INACTIVITY_TIMEOUT_NORMAL;
        
        return Date.now() - lastActivityTime > timeout;
      },

      checkAndRestoreSession: () => {
        const { token, isAuthenticated } = get();
        
        if (!token) return false;
        
        if (isTokenExpired(token)) {
          get().logout();
          return false;
        }
        
        return isAuthenticated;
      },
    }),
    {
      name: 'portal_auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accountType: state.accountType,
        token: state.token,
        lastActivityTime: state.lastActivityTime,
      }),
    }
  )
);

// Activity tracking hook
export const useActivityTracking = () => {
  const updateLastActivity = useAuthStore((s) => s.updateLastActivity);
  
  const trackActivity = () => {
    updateLastActivity();
  };
  
  return { trackActivity };
};
