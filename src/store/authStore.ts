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
  businessName: string;
  email: string;
  phone: string;
  avatar?: string;
  accountType: 'business';
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  joinDate?: string;
  
  // Verification
  businessVerified: boolean;
  profileCompleted?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  emailVerified: boolean;
  phoneVerified?: boolean;
  emailVerificationCode?: string;
  
  // Account status fields (matching User)
  lastLogin?: string | null;
  accountStatus?: 'active' | 'suspended' | 'pending_verification';
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  
  // Business Details
  businessType: 'gym' | 'coaching' | 'library';
  registrationNumber?: string;
  taxId?: string;
  yearEstablished?: string;
  yearsInOperation?: string;
  numberOfLocations?: string;
  totalCapacity?: number;
  operatingHours?: {
    [key: string]: {
      timeSlots?: Array<{ open: string; close: string }>;
      open?: string;
      close?: string;
      closed?: boolean;
    };
  };
  description?: string;
  
  // Settings
  notificationPreferences?: {
    emailBookings?: boolean;
    emailPayments?: boolean;
    emailReminders?: boolean;
    smsBookings?: boolean;
    smsPayments?: boolean;
    pushNotifications?: boolean;
  };
  securitySettings?: {
    twoFactor?: boolean;
    sessionTimeout?: string;
  };
  businessAttributes?: {
    amenities?: string[];
    equipment?: string[];
    classTypes?: string[];
    membershipOptions?: string[];
    subjects?: string[];
    levels?: string[];
    teachingModes?: string[];
    batchSizes?: string[];
    facilities?: string[];
    collections?: string[];
    spaceTypes?: string[];
    [key: string]: any; // Allow other attributes
  };
  
  // Owner info
  ownerName?: string;
  accountManagerEmail?: string;
  
  // Location & Contact
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
  website?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  
  // Media
  logo?: string;
  coverImage?: string;
  galleryImages?: string[];
  
  // Business-specific fields
  amenities?: string[];
  serviceAreas?: string;
  targetAudience?: string;
  specializations?: string[];
  specialties?: string[];
  certifications?: string[];
  
  // Subscription tier
  subscriptionTier?: 'starter' | 'growth' | 'enterprise';
  subscriptionStatus?: 'active' | 'trial' | 'expired';
  
  // Additional business data
  locations?: string[];
  staffMembers?: any[];
  totalRevenue?: number;
  
  // Type-specific attributes (from filterDefinitions)
  equipment?: string[];      // Gym
  classTypes?: string[];     // Gym
  operatingSchedule?: string[]; // Gym
  membershipTypes?: string[]; // Gym
  membershipOptions?: string[]; // Gym (legacy support)
  
  subjects?: string[];       // Coaching
  levels?: string[];         // Coaching
  teachingModes?: string[];  // Coaching
  batchSizes?: string[];     // Coaching
  ageGroups?: string[];      // Coaching
  qualifications?: string[]; // Coaching
  
  facilities?: string[];     // Library
  collections?: string[];    // Library
  spaceTypes?: string[];     // Library
  services?: string[];       // Library
  hoursOptions?: string[];   // Library
  
  // Publishing
  isPublished: boolean;
  publishedAt?: string;
  
  // Package Pricing (in ₹)
  dailyPackagePrice: number;
  weeklyPackagePrice: number;
  monthlyPackagePrice: number;
  customPackages?: {
    name: string;
    duration: number; // days
    price: number;
    description?: string;
  }[];
}

export interface AdminUser {
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
  accountType: 'admin';
  emailVerified: boolean;
  phoneVerified: boolean;
  marketingConsent: boolean;
  lastLogin: string | null;
  accountStatus: 'active' | 'suspended';
  failedLoginAttempts: number;
  lockedUntil: string | null;
}

export type AuthUser = User | BusinessUser | AdminUser;

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accountType: 'normal' | 'business' | 'admin' | null;
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
        
        const timeout = accountType === 'business' || accountType === 'admin' 
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
